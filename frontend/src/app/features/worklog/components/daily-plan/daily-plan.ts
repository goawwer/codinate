import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { Router } from '@angular/router';
import { TaskSuggestion } from '../../../task/types/task.model';
import { TaskCoreService } from '../../../task/service/task-core.service';
import { DailyPlanService } from '../../service/daily-plan.service';
import { DayPlanItem } from '../../types/worklog.model';
import { DAILYPLANIMPORTS } from './daily-plan.imports';

interface AddForm {
  plannedMinutes: number | null;
  description: string;
}

@Component({
  selector: 'app-daily-plan',
  imports: [DAILYPLANIMPORTS],
  templateUrl: './daily-plan.html',
  styleUrl: './daily-plan.scss',
})
export class DailyPlanComponent implements OnInit {
  private readonly planService = inject(DailyPlanService);
  private readonly translate = inject(TranslateService);
  private readonly taskService = inject(TaskCoreService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly items = this.planService.items;
  readonly order = signal(new Map<number, number>());
  readonly isFormVisible = signal(false);
  readonly expandedDescriptions = signal<Set<string>>(new Set());

  readonly descriptionLimit = 180;
  readonly form = signal<AddForm>({ plannedMinutes: null, description: '' });
  readonly editingItem = signal<DayPlanItem | null>(null);

  readonly searchText = signal('');
  readonly taskSuggestions = signal<TaskSuggestion[]>([]);
  readonly isLoadingSuggestions = signal(false);
  readonly resolvedTask = signal<TaskSuggestion | null>(null);

  readonly isEditing = computed(() => !!this.editingItem());

  readonly shouldShowSuggestions = computed(
    () => !this.resolvedTask() && this.taskSuggestions().length > 0,
  );

  readonly totalPlanned = computed(() =>
    this.items().reduce((sum, item) => sum + (item.plannedMinutes ?? 0), 0),
  );

  readonly doneCount = computed(() => this.items().filter((item) => item.done).length);

  private readonly searchText$ = toObservable(this.searchText);

  ngOnInit(): void {
    this.searchText$
      .pipe(
        debounceTime(200),
        map((v) => v.replace('#', '').trim()),
        distinctUntilChanged(),
        tap((q) => {
          if (!q) {
            this.taskSuggestions.set([]);
            this.isLoadingSuggestions.set(false);
          }
        }),
        filter((q) => q.length > 0),
        tap(() => this.isLoadingSuggestions.set(true)),
        switchMap((q) =>
          this.taskService.searchSuggestions(q, 8).pipe(
            catchError(() => of([])),
            finalize(() => this.isLoadingSuggestions.set(false)),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((tasks) => {
        if (!this.resolvedTask()) {
          this.taskSuggestions.set(tasks);
        }
      });
  }

  private createOrder(length: number): Map<number, number> {
    return new Map(Array.from({ length }, (_, index) => [index, index]));
  }

  updateOrder(order: Map<number, number>): void {
    const reordered = [...this.items()]
      .map((item, index) => ({
        item,
        pos: order.get(index) ?? index,
      }))
      .sort((a, b) => a.pos - b.pos)
      .map(({ item }) => item);

    this.items.set(reordered);
    this.order.set(this.createOrder(reordered.length));
  }

  addItem(newItem: DayPlanItem): void {
    this.items.update((items) => {
      const next = [...items, newItem];
      this.order.set(this.createOrder(next.length));
      return next;
    });
  }

  remove(id: string): void {
    this.items.update((items) => {
      const next = items.filter((item) => item.id !== id);
      this.order.set(this.createOrder(next.length));
      return next;
    });
  }

  toggleDone(id: string): void {
    this.items.update((items) =>
      items.map((item) => (item.id === id ? { ...item, done: !item.done } : item)),
    );
  }

  toggleForm(): void {
    this.isFormVisible.update((v) => !v);
    if (!this.isFormVisible()) {
      this.resetForm();
    }
  }

  startEdit(item: DayPlanItem): void {
    this.editingItem.set(item);

    if (item.taskId) {
      const identifierNum = parseInt(item.identifier.replace('#', ''), 10);
      this.resolvedTask.set({
        id: item.taskId,
        identifier: isNaN(identifierNum) ? 0 : identifierNum,
        title: item.title,
      });
      this.searchText.set(item.identifier);
    } else {
      this.searchText.set(item.title);
    }

    this.form.set({
      plannedMinutes: item.plannedMinutes ?? null,
      description: item.description ?? '',
    });

    this.isFormVisible.set(true);
  }

  onSearchTextChange(value: string): void {
    this.searchText.set(value);
    const current = this.resolvedTask();
    if (current && value !== `#${current.identifier}`) {
      this.resolvedTask.set(null);
    }
  }

  selectSuggestion(task: TaskSuggestion): void {
    this.resolvedTask.set(task);
    this.searchText.set(`#${task.identifier}`);
    this.taskSuggestions.set([]);
  }

  clearTask(): void {
    this.resolvedTask.set(null);
    this.searchText.set('');
  }

  navigateToTask(taskId: string): void {
    this.router.navigate(['/tasks', taskId]);
  }

  saveItem(): void {
    const resolved = this.resolvedTask();
    const title = resolved?.title ?? this.searchText().trim();
    if (!title) return;

    const f = this.form();
    const editing = this.editingItem();

    if (editing) {
      this.items.update((items) =>
        items.map((i) =>
          i.id === editing.id
            ? {
                ...i,
                taskId: resolved?.id ?? '',
                identifier: resolved ? `#${resolved.identifier}` : '—',
                title,
                plannedMinutes: f.plannedMinutes ?? undefined,
                description: f.description.trim() || undefined,
              }
            : i,
        ),
      );
    } else {
      const newItem: DayPlanItem = {
        id: crypto.randomUUID(),
        taskId: resolved?.id ?? '',
        identifier: resolved ? `#${resolved.identifier}` : '—',
        title,
        plannedMinutes: f.plannedMinutes ?? undefined,
        description: f.description.trim() || undefined,
      };
      this.items.update((items) => [...items, newItem]);
    }

    this.resetForm();
    this.isFormVisible.set(false);
  }

  clearPlan(): void {
    this.items.set([]);
    this.order.set(new Map());
  }

  isDescriptionLong(description: string): boolean {
    return description.length > this.descriptionLimit;
  }

  visibleDescription(item: DayPlanItem): string {
    if (!item.description) return '';
    if (this.expandedDescriptions().has(item.id)) return item.description;
    if (item.description.length <= this.descriptionLimit) return item.description;
    return `${item.description.slice(0, this.descriptionLimit).trim()}…`;
  }

  toggleDescription(id: string): void {
    this.expandedDescriptions.update((ids) => {
      const next = new Set(ids);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  priorityKey(priority?: DayPlanItem['priority']): string {
    return `models.worklog.dailyPlan.priority.${priority ?? 'default'}`;
  }

  minutesLabel(minutes?: number): string {
    if (!minutes) {
      return this.translate.instant('models.worklog.dailyPlan.noEstimate');
    }
    const hUnit = this.translate.instant('models.worklog.columns.hoursUnit');
    const mUnit = this.translate.instant('models.worklog.columns.minutesUnit');
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (!h) return `${m}${mUnit}`;
    if (!m) return `${h}${hUnit}`;
    return `${h}${hUnit} ${m}${mUnit}`;
  }

  updatePlannedMinutes(plannedMinutes: number | null): void {
    this.form.update((f) => ({ ...f, plannedMinutes }));
  }

  updateDescription(description: string): void {
    this.form.update((f) => ({ ...f, description }));
  }

  private resetForm(): void {
    this.form.set({ plannedMinutes: null, description: '' });
    this.searchText.set('');
    this.resolvedTask.set(null);
    this.taskSuggestions.set([]);
    this.editingItem.set(null);
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { HttpParams } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { forkJoin, map } from 'rxjs';
import { provideTuiEditor } from '@taiga-ui/editor';
import { tuiScrollbarOptionsProvider } from '@taiga-ui/core';
import { PROJECTDETAILSIMPORTS } from './project-detail.imports';
import { EDITOR_RU_PROVIDER } from '../../../../common/editor/editor-i18n';
import { ProjectApiService } from '../../service/project.service';
import { ReleaseService, Release } from '../../service/release.service';
import { TaskCoreService } from '../../../task/service/task-core.service';
import { AlertService } from '../../../../core/declarations/services/alert.service';
import { Project, ProjectLink } from '../../types/model/project.model';
import { Task } from '../../../task/types/task.model';
import { UserStore } from '../../../user/store/user.store';
import {
  ProjectDialogComponent,
  ProjectDialogData,
} from '../../../admin/components/projects/dialog/project-dialog.component';
import { AppDialogService } from '../../../../common/dialogs/dialog.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-project-detail',
  imports: [PROJECTDETAILSIMPORTS],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideTuiEditor(),
    EDITOR_RU_PROVIDER,
    tuiScrollbarOptionsProvider({ mode: 'hover' }),
  ],
})
export class ProjectDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly projectService = inject(ProjectApiService);
  private readonly releaseService = inject(ReleaseService);
  private readonly taskService = inject(TaskCoreService);
  private readonly alert = inject(AlertService);
  private readonly dialogs = inject(AppDialogService);
  private readonly translate = inject(TranslateService);
  protected readonly userStore = inject(UserStore);

  protected readonly routeId = toSignal(this.route.params.pipe(map((p) => p['id'] as string)));
  protected readonly numericId = computed(() => {
    const id = this.routeId();
    return id ? +id : null;
  });

  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly isEditing = signal(false);
  protected readonly linksEditing = signal(false);
  protected readonly activeTab = signal(0);
  protected readonly recentExpanded = signal(false);
  protected readonly linksExpanded = signal(false);

  protected readonly project = signal<Project | null>(null);
  protected readonly releases = signal<Release[]>([]);
  protected readonly tasks = signal<Task[]>([]);
  protected readonly editableLinks = signal<ProjectLink[]>([]);

  protected readonly descriptionControl = new FormControl('', { nonNullable: true });

  protected readonly RELEASE_TASKS_LIMIT = 3;

  protected readonly recentTasks = computed(() => this.tasks().slice(0, 5));

  protected readonly expandedReleases = signal<Set<string>>(new Set());

  ngOnInit(): void {
    const id = this.numericId();
    if (!id) return;

    forkJoin([
      this.projectService.getById(id),
      this.releaseService.getByProject(id),
      this.taskService.getAll(new HttpParams().set('projectId', id)),
    ]).subscribe({
      next: ([project, releases, tasks]) => {
        this.project.set(project);
        this.releases.set(releases ?? []);
        this.tasks.set(tasks ?? []);
        this.descriptionControl.setValue(project.projectDescription ?? '');
        this.isLoading.set(false);
      },
      error: () => {
        this.alert.error('Failed to load project');
        this.isLoading.set(false);
      },
    });
  }

  protected toggleEditing(): void {
    if (this.isEditing()) {
      this.descriptionControl.setValue(this.project()?.projectDescription ?? '');
    }
    this.isEditing.update((v) => !v);
  }

  protected save(): void {
    const id = this.numericId();
    if (!id) return;
    this.isSaving.set(true);
    this.projectService.update(id, { description: this.descriptionControl.value }).subscribe({
      next: () => {
        this.project.update((p) =>
          p ? { ...p, projectDescription: this.descriptionControl.value } : p,
        );
        this.isEditing.set(false);
        this.isSaving.set(false);
      },
      error: () => {
        this.alert.error('Failed to save description');
        this.isSaving.set(false);
      },
    });
  }

  protected toggleLinksEditing(): void {
    if (!this.linksEditing()) {
      this.editableLinks.set((this.project()?.links ?? []).map((l) => ({ ...l })));
      this.linksExpanded.set(true);
    }
    this.linksEditing.update((v) => !v);
  }

  protected addLink(): void {
    this.editableLinks.update((links) => [...links, { title: '', url: '' }]);
  }

  protected removeLink(index: number): void {
    this.editableLinks.update((links) => links.filter((_, i) => i !== index));
  }

  protected updateLinkField(index: number, field: 'title' | 'url', value: string): void {
    this.editableLinks.update((links) =>
      links.map((l, i) => (i === index ? { ...l, [field]: value } : l)),
    );
  }

  protected saveLinks(): void {
    const id = this.numericId();
    if (!id) return;
    const links = this.editableLinks();
    this.projectService.updateLinks(id, links).subscribe({
      next: () => {
        this.project.update((p) => (p ? { ...p, links } : p));
        this.linksEditing.set(false);
      },
      error: () => this.alert.error('Failed to save links'),
    });
  }

  protected releaseProgress(releaseTitle: string): number {
    const total = this.totalCount(releaseTitle);
    return total > 0 ? (this.closedCount(releaseTitle) / total) * 100 : 0;
  }

  protected closedCount(releaseTitle: string): number {
    return this.tasks().filter(
      (t) =>
        t.projectRelease === releaseTitle &&
        t.closedAt != null &&
        !String(t.closedAt).startsWith('0001'),
    ).length;
  }

  protected totalCount(releaseTitle: string): number {
    return this.tasks().filter((t) => t.projectRelease === releaseTitle).length;
  }

  protected releaseTasks(releaseTitle: string): Task[] {
    return this.tasks().filter((t) => t.projectRelease === releaseTitle);
  }

  protected releaseTasksVisible(releaseTitle: string): Task[] {
    const tasks = this.releaseTasks(releaseTitle);
    return this.expandedReleases().has(releaseTitle)
      ? tasks
      : tasks.slice(0, this.RELEASE_TASKS_LIMIT);
  }

  protected toggleReleaseExpanded(releaseTitle: string): void {
    this.expandedReleases.update((set) => {
      const next = new Set(set);
      next.has(releaseTitle) ? next.delete(releaseTitle) : next.add(releaseTitle);
      return next;
    });
  }

  protected openEditDialog(project: Project): void {
    this.dialogs
      .component<ProjectDialogComponent, void, ProjectDialogData>(ProjectDialogComponent, {
        label: this.translate.instant('admin.dashboard.projects.dialogs.editTitle'),
        size: 'l',
        data: { project },
      })
      .subscribe();
  }

  protected isTaskClosed(task: Task): boolean {
    return !!task.closedAt && !String(task.closedAt).startsWith('0001');
  }

  protected validDate(dateStr: string | null | undefined): boolean {
    return !!dateStr && !String(dateStr).startsWith('0001');
  }
}

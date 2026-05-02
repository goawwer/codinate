import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { filter } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { AppDialogService } from '../../../../../common/dialogs/dialog.service';
import { Project } from '../../../../project/types/model/project.model';
import { ProjectStore } from '../../../../project/store/project.store';
import { PROJECTSDASHBOARDIMPORTS } from './admin-projects.imports';
import { APP_SIZE, AppSize } from '../../../../../core/declarations/tokens/size.token';
import {
  ProjectDialogComponent,
  ProjectDialogData,
} from '../../../../project/components/dialog/project-dialog.component';

type Column = {
  key: keyof Project;
  isDate?: boolean;
  isMembers?: boolean;
  width?: string;
};

@Component({
  selector: 'app-admin-projects',
  imports: [PROJECTSDASHBOARDIMPORTS],
  providers: [{ provide: APP_SIZE, useValue: 'l' }],
  templateUrl: './admin-projects.html',
  styleUrl: './admin-projects.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminProjects implements OnInit {
  readonly store = inject(ProjectStore);
  private readonly dialogs = inject(AppDialogService);
  private readonly translate = inject(TranslateService);
  protected readonly tableSize = inject(APP_SIZE);
  protected readonly inputSize: AppSize = 'm';

  protected readonly columns: Column[] = [
    { key: 'projectName', width: '10rem' },
    { key: 'projectDescription', width: '14rem' },
    { key: 'members', isMembers: true, width: '10rem' },
    { key: 'authorName', width: '8rem' },
    { key: 'createdAt', isDate: true, width: '10rem' },
    { key: 'updatedAt', isDate: true, width: '10rem' },
  ];

  protected readonly searchQuery = signal('');
  protected readonly filteredProjects = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const projects = this.store.projects();
    if (!q) return projects;

    return projects.filter(
      (p) =>
        p.projectName.toLowerCase().includes(q) ||
        p.projectDescription.toLowerCase().includes(q) ||
        p.authorName.toLowerCase().includes(q),
    );
  });

  protected readonly selectedIds = signal(new Set<number>());
  protected readonly hasSelection = computed(() => this.selectedIds().size > 0);

  protected isSelected(id: number): boolean {
    return this.selectedIds().has(id);
  }

  protected toggleProject(id: number, checked: boolean): void {
    this.selectedIds.update((set) => {
      const next = new Set(set);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }

  protected toggleAll(checked: boolean): void {
    this.selectedIds.update(() => {
      if (!checked) return new Set<number>();
      return new Set(this.filteredProjects().map((p) => p.id));
    });
  }

  protected allSelected(): boolean {
    const projects = this.filteredProjects();
    return projects.length > 0 && projects.every((p) => this.selectedIds().has(p.id));
  }

  protected openCreateDialog(): void {
    this.dialogs
      .component<ProjectDialogComponent, void, ProjectDialogData>(ProjectDialogComponent, {
        label: this.translate.instant('admin.dashboard.projects.dialogs.createTitle'),
        size: 'l',
        data: { project: null },
      })
      .subscribe();
  }

  protected confirmDelete(): void {
    const count = this.selectedIds().size;
    this.dialogs
      .confirm({
        label: this.translate.instant('admin.dashboard.projects.dialogs.deleteTitle'),
        content: this.translate.instant('admin.dashboard.projects.dialogs.deleteContent', {
          count,
        }),
        yes: this.translate.instant('generic.actions.delete'),
        no: this.translate.instant('generic.actions.cancel'),
      })
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.store.deleteProjects([...this.selectedIds()]);
        this.selectedIds.set(new Set());
      });
  }

  ngOnInit(): void {
    this.store.loadProjects();
  }
}

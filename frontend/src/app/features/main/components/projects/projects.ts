import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TuiBlockStatus } from '@taiga-ui/layout';
import { TuiIcon, tuiLoaderOptionsProvider, TuiTextfield, TuiButton } from '@taiga-ui/core';
import { AppSize } from '../../../../core/declarations/tokens/size.token';
import { ProjectStore } from '../../../project/store/project.store';
import { AppPicture } from '../../../../common/picture/app-picture';
import { AppDatePipe } from '../../../../common/pipes/app-date.pipe';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { TuiLoader } from '@taiga-ui/core';
import { UserStore } from '../../../user/store/user.store';
import {
  ProjectDialogComponent,
  ProjectDialogData,
} from '../../../project/components/dialog/project-dialog.component';
import { AppDialogService } from '../../../../common/dialogs/dialog.service';

@Component({
  selector: 'app-projects',
  imports: [
    TuiTextfield,
    TuiIcon,
    FormsModule,
    AppPicture,
    AppDatePipe,
    RouterLink,
    TuiBlockStatus,
    TranslatePipe,
    TuiLoader,
    TuiButton,
  ],
  templateUrl: './projects.html',
  styleUrl: './projects.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    tuiLoaderOptionsProvider({
      size: 'l',
      inheritColor: false,
      overlay: true,
    }),
  ],
})
export class AllProjectsComponent implements OnInit {
  protected readonly inputSize: AppSize = 'm';
  private readonly store = inject(ProjectStore);
  private readonly userStore = inject(UserStore);
  private readonly dialogs = inject(AppDialogService);
  private readonly translate = inject(TranslateService);

  protected readonly searchQuery = signal('');
  protected readonly isLoading = this.store.isLoading;
  protected readonly isAdmin = computed(() => this.userStore.isAtLeastAdmin());

  protected readonly filteredProjects = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const projects = this.store.projects();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.projectName.toLowerCase().includes(q) ||
        (p.projectDescription ?? '').toLowerCase().includes(q),
    );
  });

  protected openCreateDialog(): void {
    this.dialogs
      .component<ProjectDialogComponent, void, ProjectDialogData>(ProjectDialogComponent, {
        label: this.translate.instant('admin.dashboard.projects.dialogs.createTitle'),
        size: 'l',
        data: { project: null },
      })
      .subscribe();
  }

  ngOnInit(): void {
    this.store.loadProjects();
  }
}

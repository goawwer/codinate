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
import { TuiIcon, tuiLoaderOptionsProvider, TuiTextfield } from '@taiga-ui/core';
import { AppSize } from '../../../../core/declarations/tokens/size.token';
import { ProjectStore } from '../../../project/store/project.store';
import { AppPicture } from '../../../../common/picture/app-picture';
import { AppDatePipe } from '../../../../common/pipes/app-date.pipe';
import { TranslatePipe } from '@ngx-translate/core';
import { TuiLoader } from '@taiga-ui/core';
import { LowerCasePipe } from '@angular/common';

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

  protected readonly searchQuery = signal('');
  protected readonly isLoading = this.store.isLoading;

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

  ngOnInit(): void {
    this.store.loadProjects();
  }
}

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
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, forkJoin, map } from 'rxjs';
import { provideTuiEditor } from '@taiga-ui/editor';
import { tuiScrollbarOptionsProvider } from '@taiga-ui/core';
import { TEAMDETAILIMPORTS } from './team-detail.imports';
import { EDITOR_RU_PROVIDER } from '../../../../common/editor/editor-i18n';
import { TeamApiService } from '../../service/team.service';
import { Team, TeamLink } from '../../types/model/team.model';
import { UserStore } from '../../../user/store/user.store';
import { AppDialogService } from '../../../../common/dialogs/dialog.service';
import { TranslateService } from '@ngx-translate/core';
import { AlertService } from '../../../../core/declarations/services/alert.service';
import { TeamDialogComponent, TeamDialogData } from '../dialog/team-dialog.component';
import { PostService } from '../../../post/service/post.service';
import {
  PostDialogComponent,
  PostDialogData,
} from '../../../post/components/dialog/post-dialog.component';
import {
  CreatePostDialogComponent,
  CreatePostDialogData,
} from '../../../post/components/create-post-dialog/create-post-dialog.component';
import { Post } from '../../../post/types/post.model';
import { TaskCoreService } from '../../../task/service/task-core.service';
import { TaskDialogComponent } from '../../../task/components/dialog/task-dialog.component';
import { Task } from '../../../task/types/task.model';

@Component({
  selector: 'app-team-detail',
  imports: [TEAMDETAILIMPORTS],
  templateUrl: './team-detail.html',
  styleUrl: './team-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideTuiEditor(),
    EDITOR_RU_PROVIDER,
    tuiScrollbarOptionsProvider({ mode: 'hover' }),
  ],
})
export class TeamDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly teamApiService = inject(TeamApiService);
  private readonly taskService = inject(TaskCoreService);
  private readonly alert = inject(AlertService);
  private readonly dialogs = inject(AppDialogService);
  private readonly translate = inject(TranslateService);
  private readonly postService = inject(PostService);
  protected readonly userStore = inject(UserStore);

  protected readonly routeId = toSignal(this.route.params.pipe(map((p) => p['id'] as string)));
  protected readonly numericId = computed(() => {
    const id = this.routeId();
    return id ? +id : null;
  });

  protected readonly isLoading = signal(true);
  protected readonly activeTab = signal(0);
  protected readonly posts = signal<Post[]>([]);
  protected readonly isPostsLoading = signal(false);
  protected readonly tasks = signal<Task[]>([]);
  protected readonly createMenuOpen = signal(false);
  protected readonly recentExpanded = signal(false);
  protected readonly linksExpanded = signal(false);
  protected readonly linksEditing = signal(false);
  protected readonly isEditing = signal(false);
  protected readonly isSaving = signal(false);

  protected readonly team = signal<Team | null>(null);
  protected readonly editableLinks = signal<TeamLink[]>([]);
  protected readonly descriptionControl = new FormControl('', { nonNullable: true });

  protected readonly recentTasks = computed(() => this.tasks().slice(0, 5));
  protected readonly recentPosts = computed(() => this.posts().slice(0, 5));

  ngOnInit(): void {
    const id = this.numericId();
    if (!id) return;

    forkJoin([
      this.teamApiService.getById(id),
      this.taskService.getAll(new HttpParams().set('teamId', id)),
    ]).subscribe({
      next: ([team, tasks]) => {
        this.team.set(team);
        this.tasks.set(tasks ?? []);
        this.descriptionControl.setValue(team.description ?? '');
        this.isLoading.set(false);
      },
      error: () => {
        this.alert.error('Failed to load team');
        this.isLoading.set(false);
      },
    });

    this.isPostsLoading.set(true);
    this.postService.getByTeam(id).subscribe({
      next: (posts) => {
        this.posts.set(posts);
        this.isPostsLoading.set(false);
      },
      error: () => this.isPostsLoading.set(false),
    });
  }

  protected toggleEditing(): void {
    if (!this.isEditing()) {
      this.descriptionControl.setValue(this.team()?.description ?? '');
    }
    this.isEditing.update((v) => !v);
  }

  protected save(): void {
    const id = this.numericId();
    if (!id) return;
    this.isSaving.set(true);
    this.teamApiService.update(id, { description: this.descriptionControl.value }).subscribe({
      next: () => {
        this.team.update((t) => (t ? { ...t, description: this.descriptionControl.value } : t));
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
      this.editableLinks.set((this.team()?.links ?? []).map((l) => ({ ...l })));
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
    this.teamApiService.updateLinks(id, links).subscribe({
      next: () => {
        this.team.update((t) => (t ? { ...t, links } : t));
        this.linksEditing.set(false);
      },
      error: () => this.alert.error('Failed to save links'),
    });
  }

  protected openPostDialog(post: Post): void {
    const id = this.numericId();
    this.dialogs
      .component<PostDialogComponent, void, PostDialogData>(PostDialogComponent, {
        label: post.title,
        size: 'l',
        data: {
          post,
          contextParents: id ? [{ postParentType: 'team', parentId: id }] : undefined,
        },
      })
      .subscribe();
  }

  protected openCreatePostDialog(): void {
    const id = this.numericId();
    if (!id) return;
    this.dialogs
      .component<CreatePostDialogComponent, boolean, CreatePostDialogData>(
        CreatePostDialogComponent,
        {
          label: this.translate.instant('feed.posts.create'),
          size: 'l',
          data: { lockedParents: [{ type: 'team', id, name: this.team()?.name ?? '' }] },
        },
      )
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.isPostsLoading.set(true);
        this.postService.getByTeam(id).subscribe({
          next: (posts) => {
            this.posts.set(posts);
            this.isPostsLoading.set(false);
          },
          error: () => this.isPostsLoading.set(false),
        });
      });
  }

  protected openCreateTaskDialog(): void {
    this.createMenuOpen.set(false);
    this.dialogs
      .component<TaskDialogComponent, boolean>(TaskDialogComponent, {
        label: this.translate.instant('generic.actions.create', {
          value: this.translate.instant('models.task.title.accusative'),
        }),
        size: 'fullscreen',
      })
      .pipe(filter(Boolean))
      .subscribe();
  }

  protected openEditDialog(): void {
    const t = this.team();
    if (!t) return;
    this.dialogs
      .component<TeamDialogComponent, void, TeamDialogData>(TeamDialogComponent, {
        label: this.translate.instant('admin.dashboard.teams.dialogs.editTitle'),
        size: 'l',
        data: { team: t },
      })
      .subscribe();
  }

  protected openMentionProfile(userId: string): void {
    void this.router.navigate(['/users', userId]);
  }
}

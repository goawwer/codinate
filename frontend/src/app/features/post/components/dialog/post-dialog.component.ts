import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { TuiDialogContext } from '@taiga-ui/core';
import { injectContext } from '@taiga-ui/polymorpheus';
import { filter, forkJoin, startWith } from 'rxjs';
import { POST_DIALOG_IMPORTS } from './post-dialog.imports';
import { Post, PostComment, PostParent, UpdatePostInput } from '../../types/post.model';
import { PostService } from '../../service/post.service';
import { ProjectApiService } from '../../../project/service/project.service';
import { Project } from '../../../project/types/model/project.model';
import { TeamApiService } from '../../../team/service/team.service';
import { Team } from '../../../team/types/model/team.model';
import { UserStore } from '../../../user/store/user.store';
import { AppDialogService } from '../../../../common/dialogs/dialog.service';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';

export interface PostDialogData {
  post: Post;
  contextParents?: PostParent[];
  highlightCommentId?: string;
}

@Component({
  selector: 'app-post-dialog',
  standalone: true,
  imports: [POST_DIALOG_IMPORTS],
  templateUrl: './post-dialog.html',
  styleUrl: './post-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostDialogComponent implements OnInit {
  private readonly postService = inject(PostService);
  private readonly projectsService = inject(ProjectApiService);
  private readonly teamsService = inject(TeamApiService);
  private readonly userStore = inject(UserStore);
  private readonly dialogs = inject(AppDialogService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  protected readonly context = injectContext<TuiDialogContext<boolean, PostDialogData>>();

  protected readonly post = this.context.data.post;
  protected readonly highlightCommentId = this.context.data.highlightCommentId;
  protected readonly comments = signal<PostComment[]>([]);
  protected readonly isLoadingComments = signal(true);
  protected readonly isSubmitting = signal(false);
  protected readonly commentControl = new FormControl('', { nonNullable: true });

  protected readonly isEditing = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly isLoadingEntities = signal(false);
  protected readonly projects = signal<Project[]>([]);
  protected readonly teams = signal<Team[]>([]);

  private entitiesLoaded = false;

  protected readonly editForm = new FormGroup({
    title: new FormControl(this.post.title, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    body: new FormControl(this.post.body, { nonNullable: true, validators: [Validators.required] }),
    parents: new FormControl<(Project | Team)[]>([], { nonNullable: true }),
  });

  protected readonly formValue = toSignal(
    this.editForm.valueChanges.pipe(startWith(this.editForm.getRawValue())),
    { initialValue: this.editForm.getRawValue() },
  );

  protected readonly stringifyEntity = (e: Project | Team): string =>
    'projectName' in e ? e.projectName : e.name;

  protected readonly parentLabel = computed(() => {
    const selected = this.formValue().parents ?? [];
    if (!selected.length) return this.translate.instant('feed.posts.form.postTo');
    if (selected.length === 1) return this.stringifyEntity(selected[0]);
    return `${this.translate.instant('feed.posts.form.postTo')} (${selected.length})`;
  });

  protected readonly canModify = computed(() => {
    const user = this.userStore.user();
    if (!user) return false;
    return user.username === this.post.authorUsername || this.userStore.isAtLeastAdmin();
  });

  ngOnInit(): void {
    this.postService.getComments(this.post.id).subscribe((comments) => {
      this.comments.set(comments);
      this.isLoadingComments.set(false);
    });
  }

  protected submitComment(): void {
    const body = this.commentControl.value.trim();
    if (!body) return;
    this.isSubmitting.set(true);
    this.postService.addComment(this.post.id, body).subscribe({
      next: (comment) => {
        this.comments.update((list) => [...list, comment]);
        this.commentControl.reset();
        this.isSubmitting.set(false);
      },
      error: () => this.isSubmitting.set(false),
    });
  }

  protected startEdit(): void {
    this.editForm.patchValue({ title: this.post.title, body: this.post.body });
    this.isEditing.set(true);
    this.loadEntities();
  }

  private loadEntities(): void {
    if (this.entitiesLoaded) return;
    this.isLoadingEntities.set(true);
    forkJoin([this.projectsService.getAll(), this.teamsService.getAll()]).subscribe({
      next: ([projects, teams]) => {
        this.projects.set(projects);
        this.teams.set(teams);
        this.isLoadingEntities.set(false);
        this.entitiesLoaded = true;
        this.preselectContextParents(projects, teams);
      },
      error: () => this.isLoadingEntities.set(false),
    });
  }

  private preselectContextParents(projects: Project[], teams: Team[]): void {
    const contextParents = this.context.data.contextParents;
    if (!contextParents?.length) return;
    const preSelected = contextParents
      .map((cp) =>
        cp.postParentType === 'project'
          ? projects.find((p) => p.id === cp.parentId)
          : teams.find((t) => t.id === cp.parentId),
      )
      .filter((e): e is Project | Team => !!e);
    if (preSelected.length) {
      this.editForm.controls.parents.setValue(preSelected);
    }
  }

  protected cancelEdit(): void {
    this.isEditing.set(false);
  }

  protected saveEdit(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const v = this.editForm.getRawValue();
    this.isSaving.set(true);

    const input: UpdatePostInput = { title: v.title, body: v.body };
    if (v.parents.length) {
      input.parents = v.parents.map((e) => ({
        postParentType: ('projectName' in e ? 'project' : 'team') as 'project' | 'team',
        parentId: e.id,
      }));
    }

    this.postService.update(this.post.id, input).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.context.completeWith(true);
      },
      error: () => this.isSaving.set(false),
    });
  }

  protected confirmDelete(): void {
    const model = this.translate.instant('feed.posts.title').toLowerCase();
    this.dialogs
      .confirm({
        label: this.translate.instant('generic.actions.deleteModel', { model }),
        content: this.translate.instant('generic.actions.deleteConfirm', { model }),
        yes: this.translate.instant('generic.actions.delete'),
        no: this.translate.instant('generic.actions.cancel'),
      })
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.postService.delete(this.post.id).subscribe({
          next: () => this.context.completeWith(true),
        });
      });
  }

  protected openMentionProfile(userId: string): void {
    this.context.completeWith(false);
    void this.router.navigate(['/users', userId]);
  }

  protected closeDialogOnMention(): void {
    this.context.completeWith(false);
  }
}

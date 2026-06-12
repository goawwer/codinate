import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  Signal,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TuiDialogContext } from '@taiga-ui/core';
import { injectContext } from '@taiga-ui/polymorpheus';
import { toSignal } from '@angular/core/rxjs-interop';
import { forkJoin, startWith, switchMap } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { CREATE_POST_DIALOG_IMPORTS } from './create-post-dialog.imports';
import { CreatePostInput, Post, UpdatePostInput } from '../../types/post.model';
import { PostService } from '../../service/post.service';
import { ProjectApiService } from '../../../project/service/project.service';
import { Project } from '../../../project/types/model/project.model';
import { TeamApiService } from '../../../team/service/team.service';
import { Team } from '../../../team/types/model/team.model';
import { UserStore } from '../../../user/store/user.store';
import {
  PendingEditorUploads,
  PendingFile,
} from '../../../../common/editor/pending-editor-uploads.service';

export interface LockedParent {
  type: 'team' | 'project';
  id: number;
  name: string;
}

export interface CreatePostDialogData {
  lockedParents?: LockedParent[];
  editPost?: Post;
}

@Component({
  selector: 'app-create-post-dialog',
  standalone: true,
  imports: [CREATE_POST_DIALOG_IMPORTS],
  templateUrl: './create-post-dialog.html',
  styleUrl: './create-post-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreatePostDialogComponent implements OnInit, OnDestroy {
  private readonly postService = inject(PostService);
  private readonly projectsService = inject(ProjectApiService);
  private readonly teamsService = inject(TeamApiService);
  private readonly userStore = inject(UserStore);
  private readonly translate = inject(TranslateService);
  private readonly pendingUploads = inject(PendingEditorUploads);
  protected readonly pendingFiles: Signal<PendingFile[]> = this.pendingUploads.pending;

  protected readonly context =
    injectContext<TuiDialogContext<boolean, CreatePostDialogData | undefined>>();

  protected readonly isEditMode = !!(this.context.data?.editPost);

  protected readonly form = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    body: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    parents: new FormControl<(Project | Team)[]>([], { nonNullable: true }),
  });

  protected readonly formValue = toSignal(
    this.form.valueChanges.pipe(startWith(this.form.getRawValue())),
    { initialValue: this.form.getRawValue() },
  );

  protected readonly projects = signal<Project[]>([]);
  protected readonly teams = signal<Team[]>([]);
  protected readonly isSubmitting = signal(false);
  protected readonly isLoadingEntities = signal(false);

  protected readonly stringifyEntity = (e: Project | Team): string =>
    'projectName' in e ? e.projectName : e.name;

  protected readonly hasLockedParents = computed(
    () => (this.context.data?.lockedParents?.length ?? 0) > 0 || this.isEditMode,
  );

  protected readonly parentLabel = computed(() => {
    if (this.hasLockedParents()) {
      const locked = this.context.data?.lockedParents;
      if (locked?.length === 1) return locked[0].name;
      if (locked?.length) return `${locked.length} ${this.translate.instant('feed.posts.form.postTo')}`;
      if (this.isEditMode) return this.translate.instant('feed.posts.form.postTo');
    }

    const selected = this.formValue().parents ?? [];
    if (!selected.length) return this.translate.instant('feed.posts.form.postTo');
    if (selected.length === 1) return this.stringifyEntity(selected[0]);
    return `${this.translate.instant('feed.posts.form.postTo')} (${selected.length})`;
  });

  ngOnDestroy(): void {
    this.pendingUploads.clear();
  }

  ngOnInit(): void {
    const editPost = this.context.data?.editPost;
    if (editPost) {
      this.form.patchValue({ title: editPost.title, body: editPost.body });
    }

    if (this.isEditMode) return;

    this.isLoadingEntities.set(true);
    forkJoin([this.projectsService.getAll(), this.teamsService.getAll()]).subscribe({
      next: ([projects, teams]) => {
        this.projects.set(projects);
        this.teams.set(teams);
        this.isLoadingEntities.set(false);

        const locked = this.context.data?.lockedParents ?? [];
        if (locked.length) {
          const preSelected = locked
            .map(lp =>
              lp.type === 'project'
                ? projects.find(p => p.id === lp.id)
                : teams.find(t => t.id === lp.id),
            )
            .filter((e): e is Project | Team => !!e);
          this.form.controls.parents.setValue(preSelected);
        }
      },
      error: () => this.isLoadingEntities.set(false),
    });
  }

  protected removeFile(blobUrl: string): void {
    this.pendingUploads.remove(blobUrl);
    const desc = this.form.controls.body.value;
    const escaped = blobUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const cleaned = desc
      .replace(new RegExp(`<img[^>]+src="${escaped}"[^>]*/?>`, 'gi'), '')
      .replace(new RegExp(`<a[^>]+href="${escaped}"[^>]*>[\\s\\S]*?<\\/a>`, 'gi'), '');
    if (cleaned !== desc) {
      this.form.controls.body.setValue(cleaned);
    }
  }

  protected isImage(type: string): boolean {
    return type.startsWith('image/');
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    this.isSubmitting.set(true);

    if (this.isEditMode) {
      const editPost = this.context.data!.editPost!;
      this.pendingUploads
        .flush('posts', editPost.id, v.body)
        .pipe(
          switchMap((body) => {
            const input: UpdatePostInput = { title: v.title, body };
            return this.postService.update(editPost.id, input);
          }),
        )
        .subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.context.completeWith(true);
          },
          error: () => this.isSubmitting.set(false),
        });
      return;
    }

    const selectedEntities = v.parents;
    if (!selectedEntities.length) return;

    const userId = this.userStore.user()?.id;
    if (!userId) return;

    const postId = crypto.randomUUID();
    const pendingFiles = this.pendingUploads.pending();

    this.pendingUploads
      .flush('posts', postId, v.body)
      .pipe(
        switchMap((body) => {
          const input: CreatePostInput = {
            id: postId,
            authorId: userId,
            parents: selectedEntities.map(e => ({
              postParentType: ('projectName' in e ? 'project' : 'team') as 'project' | 'team',
              parentId: e.id,
            })),
            postType: 'basic',
            title: v.title,
            body,
            attachedFiles: pendingFiles.map((file) => ({
              id: file.fileId,
              name: file.name,
              size: file.size,
            })),
          };
          return this.postService.create(input);
        }),
      )
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.context.completeWith(true);
        },
        error: () => this.isSubmitting.set(false),
      });
  }
}

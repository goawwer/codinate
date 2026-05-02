import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Input,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { of, switchMap } from 'rxjs';
import { TuiButton, TuiIcon, TuiLoader, tuiLoaderOptionsProvider } from '@taiga-ui/core';
import { provideTuiEditor } from '@taiga-ui/editor';
import { CommentItem } from '../comment-item/comment-item';
import { CommentService } from '../comment.service';
import { Comment, CommentEntityType } from './../comment.model';
import { UserStore } from '../../../features/user/store/user.store';
import { AppEditorComponent } from '../../editor/app-editor.component';
import { AppPicture } from '../../picture/app-picture';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PendingEditorUploads } from '../../editor/pending-editor-uploads.service';
import { AlertService } from '../../../core/declarations/services/alert.service';

@Component({
  selector: 'app-comment-list',
  standalone: true,
  imports: [
    CommentItem,
    ReactiveFormsModule,
    TuiButton,
    TuiIcon,
    AppEditorComponent,
    TuiLoader,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './comment-list.html',
  styleUrl: './comment-list.scss',
  providers: [
    provideTuiEditor(),
    tuiLoaderOptionsProvider({
      size: 'l',
      inheritColor: false,
      overlay: true,
    }),
  ],
})
export class CommentList implements OnInit {
  @Input({ required: true }) entityType!: CommentEntityType;
  @Input({ required: true }) entityId!: string;

  @ViewChild('commentTop') private commentTop!: ElementRef<HTMLElement>;
  @ViewChild('commentBottom') private commentBottom!: ElementRef<HTMLElement>;

  private readonly commentService = inject(CommentService);
  private readonly pendingUploads = inject(PendingEditorUploads);
  private readonly alert = inject(AlertService);
  private readonly translate = inject(TranslateService);
  protected readonly userStore = inject(UserStore);

  protected readonly comments = signal<Comment[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly isInputActive = signal(false);
  protected readonly newCommentControl = new FormControl('', { nonNullable: true });

  protected readonly currentUserId = computed(() => this.userStore.user()?.id ?? '');
  protected readonly isAdmin = computed(() => this.userStore.isAtLeastAdmin());

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.isLoading.set(true);
    this.commentService.getByEntity(this.entityType, this.entityId).subscribe({
      next: (comments) => {
        this.comments.set(comments);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  protected readonly canScroll = computed(() => this.comments().length >= 3);

  protected scrollToTop(): void {
    this.commentTop.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected scrollToBottom(): void {
    this.commentBottom.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  protected activateInput(): void {
    this.isInputActive.set(true);
  }

  protected cancelInput(): void {
    this.pendingUploads.clear();
    this.isInputActive.set(false);
    this.newCommentControl.reset();
  }

  protected submit(): void {
    const body = this.newCommentControl.value.trim();
    if (!body || this.isSubmitting()) return;

    const pendingFiles = this.pendingUploads.getPendingInHtml(body);

    this.isSubmitting.set(true);
    this.commentService
      .add({ entityType: this.entityType, entityId: this.entityId, body })
      .pipe(
        switchMap(({ id }) =>
          this.pendingUploads.flush('comments', id, body).pipe(
            switchMap((flushedBody) =>
              flushedBody !== body
                ? this.commentService.update(id, {
                    body: flushedBody,
                    attachedFiles: pendingFiles.map((f) => ({ id: f.fileId, name: f.name })),
                  })
                : of(void 0),
            ),
          ),
        ),
      )
      .subscribe({
        next: () => {
          this.newCommentControl.reset();
          this.isInputActive.set(false);
          this.isSubmitting.set(false);
          this.load();
        },
        error: () => this.isSubmitting.set(false),
      });
  }

  protected onUpdated(event: {
    id: string;
    body: string;
    attachedFiles?: { id: string; name: string }[];
  }): void {
    this.commentService
      .update(event.id, { body: event.body, attachedFiles: event.attachedFiles })
      .subscribe({
        next: () => {
          this.alert.success(this.translate.instant('cmd.comments.success.updated'));
          this.load();
        },
      });
  }

  protected onDeleted(id: string): void {
    this.commentService.delete(id).subscribe({
      next: () => {
        this.alert.success(this.translate.instant('cmd.comments.success.deleted'));
        this.comments.update((list) => list.filter((c) => c.id !== id));
      },
    });
  }
}

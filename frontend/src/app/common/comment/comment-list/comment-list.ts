import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  signal,
  ViewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { switchMap } from 'rxjs';
import { Router } from '@angular/router';
import { TuiButton, TuiIcon, TuiLoader, tuiLoaderOptionsProvider } from '@taiga-ui/core';
import { CommentItem } from '../comment-item/comment-item';
import { CommentService } from '../comment.service';
import { Comment, CommentEntityType, UpdateCommentInput } from './../comment.model';
import { UserStore } from '../../../features/user/store/user.store';
import { AppEditorComponent } from '../../editor/app-editor.component';
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
  @Input() hideComposer = false;
  @Input() highlightCommentId?: string;
  @Output() filesChanged = new EventEmitter<void>();
  @Output() mentionClicked = new EventEmitter<string>();

  @ViewChild('commentTop') private commentTop!: ElementRef<HTMLElement>;
  @ViewChild('commentBottom') private commentBottom!: ElementRef<HTMLElement>;

  private readonly commentService = inject(CommentService);
  private readonly pendingUploads = inject(PendingEditorUploads);
  private readonly router = inject(Router);
  private readonly alert = inject(AlertService);
  private readonly translate = inject(TranslateService);
  protected readonly userStore = inject(UserStore);

  protected readonly comments = signal<Comment[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly isInputActive = signal(false);
  protected readonly newCommentControl = new FormControl('', { nonNullable: true });

  protected readonly pendingFiles = this.pendingUploads.pending;
  protected readonly currentUserId = computed(() => this.userStore.user()?.id ?? '');
  protected readonly isAdmin = computed(() => this.userStore.isAtLeastAdmin());

  ngOnInit(): void {
    this.load();
  }

  reload(): void {
    this.load();
  }

  private load(): void {
    this.isLoading.set(true);
    this.commentService.getByEntity(this.entityType, this.entityId).subscribe({
      next: (comments) => {
        this.comments.set(comments);
        this.isLoading.set(false);
        if (this.highlightCommentId) {
          setTimeout(() => {
            document
              .getElementById('comment-' + this.highlightCommentId)
              ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 150);
        }
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

  protected isImage(type: string): boolean {
    return type.startsWith('image/');
  }

  protected removeFile(blobUrl: string): void {
    this.pendingUploads.remove(blobUrl);
  }

  protected cancelInput(): void {
    this.pendingUploads.clear();
    this.isInputActive.set(false);
    this.newCommentControl.reset();
  }

  protected submit(): void {
    const body = this.newCommentControl.value.trim();
    if (!body || this.isSubmitting()) return;

    const commentId = crypto.randomUUID();
    const pendingFiles = this.pendingUploads.pending();

    this.isSubmitting.set(true);
    this.pendingUploads
      .flush(this.entityType + 's', this.entityId, body)
      .pipe(
        switchMap((flushedBody) =>
          this.commentService.add({
            id: commentId,
            entityType: this.entityType,
            entityId: this.entityId,
            body: flushedBody,
            attachedFiles: pendingFiles.map((f) => ({ id: f.fileId, name: f.name })),
          }),
        ),
      )
      .subscribe({
        next: () => {
          this.newCommentControl.reset();
          this.isInputActive.set(false);
          this.isSubmitting.set(false);
          this.alert.success(this.translate.instant('cmd.comments.success.added'));
          this.load();
          if (pendingFiles.length) this.filesChanged.emit();
        },
        error: () => this.isSubmitting.set(false),
      });
  }

  protected onUpdated(event: { id: string } & UpdateCommentInput): void {
    this.commentService
      .update(event.id, {
        entityType: event.entityType,
        entityId: event.entityId,
        body: event.body,
        attachedFiles: event.attachedFiles,
        newAttachedFiles: event.newAttachedFiles,
      })
      .subscribe({
        next: () => {
          this.alert.success(this.translate.instant('cmd.comments.success.updated'));
          this.load();
          if (event.newAttachedFiles?.length) this.filesChanged.emit();
        },
      });
  }

  protected onMentionClicked(userId: string): void {
    this.mentionClicked.emit(userId);
    void this.router.navigate(['/users', userId]);
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

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  signal,
} from '@angular/core';
import { filter } from 'rxjs';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { provideTuiEditor } from '@taiga-ui/editor';
import { AppPicture } from '../../picture/app-picture';
import { AppDatePipe } from '../../pipes/app-date.pipe';
import { AppEditorComponent } from '../../editor/app-editor.component';
import { Comment, CommentAttachedFile, UpdateCommentInput } from '../comment.model';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PendingEditorUploads } from '../../editor/pending-editor-uploads.service';
import { FileService } from '../../file/file.service';
import { LowerCasePipe } from '@angular/common';
import { AppDialogService } from '../../dialogs/dialog.service';

@Component({
  selector: 'app-comment-item',
  standalone: true,
  imports: [
    AppPicture,
    AppDatePipe,
    TuiButton,
    TuiIcon,
    ReactiveFormsModule,
    AppEditorComponent,
    TranslatePipe,
    LowerCasePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './comment-item.html',
  styleUrl: './comment-item.scss',
  providers: [provideTuiEditor()],
})
export class CommentItem {
  @Input({ required: true }) comment!: Comment;
  @Input({ required: true }) currentUserId!: string;
  @Input() isAdmin = false;

  @Output() deleted = new EventEmitter<string>();
  @Output() updated = new EventEmitter<{ id: string } & UpdateCommentInput>();

  private readonly pendingUploads = inject(PendingEditorUploads);
  protected readonly fileService = inject(FileService);
  protected readonly dialogs = inject(AppDialogService);
  protected readonly translate = inject(TranslateService);

  protected readonly isEditing = signal(false);
  protected readonly showCreated = signal(false);
  protected readonly editControl = new FormControl('', { nonNullable: true });

  protected get isEdited(): boolean {
    return this.comment.createdAt !== this.comment.updatedAt;
  }

  protected get canModify(): boolean {
    return this.comment.employeeId === this.currentUserId || this.isAdmin;
  }

  protected toggleTime(): void {
    this.showCreated.update((v) => !v);
  }

  protected startEdit(): void {
    this.editControl.setValue(this.comment.body);
    this.isEditing.set(true);
  }

  protected cancelEdit(): void {
    this.isEditing.set(false);
    this.editControl.reset();
  }

  protected submitEdit(): void {
    const rawBody = this.editControl.value.trim();
    if (!rawBody) return;

    const pendingFiles = this.pendingUploads.getPendingInHtml(rawBody);

    this.pendingUploads.flush('comments', this.comment.id, rawBody).subscribe((body) => {
      const existing = this.comment.attachedFiles ?? [];
      const added: CommentAttachedFile[] = pendingFiles.map((f) => ({
        id: f.fileId,
        name: f.name,
      }));
      this.updated.emit({
        id: this.comment.id,
        body,
        attachedFiles: [...existing, ...added],
      });
      this.isEditing.set(false);
    });
  }

  protected confirmDelete(commentId: string): void {
    const model = this.translate.instant('models.comment.title').toLowerCase();
    this.dialogs
      .confirm({
        label: this.translate.instant('generic.actions.deleteModel', { model }),
        content: this.translate.instant('generic.actions.deleteConfirm', { model }),
        yes: this.translate.instant('generic.actions.delete'),
        no: this.translate.instant('generic.actions.cancel'),
      })
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.deleted.emit(commentId);
      });
  }
}

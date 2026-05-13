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
import { TuiBadge } from '@taiga-ui/kit';
import { RouterLink } from '@angular/router';
import { provideTuiEditor } from '@taiga-ui/editor';
import { AppPicture } from '../../picture/app-picture';
import { AppDatePipe } from '../../pipes/app-date.pipe';
import { AppEditorComponent } from '../../editor/app-editor.component';
import { Comment, CommentAttachedFile, HistoryChange, UpdateCommentInput } from '../comment.model';
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
    TuiBadge,
    ReactiveFormsModule,
    AppEditorComponent,
    TranslatePipe,
    LowerCasePipe,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './comment-item.html',
  styleUrl: './comment-item.scss',
  providers: [provideTuiEditor(), PendingEditorUploads, AppDatePipe],
})
export class CommentItem {
  @Input({ required: true }) comment!: Comment;
  @Input({ required: true }) currentUserId!: string;
  @Input() isAdmin = false;

  @Output() deleted = new EventEmitter<string>();
  @Output() updated = new EventEmitter<{ id: string } & UpdateCommentInput>();

  private readonly pendingUploads = inject(PendingEditorUploads);
  private readonly appDate = inject(AppDatePipe);
  protected readonly fileService = inject(FileService);
  protected readonly dialogs = inject(AppDialogService);
  protected readonly translate = inject(TranslateService);

  protected readonly isEditing = signal(false);
  protected readonly showCreated = signal(false);
  protected readonly editControl = new FormControl('', { nonNullable: true });
  protected readonly existingFiles = signal<CommentAttachedFile[]>([]);
  protected readonly pendingFiles = this.pendingUploads.pending;

  protected get isEdited(): boolean {
    return this.comment.createdAt !== this.comment.updatedAt;
  }

  protected get canModify(): boolean {
    return this.comment.employeeId === this.currentUserId || this.isAdmin;
  }

  protected get hasChanges(): boolean {
    return (this.comment.changes?.length ?? 0) > 0;
  }

  private static readonly DATE_FIELDS = new Set(['dueAt']);

  private static readonly FIELD_ICONS: Record<string, string> = {
    status: '@tui.circle-dot',
    assignee: '@tui.user',
    category: '@tui.folder',
    priority: '@tui.flame',
    release: '@tui.tag',
    title: '@tui.pencil',
    description: '@tui.file-text',
    dueAt: '@tui.clock',
    closed: '@tui.circle-check',
  };

  protected fieldIcon(fieldName: string): string {
    return CommentItem.FIELD_ICONS[fieldName] ?? '@tui.activity';
  }

  protected changeLabel(change: HistoryChange): string {
    if (change.fieldName === 'closed') {
      return change.newValue === true
        ? this.translate.instant('models.task.activity.closed')
        : this.translate.instant('models.task.activity.reopened');
    }
    if (CommentItem.DATE_FIELDS.has(change.fieldName)) {
      return `${this.appDate.transform(change.oldValue as string)} → ${this.appDate.transform(change.newValue as string)}`;
    }
    return `${change.oldValue} → ${change.newValue}`;
  }

  protected changeBadgeAppearance(change: HistoryChange): string {
    if (change.fieldName === 'closed') {
      return change.newValue === true ? 'success' : 'primary';
    }
    return 'action-grayscale';
  }

  protected changeFieldLabel(fieldName: string): string {
    if (fieldName === 'closed') return '';
    return this.translate.instant(`models.task.activity.fields.${fieldName}`) + ': ';
  }

  protected toggleTime(): void {
    this.showCreated.update((v) => !v);
  }

  protected startEdit(): void {
    this.editControl.setValue(this.comment.body);
    this.existingFiles.set([...(this.comment.attachedFiles ?? [])]);
    this.isEditing.set(true);
  }

  protected cancelEdit(): void {
    this.pendingUploads.clear();
    this.isEditing.set(false);
    this.editControl.reset();
  }

  protected isImage(type: string): boolean {
    return type.startsWith('image/');
  }

  protected removeExistingFile(fileId: string): void {
    this.existingFiles.update((files) => files.filter((f) => f.id !== fileId));
  }

  protected removeFile(blobUrl: string): void {
    this.pendingUploads.remove(blobUrl);
  }

  protected submitEdit(): void {
    const rawBody = this.editControl.value.trim();
    if (!rawBody) return;

    const pendingFiles = this.pendingUploads.pending();

    this.pendingUploads
      .flush(this.comment.entityType + 's', this.comment.entityId, rawBody)
      .subscribe((body) => {
        const added: CommentAttachedFile[] = pendingFiles.map((f) => ({
          id: f.fileId,
          name: f.name,
        }));
        this.updated.emit({
          id: this.comment.id,
          entityType: this.comment.entityType,
          entityId: this.comment.entityId,
          body,
          attachedFiles: [...this.existingFiles(), ...added],
          newAttachedFiles: added,
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

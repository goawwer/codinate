import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { TuiEditorAttachedFile } from '@taiga-ui/editor';
import { PendingEditorUploads } from './pending-editor-uploads.service';

@Injectable()
export class EditorUploadService {
  private readonly http = inject(HttpClient);
  private readonly pending = inject(PendingEditorUploads);

  entityType = 'tasks';
  entityId: string | null = null;

  upload(file: File | Blob): Observable<{ name: string; link: string }> {
    const ext = file instanceof File ? '' : (file.type.split('/')[1] ?? 'png');
    const name = file instanceof File ? file.name : `clipboard-${Date.now()}.${ext}`;
    const asFile =
      file instanceof File ? file : new File([file], name, { type: file.type });

    if (!this.entityId) {
      const blobUrl = URL.createObjectURL(file);
      this.pending.track(blobUrl, asFile);
      return of({ name, link: blobUrl });
    }

    const formData = new FormData();
    formData.append('file', file, name);
    return this.http
      .post<{ id: string; name: string; size: number; url: string }>(
        `/api/files/${this.entityType}/${this.entityId}/upload`,
        formData,
      )
      .pipe(map(({ name: n, url }) => ({ name: n, link: url })));
  }

  uploadAttachment(file: File): Observable<TuiEditorAttachedFile> {
    return this.upload(file).pipe(
      map(({ name, link }) => ({ name, link, attrs: { class: 'file-link' } })),
    );
  }

  uploadImage(file: File | Blob): Observable<string> {
    return this.upload(file).pipe(map(({ link }) => link));
  }
}

export function editorFileLoader(
  service: EditorUploadService,
): (files: File[]) => Observable<TuiEditorAttachedFile[]> {
  return (files: File[]) => forkJoin(files.map((file) => service.uploadAttachment(file)));
}

export function editorImageLoader(
  service: EditorUploadService,
): (file: File | Blob) => Observable<string> {
  return (file: File | Blob) => service.uploadImage(file);
}

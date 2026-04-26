import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

export interface PendingFile {
  blobUrl: string;
  fileId: string;
  name: string;
  type: string;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class PendingEditorUploads {
  private readonly http = inject(HttpClient);

  private readonly blobs = new Map<string, File>();
  private readonly files = new Map<string, PendingFile>();

  private readonly _pending = signal<PendingFile[]>([]);
  readonly pending = this._pending.asReadonly();

  track(blobUrl: string, file: File): void {
    const pendingFile: PendingFile = {
      fileId: crypto.randomUUID(),
      blobUrl,
      name: file.name,
      type: file.type,
      size: file.size,
    };

    this.blobs.set(blobUrl, file);
    this.files.set(blobUrl, pendingFile);
    this._pending.update((p) => [...p, pendingFile]);
  }

  remove(blobUrl: string): void {
    this.blobs.delete(blobUrl);
    this.files.delete(blobUrl);
    URL.revokeObjectURL(blobUrl);

    this._pending.update((p) => p.filter((item) => item.blobUrl !== blobUrl));
  }

  getPendingInHtml(html: string): PendingFile[] {
    const found = [...new Set(html.match(/blob:[^"'\s)>\]]+/g) ?? [])];

    return found
      .map((blobUrl) => this.files.get(blobUrl))
      .filter((file): file is PendingFile => Boolean(file));
  }

  flush(entityType: string, entityId: string, html: string): Observable<string> {
    const tracked = [...this.blobs.keys()];

    const upload$ = tracked.length
      ? forkJoin(
          tracked.map((blobUrl) => {
            const file = this.blobs.get(blobUrl)!;
            const pendingFile = this.files.get(blobUrl)!;

            const form = new FormData();
            form.append('file', file, file.name);
            form.append('fileId', pendingFile.fileId);

            return this.http
              .post<{ url: string }>(`/api/files/${entityType}/${entityId}/upload`, form)
              .pipe(map(({ url }) => ({ blobUrl, realUrl: url })));
          }),
        ).pipe(
          map((replacements) => {
            let updated = html;

            for (const { blobUrl, realUrl } of replacements) {
              updated = updated.split(blobUrl).join(realUrl);

              this.blobs.delete(blobUrl);
              this.files.delete(blobUrl);
              URL.revokeObjectURL(blobUrl);
            }

            this._pending.set([]);

            return updated;
          }),
        )
      : of(html);

    return upload$.pipe(
      map((result) =>
        result
          .replace(/<img[^>]+src="blob:[^"]*"[^>]*>/gi, '')
          .replace(/<a[^>]+href="blob:[^"]*"[^>]*>[\s\S]*?<\/a>/gi, ''),
      ),
    );
  }

  clear(): void {
    this.blobs.forEach((_, blobUrl) => URL.revokeObjectURL(blobUrl));
    this.blobs.clear();
    this.files.clear();
    this._pending.set([]);
  }
}

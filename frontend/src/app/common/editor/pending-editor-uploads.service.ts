import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

export interface PendingFile {
  blobUrl: string;
  name: string;
  type: string;
}

@Injectable({ providedIn: 'root' })
export class PendingEditorUploads {
  private readonly http = inject(HttpClient);
  private readonly blobs = new Map<string, File>();
  private readonly _pending = signal<PendingFile[]>([]);
  readonly pending = this._pending.asReadonly();

  track(blobUrl: string, file: File): void {
    this.blobs.set(blobUrl, file);
    this._pending.update((p) => [...p, { blobUrl, name: file.name, type: file.type }]);
  }

  remove(blobUrl: string): void {
    this.blobs.delete(blobUrl);
    URL.revokeObjectURL(blobUrl);
    this._pending.update((p) => p.filter((item) => item.blobUrl !== blobUrl));
  }

  /**
   * Uploads all tracked blob URLs found in `html`, replaces them with real server URLs,
   * then strips any remaining (untracked / removed) blob URLs from the HTML.
   */
  flush(entityType: string, entityId: string, html: string): Observable<string> {
    const found = [...new Set(html.match(/blob:[^"'\s)>\]]+/g) ?? [])];
    const tracked = found.filter((url) => this.blobs.has(url));

    const upload$ = tracked.length
      ? forkJoin(
          tracked.map((blobUrl) => {
            const file = this.blobs.get(blobUrl)!;
            const form = new FormData();
            form.append('file', file, file.name);
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
              URL.revokeObjectURL(blobUrl);
            }
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
    this._pending.set([]);
  }
}

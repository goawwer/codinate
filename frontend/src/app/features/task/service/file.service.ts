import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TaskFile } from '../types/task.model';
import { IS_NEED_API_ROOT_URL } from '../../../core/declarations/tokens/api-url.token';

@Injectable({ providedIn: 'root' })
export class TaskFileService {
  private readonly baseURL = '/api/files';
  private readonly http = inject(HttpClient);

  upload(entityType: string, entityId: string, file: File): Observable<TaskFile & { size: number; url: string }> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<TaskFile & { size: number; url: string }>(
      `${this.baseURL}/${entityType}/${entityId}/upload`,
      form,
    );
  }

  remove(entityType: string, entityId: string, fileId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseURL}/${entityType}/${entityId}/${fileId}`);
  }

  download(entityType: string, entityId: string, file: Pick<TaskFile, 'id' | 'name'>): void {
    this.http
      .get(`${this.baseURL}/${entityType}/${entityId}/${file.id}`, {
        responseType: 'blob',
        context: new HttpContext().set(IS_NEED_API_ROOT_URL, true),
      })
      .subscribe((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 100);
      });
  }
}

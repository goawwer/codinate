import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Comment,
  CommentEntityType,
  CreateCommentInput,
  UpdateCommentInput,
} from './comment.model';

@Injectable({ providedIn: 'root' })
export class CommentService {
  private readonly baseURL = '/api/comments';
  private readonly http = inject(HttpClient);

  getByEntity(entityType: CommentEntityType, entityId: string): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.baseURL}/${entityType}/${entityId}`);
  }

  add(body: CreateCommentInput): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${this.baseURL}/add`, body);
  }

  update(id: string, body: UpdateCommentInput): Observable<void> {
    return this.http.patch<void>(`${this.baseURL}/${id}/update`, body);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseURL}/${id}/delete`);
  }
}

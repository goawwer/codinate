import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateCommentPayload, CreatePostInput, Post, PostComment, UpdatePostInput } from '../types/post.model';

export interface PostQueryParams {
  parentType?: 'team' | 'project';
  parentId?: number;
  searchValue?: string;
  from?: string;
  to?: string;
  sort?: 'asc' | 'desc';
  pageNumber?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class PostService {
  private readonly http = inject(HttpClient);

  getAll(query: PostQueryParams = {}): Observable<Post[]> {
    let params = new HttpParams();

    if (query.parentType) params = params.set('parentType', query.parentType);
    if (query.parentId)   params = params.set('parentId', query.parentId);
    if (query.searchValue?.trim()) params = params.set('searchValue', query.searchValue.trim());
    if (query.from) params = params.set('from', query.from);
    if (query.to)   params = params.set('to', query.to);
    if (query.sort) params = params.set('sort', query.sort).set('sortBy', 'createdAt');

    const page = query.pageNumber ?? 1;
    const size  = query.pageSize  ?? 10;
    params = params.set('pageNumber', page).set('pageSize', size);

    return this.http.get<Post[]>('/api/posts', { params });
  }

  getByTeam(teamId: number, query: Omit<PostQueryParams, 'parentType' | 'parentId'> = {}): Observable<Post[]> {
    return this.getAll({ ...query, parentType: 'team', parentId: teamId });
  }

  getByProject(projectId: number, query: Omit<PostQueryParams, 'parentType' | 'parentId'> = {}): Observable<Post[]> {
    return this.getAll({ ...query, parentType: 'project', parentId: projectId });
  }

  create(input: CreatePostInput): Observable<Post> {
    return this.http.post<Post>('/api/posts/create', input);
  }

  update(id: string, input: UpdatePostInput): Observable<void> {
    return this.http.patch<void>(`/api/posts/${id}/update`, input);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/api/posts/${id}/delete`);
  }

  getComments(postId: string): Observable<PostComment[]> {
    return this.http.get<PostComment[]>(`/api/comments/post/${postId}`);
  }

  addComment(postId: string, body: string): Observable<PostComment> {
    const payload: CreateCommentPayload = {
      id: crypto.randomUUID(),
      entityType: 'post',
      entityId: postId,
      body,
      attachedFiles: [],
    };
    return this.http.post<PostComment>('/api/comments/add', payload);
  }
}

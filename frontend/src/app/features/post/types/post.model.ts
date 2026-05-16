export type PostType = 'note' | 'announcement' | 'poll';
export type PostPriority = 'low' | 'normal' | 'high' | 'critical';

export interface PostQuery {
  searchValue?: string;
  sort?: 'asc' | 'desc';
  from?: string;
  to?: string;
  pageSize?: number;
}

export interface Post {
  id: string;
  authorName: string;
  authorSurname: string;
  authorPicture: string;
  authorUsername: string;
  title: string;
  body: string;
  attachedFiles: { id: string; name: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface PostComment {
  id: string;
  entityType: string;
  entityId: string;
  employeeId: string;
  employeeName: string;
  employeeSurname: string;
  employeeUsername: string;
  employeePicture: string | null;
  body: string;
  attachedFiles: { id: string; name: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentPayload {
  id: string;
  entityType: 'post';
  entityId: string;
  body: string;
  attachedFiles: { id: string; name: string; size: number }[];
}

export interface PostParent {
  postParentType: 'team' | 'project';
  parentId: number;
}

export interface UpdatePostInput {
  title?: string;
  body?: string;
  parents?: PostParent[];
}

export interface CreatePostInput {
  id: string;
  authorId: string;
  parents: PostParent[];
  postType: 'basic' | 'announcement' | 'poll';
  title: string;
  body: string;
  attachedFiles: { id: string; name: string; size: number }[];
}

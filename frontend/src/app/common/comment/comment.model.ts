export type CommentEntityType = 'task' | 'post';

export interface CommentAttachedFile {
  id: string;
  name: string;
}

export interface Comment {
  id: string;
  entityType: CommentEntityType;
  entityId: string;
  employeeId: string;
  employeeName: string;
  employeeSurname: string;
  employeeUsername: string;
  employeePicture: string;
  body: string;
  attachedFiles: CommentAttachedFile[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateCommentInput {
  entityType: CommentEntityType;
  entityId: string;
  body: string;
}

export interface UpdateCommentInput {
  body: string;
  attachedFiles?: CommentAttachedFile[];
}

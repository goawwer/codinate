export type CommentEntityType = 'task' | 'post';

export interface CommentAttachedFile {
  id: string;
  name: string;
}

export interface HistoryChange {
  id: string;
  fieldName: string;
  oldValue: string | boolean;
  newValue: string | boolean;
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
  changes: HistoryChange[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateCommentInput {
  id?: string;
  entityType: CommentEntityType;
  entityId: string;
  body: string;
  attachedFiles?: CommentAttachedFile[];
}

export interface UpdateCommentInput {
  entityType?: CommentEntityType;
  entityId?: string;
  body: string;
  attachedFiles?: CommentAttachedFile[];
  newAttachedFiles?: CommentAttachedFile[];
}

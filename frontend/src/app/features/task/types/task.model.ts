export interface Task {
  id: string;
  assigneeUserame: string;
  projectPicture: string;
  projectRelease: string;
  category: string;
  priority: string;
  status: string;
  identifier: number;
  title: string;
  description: string;
  dueAt: string;
  createdAt: string;
  closedAt: string;
}

export interface TaskDetailed extends Task {
  authorId: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  userId: string;
  assigneeId: string;
  projectId: number;
  releaseId: number;
  categoryId: number;
  priorityId: number;
  statusId: number;
  title: string;
  description: string;
  dueAt: string;
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  closedAt?: string | null;
}

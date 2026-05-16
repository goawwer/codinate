export interface TaskMember {
  id: string;
  name: string;
  surname: string;
  role: string;
  picture: string;
}

export interface TaskFile {
  id: string;
  name: string;
}

export interface Task {
  id: string;
  assigneeUsername: string;
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
  projectId: number;
  releaseId: number;
  categoryId: number;
  projectName: string;
  projectPicture: string;
  authorId: string;
  authorName: string;
  authorSurname: string;
  assigneeId: string;
  assigneeName: string;
  assigneeSurname: string;
  assigneePicture: string;
  members: TaskMember[];
  attachedFiles: TaskFile[];
  updatedAt: string;
}

export interface AttachedFileInput {
  id: string;
  name: string;
  size: number;
}

export interface CreateTaskInput {
  id: string;
  authorId: string;
  assigneeId: string;
  projectId: number;
  releaseId: number;
  categoryId: number;
  priorityId: number;
  statusId: number;
  title: string;
  description: string;
  dueAt: string;
  attachedFiles: AttachedFileInput[];
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  closedAt?: string | null;
  commentBody?: string;
  assigneeName?: string;
  statusName?: string;
  categoryName?: string;
  priorityName?: string;
  releaseName?: string;
}

export interface TaskSuggestion {
  id: string;
  identifier: number;
  title: string;
}

export interface DeadlineDayCount {
  date: string;
  count: number;
}

export interface DeadlinePressure {
  overdue: number;
  upcoming: DeadlineDayCount[];
}

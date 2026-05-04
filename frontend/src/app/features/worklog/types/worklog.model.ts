export interface WorklogRow {
  id: string;
  taskId: string;
  date: string;
  startAt: string;
  endAt: string;
  totalMinutes: number;
  description: string;
  projectName: string;
  taskIdentifier: number;
}

export interface CreateWorklogInput {
  startAt: string;
  endAt: string;
  taskId: string;
  description: string;
}

export interface WorklogDialogData {
  taskId?: string;
  taskIdentifier?: number;
  taskTitle?: string;
}

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

export interface TaskWorklogRow {
  id: string;
  taskId: string;
  startAt: string;
  endAt: string;
  totalMinutes: number;
  description: string;
  userId: string;
  userName: string;
  userSurname: string;
  userAvatar: string;
}

export interface CreateWorklogInput {
  userId: string;
  startAt: string;
  endAt: string;
  taskId: string;
  description: string;
}

export interface WorklogDialogData {
  logId?: string;
  taskId?: string;
  taskIdentifier?: number;
  taskTitle?: string;
  startAt?: string;
  endAt?: string;
  description?: string;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  name: string;
  surname: string;
  avatar: string;
  totalMinutes: number;
  logCount: number;
  rank: number;
}

export interface DayPlanItem {
  id: string;
  taskId: string;
  identifier: string;
  title: string;
  projectName?: string;
  priority?: 'low' | 'medium' | 'high';
  plannedMinutes?: number;
  done?: boolean;
  description?: string;
}

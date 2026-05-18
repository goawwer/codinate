export type NotificationType = 'mention' | 'post' | 'task' | 'rank' | 'due_soon';

export interface Notification {
  id: string;
  actorName: string;
  actorSurname: string;
  actorPicture: string;
  notificationType: NotificationType;
  related: Record<string, unknown>;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export interface UnreadCount {
  count: number;
}

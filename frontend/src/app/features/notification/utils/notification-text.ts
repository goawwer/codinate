import { TranslateService } from '@ngx-translate/core';
import { Notification } from '../types/notification.model';

export function getNotifTitle(n: Notification, translate: TranslateService): string {
  const r = n.related;
  switch (n.notificationType) {
    case 'mention':   return translate.instant('navbar.notif.mention.post.title');
    case 'post':      return translate.instant('navbar.notif.post.title');
    case 'task':      return translate.instant('navbar.notif.task.title');
    case 'rank':      return translate.instant('navbar.notif.rank.title', { rank: r['rank'] });
    case 'due_soon':  return translate.instant('navbar.notif.due_soon.title');
    default:          return n.title;
  }
}

export function getNotifBody(n: Notification, translate: TranslateService): string {
  const r = n.related;
  switch (n.notificationType) {
    case 'mention':
      if (r['entityType'] === 'task') return translate.instant('navbar.notif.mention.task.body');
      if (r['entityType'] === 'post') return translate.instant('navbar.notif.mention.postComment.body');
      return translate.instant('navbar.notif.mention.post.body', { title: r['postTitle'] });
    case 'post':      return translate.instant('navbar.notif.post.body', { title: r['postTitle'] });
    case 'task':      return translate.instant('navbar.notif.task.body', { title: r['taskTitle'] });
    case 'rank':      return translate.instant('navbar.notif.rank.body', { totalMinutes: r['totalMinutes'] });
    case 'due_soon':  return translate.instant('navbar.notif.due_soon.body', { title: r['taskTitle'] });
    default:          return n.body;
  }
}

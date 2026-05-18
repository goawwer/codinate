import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AppPicture } from '../../picture/app-picture';
import { TuiIcon } from '@taiga-ui/core';
import { ThemeService } from '../../../core/services/theme.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { UserStore } from '../../../features/user/store/user.store';
import { TuiDataList, TuiDropdown, TuiOption, tuiScrollbarOptionsProvider } from '@taiga-ui/core';
import { AuthStore } from '../../../features/auth/store/auth.store';
import { NotificationStore } from '../../../features/notification/store/notification.store';
import { Notification } from '../../../features/notification/types/notification.model';
import { AppDialogService } from '../../dialogs/dialog.service';
import { PostService } from '../../../features/post/service/post.service';
import {
  PostDialogComponent,
  PostDialogData,
} from '../../../features/post/components/dialog/post-dialog.component';
import { AppDatePipe } from '../../pipes/app-date.pipe';
import { getNotifBody, getNotifTitle } from '../../../features/notification/utils/notification-text';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  providers: [tuiScrollbarOptionsProvider({ mode: 'hover' })],
  imports: [
    AppPicture,
    TuiIcon,
    TuiOption,
    TranslatePipe,
    RouterLink,
    RouterLinkActive,
    TuiDataList,
    TuiDropdown,
    AppDatePipe,
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class NavbarComponent implements OnInit, OnDestroy {
  public readonly theme = inject(ThemeService);
  public readonly userStore = inject(UserStore);
  public readonly notificationStore = inject(NotificationStore);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly dialogs = inject(AppDialogService);
  private readonly postService = inject(PostService);

  protected readonly isProfileDropdownOpen = signal(false);
  protected readonly isNotificationDropdownOpen = signal(false);

  private pollSubscription?: Subscription;

  ngOnInit(): void {
    this.notificationStore.load();

    this.pollSubscription = interval(7_000).subscribe(() => {
      this.notificationStore.poll();
    });
  }

  ngOnDestroy(): void {
    this.pollSubscription?.unsubscribe();
  }

  protected toggleProfileDropdown(): void {
    this.isProfileDropdownOpen.update((v) => !v);
  }

  protected closeProfileDropdown(): void {
    this.isProfileDropdownOpen.set(false);
  }

  protected toggleNotificationDropdown(): void {
    this.isNotificationDropdownOpen.update((v) => !v);
  }

  protected closeNotificationDropdown(): void {
    this.isNotificationDropdownOpen.set(false);
  }

  protected logout(): void {
    this.closeProfileDropdown();
    this.authStore.logout();
  }

  protected markAllAsRead(): void {
    this.notificationStore.markAllAsRead();
  }

  protected markAsRead(id: string): void {
    this.notificationStore.markAsRead(id);
  }

  protected navigateTo(n: Notification): void {
    this.notificationStore.markAsRead(n.id);
    this.closeNotificationDropdown();

    const r = n.related;

    switch (n.notificationType) {
      case 'task':
      case 'due_soon':
        if (r['taskId']) this.router.navigate(['/tasks', r['taskId']]);
        break;
      case 'mention':
        if (r['entityType'] === 'task' && r['entityId']) {
          const extras = r['commentId'] ? { queryParams: { comment: r['commentId'] } } : {};
          this.router.navigate(['/tasks', r['entityId']], extras);
        } else if (r['entityType'] === 'post' && r['entityId']) {
          this.openPostDialog(r['entityId'] as string, r['commentId'] as string | undefined);
        } else if (r['postId']) {
          this.openPostDialog(r['postId'] as string);
        } else {
          this.router.navigate(['/main/feed']);
        }
        break;
      case 'post':
        if (r['postId']) {
          this.openPostDialog(r['postId'] as string);
        } else {
          this.router.navigate(['/main/feed']);
        }
        break;
      case 'rank':
        this.router.navigate(['/main/feed']);
        break;
    }
  }

  private openPostDialog(postId: string, highlightCommentId?: string): void {
    this.postService.getById(postId).subscribe({
      next: (post) => {
        this.dialogs
          .component<PostDialogComponent, boolean, PostDialogData>(PostDialogComponent, {
            label: post.title,
            size: 'l',
            data: { post, highlightCommentId },
          })
          .subscribe();
      },
      error: () => this.router.navigate(['/main/feed']),
    });
  }

  protected notifTitle(n: Notification): string {
    return getNotifTitle(n, this.translate);
  }

  protected notifBody(n: Notification): string {
    return getNotifBody(n, this.translate);
  }

  protected notificationIcon(type: string): string {
    const icons: Record<string, string> = {
      mention: '@tui.at-sign',
      post: '@tui.file-text',
      task: '@tui.check-square',
      rank: '@tui.trophy',
      due_soon: '@tui.clock',
    };
    return icons[type] ?? '@tui.bell';
  }
}

import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AppPicture } from '../../picture/app-picture';
import { TuiIcon, TuiDropdown, TuiDataList, TuiLink } from '@taiga-ui/core';
import { ThemeService } from '../../../core/services/theme.service';
import { TranslatePipe } from '@ngx-translate/core';
import { UserStore } from '../../../features/user/store/user.store';
import { TuiChevron } from '@taiga-ui/kit';

@Component({
  selector: 'app-navbar',
  imports: [
    AppPicture,
    TuiIcon,
    TranslatePipe,
    RouterLink,
    RouterLinkActive,
    TuiDropdown,
    TuiDataList,
    TuiChevron,
    TuiLink,
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class NavbarComponent {
  public readonly theme = inject(ThemeService);
  public readonly userStore = inject(UserStore);
  protected readonly router = inject(Router);

  protected adminOpen = false;

  protected readonly adminItems = [
    { label: 'navbar.adminItems.users', route: '/admin/users' },
    { label: 'navbar.adminItems.teams', route: '/admin/teams' },
    { label: 'navbar.adminItems.projects', route: '/admin/projects' },
  ];

  protected navigateTo(route: string): void {
    this.adminOpen = false;
    this.router.navigate([route]);
  }

  protected isAdminActive(): boolean {
    return this.router.url.startsWith('/admin');
  }
}

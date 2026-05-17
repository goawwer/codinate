import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AppPicture } from '../../picture/app-picture';
import { TuiIcon } from '@taiga-ui/core';
import { ThemeService } from '../../../core/services/theme.service';
import { TranslatePipe } from '@ngx-translate/core';
import { UserStore } from '../../../features/user/store/user.store';
import { TuiDataList, TuiDropdown, TuiOption } from '@taiga-ui/core';
import { AuthStore } from '../../../features/auth/store/auth.store';

@Component({
  selector: 'app-navbar',
  imports: [
    AppPicture,
    TuiIcon,
    TuiOption,
    TranslatePipe,
    RouterLink,
    RouterLinkActive,
    TuiDataList,
    TuiDropdown,
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class NavbarComponent {
  public readonly theme = inject(ThemeService);
  public readonly userStore = inject(UserStore);
  private readonly authStore = inject(AuthStore);

  protected readonly isProfileDropdownOpen = signal(false);

  protected toggleProfileDropdown(): void {
    this.isProfileDropdownOpen.update((value) => !value);
  }

  protected closeProfileDropdown(): void {
    this.isProfileDropdownOpen.set(false);
  }

  protected logout(): void {
    this.closeProfileDropdown();
    this.authStore.logout();
  }
}

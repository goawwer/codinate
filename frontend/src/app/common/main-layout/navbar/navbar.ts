import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AppPicture } from '../../picture/app-picture';
import { TuiIcon } from '@taiga-ui/core';
import { ThemeService } from '../../../core/services/theme.service';
import { TranslatePipe } from '@ngx-translate/core';
import { UserStore } from '../../../features/user/store/user.store';

@Component({
  selector: 'app-navbar',
  imports: [
    AppPicture,
    TuiIcon,
    TranslatePipe,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class NavbarComponent {
  public readonly theme = inject(ThemeService);
  public readonly userStore = inject(UserStore);
}

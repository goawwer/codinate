import { Component, computed, inject, Input } from '@angular/core';
import { TuiAvatar } from '@taiga-ui/kit';
import { TuiSizeXS, TuiSizeXXL } from '@taiga-ui/core';
import { UserStore } from '../../features/user/store/user.store';

type AvatarSize = TuiSizeXS | TuiSizeXXL;

@Component({
  selector: 'app-profile-picture',
  standalone: true,
  imports: [TuiAvatar],
  templateUrl: './profile-picture.html',
  styleUrl: './profile-picture.scss',
})
export class ProfilePicture {
  @Input() size: AvatarSize = 'm';

  protected readonly sizes: ReadonlyArray<AvatarSize> = ['xxl', 'xl', 'l', 'm', 's', 'xs'];

  readonly userStore = inject(UserStore);
  readonly user = this.userStore.user;

  readonly profilePictureSrc = computed(() => {
    const profilePicture = this.user()?.profilePicture;
    return profilePicture ? `/apipublic/profile-picture?filename=${profilePicture}` : '';
  });

  readonly avatarLetters = computed(() => {
    const user = this.user();

    if (!user) {
      return '?';
    }

    const parts = `${user.name ?? ''} ${user.surname ?? ''}`
      .trim()
      .replace(/\s+/g, ' ')
      .split(' ')
      .filter(Boolean);

    const first = parts[0]?.[0] ?? '';
    const second = parts[1]?.[0] ?? '';

    return `${first}${second}`.toUpperCase() || '?';
  });

  readonly avatarColor = computed(() => {
    const letters = this.avatarLetters();

    const first = letters[0] ?? 'A';
    const second = letters[1] ?? '0';

    const firstCode = first.codePointAt(0) ?? 65;
    const secondCode = second.codePointAt(0) ?? 48;

    const colors = ['#F4D451', '#EA5A4F', '#659962', '#844D6C', '#BA5F64', '#EB7D52', '#B7BEAE'];

    return colors[(firstCode + secondCode) % colors.length];
  });
}

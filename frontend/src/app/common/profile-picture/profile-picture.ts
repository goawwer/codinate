import { Component, inject, Input } from '@angular/core';
import { UserStore } from '../../features/user/store/user.store';
import { AppAvatar, AvatarSize } from '../avatar/app-avatar';

@Component({
  selector: 'app-profile-picture',
  standalone: true,
  imports: [AppAvatar],
  template: `
    <app-avatar
      class="cursor-pointer"
      [name]="userStore.user()?.name ?? ''"
      [surname]="userStore.user()?.surname ?? ''"
      [pictureName]="userStore.user()?.picture ?? ''"
      [size]="size"
      apiPath="profile-picture"
    />
  `,
})
export class ProfilePicture {
  @Input() size: AvatarSize = 'm';
  readonly userStore = inject(UserStore);
}

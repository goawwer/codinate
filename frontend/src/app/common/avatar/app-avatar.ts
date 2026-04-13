import { Component, computed, Input } from '@angular/core';
import { TuiAvatar } from '@taiga-ui/kit';
import { TuiSizeXS, TuiSizeXXL } from '@taiga-ui/core';
import { avatarColor, avatarLetters } from './avatar-color.util';

export type AvatarSize = TuiSizeXS | TuiSizeXXL;

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [TuiAvatar],
  template: `
    @if (src()) {
      <tui-avatar [size]="size" [src]="src()" />
    } @else {
      <tui-avatar [size]="size" [src]="letters()" [style.background]="color()" />
    }
  `,
})
export class AppAvatar {
  @Input({ required: true }) name = '';
  @Input() surname = '';
  @Input() pictureName = '';
  @Input() size: AvatarSize = 'm';
  @Input() apiPath = 'profile-picture';

  protected readonly src = computed(() =>
    this.pictureName ? `/apipublic/${this.apiPath}?filename=${this.pictureName}` : '',
  );

  protected readonly letters = computed(() => avatarLetters(this.name, this.surname));
  protected readonly color = computed(() => avatarColor(this.letters()));
}

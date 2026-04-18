import { Component, computed, inject, Input } from '@angular/core';
import { TuiAvatar } from '@taiga-ui/kit';
import { TuiIcon, TuiSizeXS, TuiSizeXXL } from '@taiga-ui/core';
import { avatarColor, avatarLetters } from './picture-color.util';
import { API_CONFIG } from '../../core/declarations/tokens/api-config.token';

export type AvatarSize = TuiSizeXS | TuiSizeXXL;

@Component({
  selector: 'app-picture',
  standalone: true,
  imports: [TuiAvatar, TuiIcon],
  host: {
    style:
      'display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; container-type: size;',
  },
  template: `
    @if (src()) {
      @if (entityType === 'users') {
        <tui-avatar [size]="size" [src]="src()" />
      } @else if (!isAvatar) {
        <img [src]="src()" />
      } @else {
        <tui-avatar [size]="size" [src]="src()" />
      }
    } @else if (entityType === 'users') {
      <tui-avatar [size]="size" [src]="letters()" [style.background]="color()" />
    } @else {
      <tui-icon
        icon="@tui.image"
        class="text-(--tui-text-tertiary) m-auto"
        style="font-size: {{ this.fontSize }}; padding: 0"
      />
    }
  `,
})
export class AppPicture {
  @Input({ required: true }) name = '';
  @Input() surname = '';
  @Input() pictureName = '';
  @Input() size: AvatarSize = 'm';
  @Input() fontSize = '';
  @Input() entityType = '';
  @Input() isAvatar = false;

  private readonly apiConfig = inject(API_CONFIG);

  protected readonly src = computed(() =>
    this.pictureName
      ? `${this.apiConfig.rootUrl}/apipublic/${this.entityType}?filename=${this.pictureName}`
      : '',
  );

  protected readonly letters = computed(() => avatarLetters(this.name, this.surname));
  protected readonly color = computed(() => avatarColor(this.letters()));
}

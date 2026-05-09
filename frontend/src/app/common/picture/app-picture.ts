import { Component, computed, inject, input } from '@angular/core';
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
      @if (entityType() === 'users') {
        <tui-avatar [size]="size()" [src]="src()" [round]="isRound()" />
      } @else if (!isAvatar()) {
        <img [src]="src()" />
      } @else {
        <tui-avatar [size]="size()" [src]="src()" />
      }
    } @else if (entityType() === 'users') {
      <tui-avatar
        [size]="size()"
        [src]="letters()"
        [style.background]="color()"
        [style.color]="'var(--app-avatar-leter-color)'"
      />
    } @else if (isAvatar()) {
      <tui-icon
        icon="@tui.image"
        class="text-(--tui-text-tertiary) m-auto"
        style="font-size: {{ fontSize() }}; padding: 0"
      />
    } @else {
      <tui-avatar
        [size]="size()"
        [src]="letters()"
        [style.background]="color()"
        [style.color]="'var(--app-avatar-leter-color)'"
        [round]="isRound()"
      />
    }
  `,
})
export class AppPicture {
  readonly name = input.required<string>();
  readonly surname = input('');
  readonly pictureName = input('');
  readonly size = input<AvatarSize>('m');
  readonly fontSize = input('');
  readonly entityType = input('');
  readonly isAvatar = input(false);
  readonly isRound = input(true);

  private readonly apiConfig = inject(API_CONFIG);

  protected readonly src = computed(() =>
    this.pictureName()
      ? `${this.apiConfig.rootUrl}/apipublic/${this.entityType()}/avatars?filename=${this.pictureName()}`
      : '',
  );

  protected readonly letters = computed(() => avatarLetters(this.name(), this.surname()));
  protected readonly color = computed(() => avatarColor(this.letters()));
}

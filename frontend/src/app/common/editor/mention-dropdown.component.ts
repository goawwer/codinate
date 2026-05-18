import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  OnInit,
  output,
  viewChild,
} from '@angular/core';
import { TuiDataList, TuiOption } from '@taiga-ui/core';
import { AppPicture } from '../picture/app-picture';
import { UserStore } from '../../features/user/store/user.store';
import { User } from '../../features/user/types/model/user.model';

@Component({
  selector: 'app-mention-dropdown',
  standalone: true,
  imports: [TuiDataList, TuiOption, AppPicture],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:keydown.arrowDown)': 'down($event, true)',
    '(window:keydown.arrowUp)': 'down($event, false)',
  },
  template: `
    <tui-data-list>
      <div #container>
        @for (user of filteredUsers(); track user.id) {
          <button
            tuiOption
            type="button"
            (click)="selected.emit(user)"
            (keydown.enter.prevent)="selected.emit(user)"
          >
            <div class="w-8 h-8 border-r-0">
              <app-picture
                [name]="user.name"
                [surname]="user.surname"
                size="s"
                entityType="users"
                [pictureName]="user.picture"
              />
            </div>

            <div class="flex flex-col items-start">
              <span class="mention-name">{{ user.name }} {{ user.surname }}</span>
              <span class="mention-hint">@{{ user.username }}</span>
            </div>
          </button>
        }
      </div>
    </tui-data-list>
  `,
  styles: [
    `
      .mention-empty {
        display: block;
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
        color: var(--tui-text-tertiary);
      }

      .mention-name {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 140px;
      }

      .mention-hint {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 140px;
      }

      button {
      }
      button[tuiOption] {
        display: flex;
        width: 100%;
        align-items: center;
        gap: 0.5rem;
      }
      .mention-hint {
        font-size: 0.75rem;
        color: var(--tui-text-tertiary);
      }
      tui-data-list[data-size='l'] {
        --tui-data-list-padding: 0rem;
        --tui-data-list-margin: 0rem;
        min-width: 14rem;
      }
      tui-data-list [tuiOption] {
        display: flex;
        border-radius: var(--tui-radius-m);
        justify-content: flex-start;
      }
    `,
  ],
})
export class MentionDropdownComponent implements OnInit {
  readonly mentionSuggestions = input<string>('');
  readonly selected = output<User>();

  protected readonly container = viewChild<ElementRef<HTMLElement>>('container');

  private readonly userStore = inject(UserStore);

  readonly filteredUsers = computed(() => {
    const query = this.mentionSuggestions().trim().toLowerCase();
    const users = this.userStore.users();
    if (!query) return users;
    return users.filter((user) => user.username.toLowerCase().includes(query));
  });

  ngOnInit(): void {
    if (!this.userStore.users().length) {
      this.userStore.loadUsers({});
    }
  }

  protected down(event: Event, isDown: boolean): void {
    const el = this.container()?.nativeElement as HTMLElement | null;
    const buttons = Array.from<HTMLButtonElement>(el?.querySelectorAll('button') ?? []);
    const button = isDown ? buttons[0] : buttons[buttons.length - 1];
    if (!el?.contains(event.target as Node)) {
      event.preventDefault();
      button?.focus();
    }
  }
}

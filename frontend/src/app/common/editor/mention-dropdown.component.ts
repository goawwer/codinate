import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TuiDataList, TuiOption } from '@taiga-ui/core';
import { AppPicture } from '../picture/app-picture';
import { UserApiService } from '../../features/user/service/user.service';
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
              <span>{{ user.name }} {{ user.surname }}</span>
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

      button {
      }
      button[tuiOption] {
        display: flex;
        width: 12rem;
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
        min-width: 12rem;
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

  private readonly userService = inject(UserApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly allUsers = signal<User[]>([]);

  readonly filteredUsers = computed(() => {
    const query = this.mentionSuggestions().trim().toLowerCase();

    if (!query) {
      return this.allUsers();
    }

    return this.allUsers().filter((user) => {
      return user.username.toLowerCase().includes(query);
    });
  });

  ngOnInit(): void {
    this.userService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((users) => this.allUsers.set(users));
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

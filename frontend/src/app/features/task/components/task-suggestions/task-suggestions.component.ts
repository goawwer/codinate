import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  signal,
} from '@angular/core';
import { TuiIcon } from '@taiga-ui/core';
import { TaskSuggestion } from '../../types/task.model';

const PAGE_SIZE = 5;

@Component({
  selector: 'app-task-suggestions',
  standalone: true,
  imports: [],
  templateUrl: './task-suggestions.component.html',
  styleUrl: './task-suggestions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskSuggestionsComponent implements OnChanges {
  @Input({ required: true }) suggestions: TaskSuggestion[] = [];
  @Output() selected = new EventEmitter<TaskSuggestion>();
  @Output() dismissed = new EventEmitter<void>();

  protected readonly activeIndex = signal(-1);

  ngOnChanges(): void {
    this.activeIndex.set(-1);
  }

  @HostListener('document:keydown', ['$event'])
  protected handleKeydown(event: KeyboardEvent): void {
    const items = this.suggestions;
    if (!items.length) return;

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        this.activeIndex.update((i) => (i < 0 ? 0 : Math.min(i + 1, items.length - 1)));
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        this.activeIndex.update((i) => (i <= 0 ? items.length - 1 : i - 1));
        break;
      }
      case 'PageDown': {
        event.preventDefault();
        this.activeIndex.update((i) => Math.min((i < 0 ? 0 : i) + PAGE_SIZE, items.length - 1));
        break;
      }
      case 'PageUp': {
        event.preventDefault();
        this.activeIndex.update((i) => Math.max((i < 0 ? items.length - 1 : i) - PAGE_SIZE, 0));
        break;
      }
      case 'Enter':
      case 'Tab': {
        const i = this.activeIndex();
        if (i >= 0 && items[i]) {
          event.preventDefault();
          this.select(items[i]);
        }
        break;
      }
      case 'Escape': {
        event.preventDefault();
        this.activeIndex.set(-1);
        this.dismissed.emit();
        break;
      }
    }
  }

  protected select(task: TaskSuggestion): void {
    this.activeIndex.set(-1);
    this.selected.emit(task);
  }
}

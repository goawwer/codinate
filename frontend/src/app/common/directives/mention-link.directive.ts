import { Directive, EventEmitter, HostListener, inject, Output } from '@angular/core';
import { Router } from '@angular/router';

@Directive({
  selector: '[appMentionLinks]',
  standalone: true,
})
export class MentionLinksDirective {
  @Output()
  readonly appMentionClick = new EventEmitter<string>();

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    const mention = target.closest('.my-mention[data-user]') as HTMLElement | null;
    if (!mention) return;

    const userId = mention.getAttribute('data-user');
    if (!userId) return;

    event.preventDefault();
    event.stopPropagation();

    this.appMentionClick.emit(userId);
  }
}

import { Directive, HostListener, inject } from '@angular/core';
import { Router } from '@angular/router';

@Directive({
  selector: '[appMentionLinks]',
  standalone: true,
})
export class MentionLinksDirective {
  private readonly router = inject(Router);

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const mention = target.closest('.my-mention[data-user]') as HTMLElement | null;
    if (!mention) return;

    const userId = mention.dataset['user'];
    if (!userId) return;

    event.preventDefault();
    event.stopPropagation();
    this.router.navigate(['/users', userId]);
  }
}

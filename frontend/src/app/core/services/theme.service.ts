import { Component, effect, Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly isDark = signal(localStorage.getItem('theme') === 'dark');

  constructor() {
    effect(() => {
      localStorage.setItem('theme', this.isDark() ? 'dark' : 'light');
    });
  }

  toggle(): void {
    this.isDark.update((v) => !v);
  }
}

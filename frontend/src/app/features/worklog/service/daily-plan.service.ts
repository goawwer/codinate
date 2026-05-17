import { effect, Injectable, signal } from '@angular/core';
import { DayPlanItem } from '../types/worklog.model';

@Injectable({ providedIn: 'root' })
export class DailyPlanService {
  private get storageKey(): string {
    return `daily-plan-${new Date().toISOString().slice(0, 10)}`;
  }

  readonly items = signal<DayPlanItem[]>(this.load());

  constructor() {
    effect(() => {
      localStorage.setItem(this.storageKey, JSON.stringify(this.items()));
    });
  }

  private load(): DayPlanItem[] {
    try {
      const raw = localStorage.getItem(`daily-plan-${new Date().toISOString().slice(0, 10)}`);
      return raw ? (JSON.parse(raw) as DayPlanItem[]) : [];
    } catch {
      return [];
    }
  }
}

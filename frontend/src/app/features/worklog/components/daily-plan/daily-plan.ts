import { Component, computed, signal } from '@angular/core';
import { DayPlanItem } from '../../types/worklog.model';
import { DAILYPLANIMPORTS } from './daily-plan.imports';

@Component({
  selector: 'app-daily-plan',
  imports: [DAILYPLANIMPORTS],
  templateUrl: './daily-plan.html',
  styleUrl: './daily-plan.scss',
})
export class DailyPlanComponent {
  readonly items = signal<DayPlanItem[]>([
    {
      id: '1',
      taskId: 'task-1',
      identifier: 'TASK-24',
      title: 'Fix worklog filtering by selected period',
      projectName: 'Codinate',
      priority: 'high',
      plannedMinutes: 90,
    },
    {
      id: '2',
      taskId: 'task-2',
      identifier: 'TASK-31',
      title: 'Polish task details attachments block',
      projectName: 'Codinate',
      priority: 'medium',
      plannedMinutes: 60,
    },
    {
      id: '3',
      taskId: 'task-3',
      identifier: 'TASK-42',
      title: 'Add translations for worklog page',
      projectName: 'Codinate',
      priority: 'low',
      plannedMinutes: 30,
    },
  ]);

  readonly order = signal(new Map<number, number>());

  readonly totalPlanned = computed(() =>
    this.items().reduce((sum, item) => sum + (item.plannedMinutes ?? 0), 0),
  );

  updateOrder(order: Map<number, number>): void {
    this.order.set(order);

    const ordered = [...this.items()]
      .map((item, index) => ({
        item,
        order: order.get(index) ?? index,
      }))
      .sort((a, b) => a.order - b.order)
      .map(({ item }) => item);

    // Later send this ordered array to backend:
    // [{ taskId, position }]
    console.log('new plan order', ordered);
  }

  remove(id: string): void {
    this.items.update((items) => items.filter((item) => item.id !== id));
  }

  priorityLabel(priority?: DayPlanItem['priority']): string {
    switch (priority) {
      case 'high':
        return 'High';
      case 'medium':
        return 'Medium';
      case 'low':
        return 'Low';
      default:
        return 'Default';
    }
  }

  minutesLabel(minutes?: number): string {
    if (!minutes) {
      return 'No estimate';
    }

    const h = Math.floor(minutes / 60);
    const m = minutes % 60;

    if (!h) {
      return `${m}m`;
    }

    if (!m) {
      return `${h}h`;
    }

    return `${h}h ${m}m`;
  }
}

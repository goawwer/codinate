import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TaskCoreService } from '../service/task-core.service';
import { TaskDetailed } from '../types/task.model';
import { DETAILED_IMPORTS } from './detailed.imports';
import { UserStore } from '../../user/store/user.store';

@Component({
  selector: 'app-detailed',
  imports: [...DETAILED_IMPORTS],
  templateUrl: './detailed.html',
  styleUrl: './detailed.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Detailed implements OnInit {
  private readonly taskService = inject(TaskCoreService);
  private readonly route = inject(ActivatedRoute);
  protected readonly userStore = inject(UserStore);

  protected readonly task = signal<TaskDetailed | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly infoExpanded = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.taskService.getById(id).subscribe({
      next: (task) => {
        this.task.set(task);
        this.isLoading.set(false);
        this.userStore.loadUserById(task.authorId);
      },
      error: () => this.isLoading.set(false),
    });
  }

  protected toggleInfo(): void {
    this.infoExpanded.update((v) => !v);
  }
}

import { Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { WorklogService } from '../../features/worklog/service/worklog.service';
import { TuiHint } from '@taiga-ui/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-rank-badge',
  standalone: true,
  host: {
    '[style.display]': 'rank() ? "inline-flex" : "none"',
    '[class.rank--gold]': 'rank() === 1',
    '[class.rank--silver]': 'rank() === 2',
    '[class.rank--bronze]': 'rank() === 3',
    '[class.rank--default]': '(rank() ?? 0) > 3',
  },
  templateUrl: './app-rank.html',
  styleUrl: './app-rank.scss',
  imports: [TuiHint, TranslatePipe],
})
export class AppRankBadge {
  readonly userId = input.required<string>();

  private readonly worklogService = inject(WorklogService);
  private readonly leaderboard = toSignal(this.worklogService.getLeaderboard(), {
    initialValue: [],
  });

  protected readonly rank = computed(() => {
    const id = this.userId();
    if (!id) return null;
    const entry = this.leaderboard().find((e) => e.userId === id);
    return entry?.rank ?? null;
  });
}

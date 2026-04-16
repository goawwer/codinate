import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Component({
  selector: 'app-team-detail',
  template: `<p>Team {{ id() }} — it works</p>`,
})
export class TeamDetailComponent {
  private readonly route = inject(ActivatedRoute);
  protected readonly id = toSignal(this.route.params.pipe(map((p) => p['id'])));
}

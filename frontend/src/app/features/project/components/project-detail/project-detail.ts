import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Component({
  selector: 'app-project-detail',
  template: `<p>Project {{ id() }} — it works</p>`,
})
export class ProjectDetailComponent {
  private readonly route = inject(ActivatedRoute);
  protected readonly id = toSignal(this.route.params.pipe(map((p) => p['id'])));
}

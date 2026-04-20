import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Component({
  selector: 'app-project-detail',
  imports: [],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.scss',
})
export class ProjectDetailComponent {
  private readonly route = inject(ActivatedRoute);
  protected readonly id = toSignal(this.route.params.pipe(map((p) => p['id'])));
}

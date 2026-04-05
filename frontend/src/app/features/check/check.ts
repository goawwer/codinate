import { Component, inject } from '@angular/core';
import { UserStore } from '../user/store/user.store';

@Component({
  selector: 'app-check',
  imports: [],
  templateUrl: './check.html',
  styleUrl: './check.scss',
})
export class Check {
  private readonly userStore = inject(UserStore);

  constructor() {
    console.log(this.userStore.user());
  }
}

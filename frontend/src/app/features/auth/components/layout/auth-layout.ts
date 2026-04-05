import { Component } from '@angular/core';
import { AuthLogin } from '../login/auth-login';

@Component({
  selector: 'app-auth-layout',
  imports: [AuthLogin],
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.scss',
})
export class AuthLayout {}

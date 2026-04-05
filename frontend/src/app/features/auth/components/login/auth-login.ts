import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { LOGINIMPORTS } from './auth.imports';
import { TUI_VALIDATION_ERRORS } from '@taiga-ui/kit';
import { TranslateService } from '@ngx-translate/core';
import {
  loginValidationErrorsFactory,
  passwordMinLength,
  usernameMaxLength,
  usernameMinLength,
} from '../../model/auth.validation';
import { LoginBody } from '../../model/auth.model';
import { AuthStore } from '../../store/auth.store';
import { FlatControlsOf } from '../../../../core/declarations/types/flat-control.type';

@Component({
  selector: 'app-login',
  imports: [LOGINIMPORTS],
  templateUrl: './auth-login.html',
  providers: [
    {
      provide: TUI_VALIDATION_ERRORS,
      useFactory: loginValidationErrorsFactory,
      deps: [TranslateService],
    },
  ],
})
export class AuthLogin {
  private readonly authStore = inject(AuthStore);

  isSubmitted = signal(false);
  showPassword = false;

  public readonly loginForm = new FormGroup<FlatControlsOf<LoginBody>>({
    username: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, usernameMinLength(3), usernameMaxLength(64)],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, passwordMinLength(8)],
    }),
  });

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.authStore.login(this.loginForm.getRawValue());
  }
}

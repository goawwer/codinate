import { TranslateService } from '@ngx-translate/core';
import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

export function loginValidationErrorsFactory(translate: TranslateService) {
  return {
    required: translate.stream('generic.validation.required'),

    email: translate.stream('generic.validation.email'),

    usernameMinLength: ({ requiredLength }: { requiredLength: number }) =>
      translate.stream('generic.validation.usernameMinLength', { requiredLength }),

    usernameMaxLength: ({ requiredLength }: { requiredLength: number }) =>
      translate.stream('generic.validation.usernameMaxLength', { requiredLength }),

    passwordMinLength: ({ requiredLength }: { requiredLength: number }) =>
      translate.stream('generic.validation.passwordMinLength', { requiredLength }),
  };
}

export function requiredErrorFactory(translate: TranslateService) {
  return {
    required: translate.stream('generic.validation.required'),
  };
}

export function usernameMinLength(min: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const error = Validators.minLength(min)(control);
    return error ? { usernameMinLength: error['minlength'] } : null;
  };
}

export function usernameMaxLength(max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const error = Validators.maxLength(max)(control);
    return error ? { usernameMaxLength: error['maxlength'] } : null;
  };
}

export function passwordMinLength(min: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const error = Validators.minLength(min)(control);
    return error ? { passwordMinLength: error['minlength'] } : null;
  };
}

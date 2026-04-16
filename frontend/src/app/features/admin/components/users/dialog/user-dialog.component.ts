import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TuiDialogContext, TUI_ITEMS_HANDLERS, TuiItemsHandlers } from '@taiga-ui/core';
import { TUI_VALIDATION_ERRORS } from '@taiga-ui/kit';
import { injectContext } from '@taiga-ui/polymorpheus';
import { TranslateService } from '@ngx-translate/core';
import { User } from '../../../../user/types/model/user.model';
import { EmployeeRolesStore } from '../../../../employee/store/employee-roles.store';
import { CreateUserInput, UpdateUserInput } from '../../../../user/types/model/dashboard.model';
import { UserStore } from '../../../../user/store/user.store';
import { USER_DIALOG_IMPORTS } from './user-dialog.imports';
import {
  usernameMaxLength,
  usernameMinLength,
  loginValidationErrorsFactory,
} from '../../../../auth/model/auth.validation';

export interface UserDialogData {
  user: User | null;
}

const FAKE_PASSWORD = '••••••••';

@Component({
  selector: 'app-user-dialog',
  standalone: true,
  imports: [USER_DIALOG_IMPORTS],
  templateUrl: './user-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: TUI_VALIDATION_ERRORS,
      useFactory: loginValidationErrorsFactory,
      deps: [TranslateService],
    },
    {
      provide: TUI_ITEMS_HANDLERS,
      useFactory: (translate: TranslateService): TuiItemsHandlers<string> => ({
        stringify: signal((value: string) => {
          if (!value) return '';
          const permKey = `generic.permissions.${value}`;
          const permTranslated = translate.instant(permKey);
          return permTranslated !== permKey
            ? permTranslated
            : translate.instant(`employee_roles.${value}`);
        }),
        identityMatcher: signal((a: string, b: string) => a === b),
        disabledItemHandler: signal((_: string) => false),
      }),
      deps: [TranslateService],
    },
  ],
})
export class UserDialogComponent {
  protected readonly store = inject(UserStore);
  protected readonly rolesStore = inject(EmployeeRolesStore);
  protected readonly context = injectContext<TuiDialogContext<void, UserDialogData>>();

  protected readonly user = this.context.data.user;
  protected readonly isEdit = this.user !== null;

  protected readonly form = new FormGroup({
    name: new FormControl(this.user?.name ?? '', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    surname: new FormControl(this.user?.surname ?? '', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    email: new FormControl(this.user?.email ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    username: new FormControl(this.user?.username ?? '', {
      nonNullable: true,
      validators: [Validators.required, usernameMinLength(3), usernameMaxLength(64)],
    }),
    role: new FormControl(this.user?.role ?? '', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    permission: new FormControl(this.user?.permission ?? '', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    password: new FormControl(this.isEdit ? FAKE_PASSWORD : '', {
      nonNullable: true,
      validators: this.isEdit ? [] : [Validators.required, Validators.minLength(8)],
    }),
    disabled: new FormControl(this.user?.disabled ?? false, { nonNullable: true }),
  });

  constructor() {
    if (!this.isEdit) {
      this.form.controls.email.valueChanges.pipe(takeUntilDestroyed()).subscribe((email) => {
        if (this.form.controls.username.pristine) {
          const username = email.split('@')[0];
          this.form.controls.username.setValue(username, { emitEvent: false });
        }
      });
    }
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const roleId = this.rolesStore.roles().find((r) => r.name === value.role)?.id;

    if (this.isEdit) {
      const input: UpdateUserInput = {
        name: value.name,
        surname: value.surname,
        username: value.username,
        email: value.email,
        roleId,
        permission: value.permission,
        disabled: value.disabled,
        ...(value.password && value.password !== FAKE_PASSWORD ? { password: value.password } : {}),
      };
      this.store.updateUser({ id: this.user!.id, input });
    } else {
      const input: CreateUserInput = {
        name: value.name,
        surname: value.surname,
        username: value.username,
        email: value.email,
        roleId: roleId!,
        password: value.password,
        permission: value.permission,
      };
      this.store.createUser(input);
    }

    this.context.completeWith();
  }
}

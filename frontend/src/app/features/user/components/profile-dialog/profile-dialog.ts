import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TuiDialogContext } from '@taiga-ui/core';
import { TUI_VALIDATION_ERRORS } from '@taiga-ui/kit';
import { injectContext } from '@taiga-ui/polymorpheus';
import { TranslateService } from '@ngx-translate/core';
import { UserProfile } from '../../types/model/profile.model';
import { UserApiService } from '../../service/user.service';
import { AlertService } from '../../../../core/declarations/services/alert.service';
import { loginValidationErrorsFactory } from '../../../auth/model/auth.validation';
import { PROFILE_DIALOG_IMPORTS } from './profile-dialog.imports';
import { API_CONFIG } from '../../../../core/declarations/tokens/api-config.token';

@Component({
  selector: 'app-profile-dialog',
  standalone: true,
  imports: [PROFILE_DIALOG_IMPORTS],
  templateUrl: './profile-dialog.html',
  styleUrl: './profile-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: TUI_VALIDATION_ERRORS,
      useFactory: loginValidationErrorsFactory,
      deps: [TranslateService],
    },
  ],
})
export class ProfileDialogComponent {
  protected readonly context = injectContext<TuiDialogContext<boolean, UserProfile>>();
  private readonly service = inject(UserApiService);
  private readonly alert = inject(AlertService);
  private readonly translate = inject(TranslateService);
  private readonly apiConfig = inject(API_CONFIG);

  protected readonly profile = this.context.data;

  protected readonly avatarPreview = signal<string | null>(
    this.profile.avatar ? '/apipublic/' + this.profile.avatar : null,
  );

  protected readonly backgroundPreview = signal<string | null>(
    this.profile.backgroundPicture
      ? `${this.apiConfig.rootUrl}/apipublic/users/backgrounds/${this.profile.id}?filename=` +
          this.profile.backgroundPicture
      : null,
  );
  protected readonly selectedAvatar = signal<File | null>(null);
  protected readonly selectedBackground = signal<File | null>(null);
  protected readonly loading = signal(false);
  protected readonly currentLang = signal(this.translate.currentLang ?? 'ru');
  protected open = false;
  protected readonly language = new FormControl(this.translate.currentLang ?? 'ru');

  protected readonly form = new FormGroup({
    username: new FormControl(this.profile.username, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    about: new FormControl(this.profile.about ?? '', {
      nonNullable: true,
    }),
  });

  protected onAvatarSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.selectedAvatar.set(file);
    const reader = new FileReader();
    reader.onload = () => this.avatarPreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  protected onBackgroundSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.selectedBackground.set(file);
    const reader = new FileReader();
    reader.onload = () => this.backgroundPreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  protected removeAvatar(): void {
    this.selectedAvatar.set(null);
    this.avatarPreview.set(null);
  }

  protected removeBackground(): void {
    this.selectedBackground.set(null);
    this.backgroundPreview.set(null);
  }

  protected setLang(lang: string): void {
    this.language.setValue(lang);
    this.translate.use(lang);
    this.currentLang.set(lang);
    localStorage.setItem('lang', lang);
    this.open = false;
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    const { username, about } = this.form.getRawValue();
    this.service
      .updateProfile(
        this.profile.id,
        { username, about: about || null },
        this.selectedAvatar() ?? undefined,
        this.selectedBackground() ?? undefined,
      )
      .subscribe({
        next: () => {
          this.alert.success(this.translate.instant('cmd.user.profile.success.updated'));
          this.context.completeWith(true);
        },
        error: () => {
          this.loading.set(false);
          this.alert.error(this.translate.instant('cmd.user.profile.errors.updateFailed'));
        },
      });
  }
}

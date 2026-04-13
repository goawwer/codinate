import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TuiDialogContext } from '@taiga-ui/core';
import { TUI_VALIDATION_ERRORS } from '@taiga-ui/kit';
import { injectContext } from '@taiga-ui/polymorpheus';
import { TranslateService } from '@ngx-translate/core';
import { Team, TeamMember } from '../../../../team/types/model/team.model';
import { TeamStore } from '../../../../team/store/team.store';
import { TeamApiService } from '../../../../team/service/team.service';
import { CreateTeamInput, UpdateTeamInput } from '../../../../team/types/model/team-dashboard.model';
import { TEAM_DIALOG_IMPORTS } from './team-dialog.imports';
import { loginValidationErrorsFactory } from '../../../../auth/model/auth.validation';

export interface TeamDialogData {
  team: Team | null;
}

@Component({
  selector: 'app-team-dialog',
  standalone: true,
  imports: [TEAM_DIALOG_IMPORTS],
  templateUrl: './team-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: TUI_VALIDATION_ERRORS,
      useFactory: loginValidationErrorsFactory,
      deps: [TranslateService],
    },
  ],
})
export class TeamDialogComponent {
  protected readonly store = inject(TeamStore);
  protected readonly service = inject(TeamApiService);
  protected readonly context = injectContext<TuiDialogContext<void, TeamDialogData>>();

  protected readonly team = this.context.data.team;
  protected readonly isEdit = this.team !== null;

  protected readonly previewUrl = signal<string | null>(null);
  protected selectedFile: File | null = null;

  protected readonly members = signal<TeamMember[]>([...(this.team?.members ?? [])]);
  protected readonly removingId = signal<string | null>(null);

  protected readonly form = new FormGroup({
    name: new FormControl(this.team?.name ?? '', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    description: new FormControl(this.team?.description ?? '', {
      nonNullable: true,
    }),
  });

  protected onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => this.previewUrl.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  protected removeMember(member: TeamMember): void {
    if (!member.userId) return;
    this.removingId.set(member.userId);
    this.service.removeMember(this.team!.id, member.userId).subscribe({
      next: () => {
        this.members.update((list) => list.filter((m) => m.userId !== member.userId));
        this.removingId.set(null);
      },
      error: () => this.removingId.set(null),
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    if (this.isEdit) {
      const input: UpdateTeamInput = {
        name: value.name,
        description: value.description,
      };
      this.store.updateTeam({ id: this.team!.id, input });
    } else {
      const input: CreateTeamInput = {
        name: value.name,
        description: value.description,
        pictureName: '',
      };
      this.store.createTeam(input);
    }

    this.context.completeWith();
  }
}

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TuiDialogContext } from '@taiga-ui/core';
import { TUI_VALIDATION_ERRORS } from '@taiga-ui/kit';
import { TUI_MULTI_SELECT_TEXTS } from '@taiga-ui/kit/tokens';
import { filter, of, startWith } from 'rxjs';
import { injectContext } from '@taiga-ui/polymorpheus';
import { TranslateService } from '@ngx-translate/core';
import { Team, TeamMember } from '../../types/model/team.model';
import { TeamStore } from '../../store/team.store';
import { TeamApiService } from '../../service/team.service';
import { AlertService } from '../../../../core/declarations/services/alert.service';
import { AppDialogService } from '../../../../common/dialogs/dialog.service';
import { CreateTeamInput, UpdateTeamInput } from '../../types/model/team-dashboard.model';
import { TEAM_DIALOG_IMPORTS } from './team-dialog.imports';
import { loginValidationErrorsFactory } from '../../../auth/model/auth.validation';
import { UserStore } from '../../../user/store/user.store';
import { User } from '../../../user/types/model/user.model';
import { toSignal } from '@angular/core/rxjs-interop';

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
  protected readonly userStore = inject(UserStore);
  protected readonly context = injectContext<TuiDialogContext<void, TeamDialogData>>();
  private readonly alert = inject(AlertService);
  private readonly translate = inject(TranslateService);
  private readonly dialogs = inject(AppDialogService);

  protected readonly team = this.context.data.team;
  protected readonly isEdit = this.team !== null;

  protected readonly activeTab = signal(0);
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly selectedFile = signal<File | null>(null);

  protected readonly members = signal<TeamMember[]>([...(this.team?.members ?? [])]);
  protected readonly memberToAdd = new FormControl<string>('', { nonNullable: true });
  protected readonly selectedMember = signal<User | null>(null);
  protected readonly removingId = signal<string | null>(null);
  protected readonly addingId = signal<string | null>(null);

  protected readonly stringify = (user: User | null) =>
    user ? `${user.name} ${user.surname}` : '';

  protected readonly form = new FormGroup({
    name: new FormControl(this.team?.name ?? '', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    description: new FormControl(this.team?.description ?? '', {
      nonNullable: true,
    }),
    memberIds: new FormControl<User[]>([], { nonNullable: true }),
  });

  private readonly formValue = toSignal(this.form.valueChanges.pipe(startWith(this.form.value)), {
    initialValue: this.form.value,
  });

  protected readonly hasChanges = computed(() => {
    if (!this.isEdit) return true;
    const val = this.formValue();
    return (
      val.name !== (this.team?.name ?? '') ||
      val.description !== (this.team?.description ?? '') ||
      this.selectedFile() !== null
    );
  });

  protected readonly userGroups = computed(() => {
    const roleMap = new Map<string, User[]>();
    for (const user of this.userStore.users()) {
      const list = roleMap.get(user.role) ?? [];
      list.push(user);
      roleMap.set(user.role, list);
    }
    return Array.from(roleMap.entries()).map(([role, users]) => ({ role, users }));
  });

  protected readonly availableUserGroups = computed(() => {
    const memberIds = new Set(this.members().map((m) => m.id));
    return this.userGroups()
      .map(({ role, users }) => ({ role, users: users.filter((u) => !memberIds.has(u.id)) }))
      .filter(({ users }) => users.length > 0);
  });

  protected onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.selectedFile.set(file);
    const reader = new FileReader();
    reader.onload = () => this.previewUrl.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  protected removeMember(member: TeamMember): void {
    this.removingId.set(member.id!);
    this.service.removeMember(this.team!.id, member.id).subscribe({
      next: () => {
        this.members.update((list) => list.filter((m) => m.id !== member.id));
        this.removingId.set(null);
      },
      error: () => this.removingId.set(null),
    });
  }

  protected addMember(): void {
    const member = this.selectedMember();
    if (!member) return;
    this.addingId.set(member.id);
    this.service.addMember(this.team!.id, member.id).subscribe({
      next: () => {
        this.members.update((list) => [
          ...list,
          { id: member.id, name: member.name, surname: member.surname, picture: member.picture },
        ]);
        this.memberToAdd.reset();
        this.selectedMember.set(null);
        this.addingId.set(null);
      },
      error: () => this.addingId.set(null),
    });
  }

  protected deletePicture(): void {
    if (this.previewUrl()) {
      this.previewUrl.set(null);
      this.selectedFile.set(null);
      return;
    }
    if (this.team?.pictureName) {
      this.service.deletePicture(this.team.id).subscribe({
        next: () => {
          this.store.loadTeams();
          this.alert.success(this.translate.instant('cmd.teams.success.pictureDeleted'));
          this.context.completeWith();
        },
        error: () => {
          this.alert.error(this.translate.instant('cmd.teams.errors.pictureDeleteFailed'));
        },
      });
    }
  }

  protected deleteTeam(): void {
    this.dialogs
      .confirm({
        label: this.translate.instant('admin.dashboard.teams.dialogs.deleteTitle'),
        content: this.translate.instant('admin.dashboard.teams.dialogs.deleteContent', {
          count: 1,
        }),
        yes: this.translate.instant('generic.actions.delete'),
        no: this.translate.instant('generic.actions.cancel'),
      })
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.store.deleteTeams([this.team!.id]);
        this.context.completeWith();
      });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    if (this.isEdit) {
      const file = this.selectedFile();
      const input: UpdateTeamInput = {};

      if (value.name !== (this.team?.name ?? '')) {
        input.name = value.name;
      }
      if (value.description !== (this.team?.description ?? '')) {
        input.description = value.description;
      }
      if (file) {
        input.pictureName = file.name;
      }

      this.store.updateTeam({ id: this.team!.id, input, file: file ?? undefined });
    } else {
      const input: CreateTeamInput = {
        name: value.name,
        description: value.description,
        pictureName: '',
        memberIds: value.memberIds.map((u) => u.id),
      };
      this.store.createTeam({ input, file: this.selectedFile() ?? undefined });
    }

    this.context.completeWith();
  }
}

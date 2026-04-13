import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TuiDialogContext } from '@taiga-ui/core';
import { TUI_VALIDATION_ERRORS } from '@taiga-ui/kit';
import { injectContext } from '@taiga-ui/polymorpheus';
import { TranslateService } from '@ngx-translate/core';
import { Project, ProjectMember } from '../../../../project/types/model/project.model';
import { ProjectStore } from '../../../../project/store/project.store';
import { ProjectApiService } from '../../../../project/service/project.service';
import { CreateProjectInput, UpdateProjectInput } from '../../../../project/types/model/project-dashboard.model';
import { PROJECT_DIALOG_IMPORTS } from './project-dialog.imports';
import { loginValidationErrorsFactory } from '../../../../auth/model/auth.validation';

export interface ProjectDialogData {
  project: Project | null;
}

@Component({
  selector: 'app-project-dialog',
  standalone: true,
  imports: [PROJECT_DIALOG_IMPORTS],
  templateUrl: './project-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: TUI_VALIDATION_ERRORS,
      useFactory: loginValidationErrorsFactory,
      deps: [TranslateService],
    },
  ],
})
export class ProjectDialogComponent {
  protected readonly store = inject(ProjectStore);
  protected readonly service = inject(ProjectApiService);
  protected readonly context = injectContext<TuiDialogContext<void, ProjectDialogData>>();

  protected readonly project = this.context.data.project;
  protected readonly isEdit = this.project !== null;

  protected readonly previewUrl = signal<string | null>(null);
  protected selectedFile: File | null = null;

  protected readonly members = signal<ProjectMember[]>([...(this.project?.members ?? [])]);
  protected readonly removingId = signal<string | null>(null);

  protected readonly form = new FormGroup({
    projectName: new FormControl(this.project?.projectName ?? '', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    projectDescription: new FormControl(this.project?.projectDescription ?? '', {
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

  protected removeMember(member: ProjectMember): void {
    if (!member.userId) return;
    this.removingId.set(member.userId);
    this.service.removeMember(this.project!.id, member.userId).subscribe({
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
      const input: UpdateProjectInput = {
        projectName: value.projectName,
        projectDescription: value.projectDescription,
      };
      this.store.updateProject({ id: this.project!.id, input });
    } else {
      const input: CreateProjectInput = {
        projectName: value.projectName,
        projectDescription: value.projectDescription,
        projectPictureName: '',
      };
      this.store.createProject(input);
    }

    this.context.completeWith();
  }
}

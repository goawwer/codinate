import { Component, inject, OnInit } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TuiButton, TuiTextfield, TuiTitle } from '@taiga-ui/core';
import { TuiInputChip } from '@taiga-ui/kit';
import { TuiItem } from '@taiga-ui/cdk';
import { forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import {
  EmployeeRole,
  EmployeeRolesService,
} from '../../../employee/service/employee-roles.service';
import { TaskPriority, TaskPrioritiesService } from '../../../task/service/task-priorities.service';
import { TaskStatus, TaskStatusesService } from '../../../task/service/task-statuses.service';
import { AlertService } from '../../../../core/declarations/services/alert.service';
import { AppSize } from '../../../../core/declarations/tokens/size.token';

type NamedItem = { id: number; name: string };

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [
    TranslatePipe,
    TuiTitle,
    ReactiveFormsModule,
    TuiButton,
    TuiTextfield,
    TuiInputChip,
    TuiItem,
  ],
  templateUrl: './admin-settings.html',
  styleUrl: './admin-settings.scss',
})
export class AdminSettings implements OnInit {
  private readonly rolesService = inject(EmployeeRolesService);
  private readonly prioritiesService = inject(TaskPrioritiesService);
  private readonly statusesService = inject(TaskStatusesService);
  private readonly alertService = inject(AlertService);
  private readonly translate = inject(TranslateService);

  protected readonly inputSize: AppSize = 'm';
  protected saving = false;

  protected get hasChanges(): boolean {
    return (
      this.buildOps(this.originalRoles, this.rolesControl.value, this.rolesService).length > 0 ||
      this.buildOps(this.originalPriorities, this.prioritiesControl.value, this.prioritiesService)
        .length > 0 ||
      this.buildOps(this.originalStatuses, this.statusesControl.value, this.statusesService)
        .length > 0
    );
  }

  protected originalRoles: EmployeeRole[] = [];
  protected originalPriorities: TaskPriority[] = [];
  protected originalStatuses: TaskStatus[] = [];

  protected readonly rolesControl = new FormControl<string[]>([], { nonNullable: true });
  protected readonly prioritiesControl = new FormControl<string[]>([], { nonNullable: true });
  protected readonly statusesControl = new FormControl<string[]>([], { nonNullable: true });

  ngOnInit(): void {
    forkJoin([
      this.rolesService.getAll(),
      this.prioritiesService.getAll(),
      this.statusesService.getAll(),
    ]).subscribe({
      next: ([roles, priorities, statuses]) => {
        this.originalRoles = roles ?? [];
        this.originalPriorities = priorities ?? [];
        this.originalStatuses = statuses ?? [];
        this.rolesControl.setValue(this.originalRoles.map((r) => r.name));
        this.prioritiesControl.setValue(this.originalPriorities.map((p) => p.name));
        this.statusesControl.setValue(this.originalStatuses.map((s) => s.name));
      },
      error: () => {
        this.alertService.error(this.translate.instant('generic.operations.fail'));
      },
    });
  }

  protected save(): void {
    const roleOps = this.buildOps(this.originalRoles, this.rolesControl.value, this.rolesService);
    const priorityOps = this.buildOps(
      this.originalPriorities,
      this.prioritiesControl.value,
      this.prioritiesService,
    );
    const statusOps = this.buildOps(
      this.originalStatuses,
      this.statusesControl.value,
      this.statusesService,
    );

    const allOps = [...roleOps, ...priorityOps, ...statusOps];
    if (!allOps.length) return;

    this.saving = true;

    forkJoin(allOps)
      .pipe(
        switchMap(() =>
          forkJoin([
            this.rolesService.getAll(),
            this.prioritiesService.getAll(),
            this.statusesService.getAll(),
          ]),
        ),
      )
      .subscribe({
        next: ([roles, priorities, statuses]) => {
          this.saving = false;
          this.originalRoles = roles ?? [];
          this.originalPriorities = priorities ?? [];
          this.originalStatuses = statuses ?? [];
          this.rolesControl.setValue(this.originalRoles.map((r) => r.name));
          this.prioritiesControl.setValue(this.originalPriorities.map((p) => p.name));
          this.statusesControl.setValue(this.originalStatuses.map((s) => s.name));
          this.alertService.success(this.translate.instant('admin.settings.saved'));
        },
        error: () => {
          this.saving = false;
          this.alertService.error(this.translate.instant('generic.operations.fail'));
        },
      });
  }

  private buildOps(
    original: NamedItem[] | null,
    current: string[],
    service: { add: (n: string) => any; delete: (id: number) => any },
  ) {
    const safeOriginal = original ?? [];

    const toAdd = current.filter((name) => !safeOriginal.some((o) => o.name === name));

    const toDelete = safeOriginal.filter((o) => !current.includes(o.name));

    return [
      ...toAdd.map((name) => service.add(name)),
      ...toDelete.map((o) => service.delete(o.id)),
    ];
  }
}

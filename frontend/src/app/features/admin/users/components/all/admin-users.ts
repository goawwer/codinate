import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { filter } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { AppDialogService } from '../../../../../common/dialogs/dialog.service';
import { User } from '../../../../user/types/model/user.model';
import { AdminUsersStore } from '../../store/admin-users.store';
import { EmployeeRolesStore } from '../../../../employee/store/employee-roles.store';
import { USERSDASHBOARDIMPORTS } from './admin-users.imports';
import { APP_SIZE, AppSize } from '../../../../../core/declarations/tokens/size.token';

type Column = {
  key: keyof User;
  isDate?: boolean;
  isRole?: boolean;
  isStatus?: boolean;
  width?: string;
};

@Component({
  selector: 'app-admin-users',
  imports: [USERSDASHBOARDIMPORTS],
  providers: [{ provide: APP_SIZE, useValue: 'l' }],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.scss',
})
export class AdminUsers implements OnInit {
  readonly store = inject(AdminUsersStore);
  readonly rolesStore = inject(EmployeeRolesStore);
  private readonly dialogs = inject(AppDialogService);
  private readonly translate = inject(TranslateService);
  protected readonly tableSize = inject(APP_SIZE);
  protected readonly inputSize: AppSize = 'm';

  protected readonly columns: Column[] = [
    { key: 'name', width: '8rem' },
    { key: 'surname', width: '8rem' },
    { key: 'username', width: '8rem' },
    { key: 'email', width: '8rem' },
    { key: 'role', isRole: true, width: '8rem' },
    { key: 'disabled', isStatus: true, width: '6rem' },
    { key: 'createdAt', isDate: true, width: '10rem' },
    { key: 'updatedAt', isDate: true, width: '10rem' },
  ];

  protected readonly searchQuery = signal('');
  protected readonly filteredUsers = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const users = this.store.users();
    if (!q) return users;

    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.surname.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q),
    );
  });

  protected readonly groupedUsers = computed(() => {
    const roles = this.rolesStore.roles();
    const users = this.filteredUsers();

    return roles
      .map((role) => ({
        role,
        users: users.filter((u) => u.role === role.name),
      }))
      .filter((g) => g.users.length > 0);
  });

  protected readonly selectedIds = signal(new Set<string>());
  protected readonly hasSelection = computed(() => this.selectedIds().size > 0);

  protected isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  protected allGroupSelected(users: User[]): boolean {
    return users.length > 0 && users.every((u) => this.selectedIds().has(u.id));
  }

  protected toggleGroupAll(users: User[], checked: boolean): void {
    this.selectedIds.update((set) => {
      const next = new Set(set);
      users.forEach((u) => (checked ? next.add(u.id) : next.delete(u.id)));
      return next;
    });
  }

  protected toggleUser(id: string, checked: boolean): void {
    this.selectedIds.update((set) => {
      const next = new Set(set);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }

  protected confirmDelete(): void {
    const count = this.selectedIds().size;
    this.dialogs
      .confirm({
        label: this.translate.instant('admin.dashboard.users.dialogs.deleteTitle'),
        content: this.translate.instant('admin.dashboard.users.dialogs.deleteContent', { count }),
        yes: this.translate.instant('generic.actions.delete'),
        no: this.translate.instant('generic.actions.cancel'),
      })
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.store.deleteUsers([...this.selectedIds()]);
        this.selectedIds.set(new Set());
      });
  }

  ngOnInit(): void {
    this.rolesStore.load();
    this.store.loadUsers({});
  }
}

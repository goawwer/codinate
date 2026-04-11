import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { filter } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { AppDialogService } from '../../../../../common/dialogs/dialog.service';
import { User } from '../../../../user/types/model/user.model';
import { AdminUsersStore } from '../../store/admin-users.store';
import { USERSDASHBOARDIMPORTS } from './admin-users.imports';
import { APP_SIZE, AppSize } from '../../../../../core/declarations/tokens/size.token';

type Column = {
  key: keyof User;
  isDate?: boolean;
  isRole?: boolean;
  isStatus?: boolean;
  isSortable?: boolean;
  hasFilter?: boolean;
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
  private readonly dialogs = inject(AppDialogService);
  private readonly translate = inject(TranslateService);
  protected readonly tableSize = inject(APP_SIZE);
  protected readonly inputSize: AppSize = 'm';

  protected readonly columns: Column[] = [
    { key: 'name' },
    { key: 'surname' },
    { key: 'username' },
    { key: 'email' },
    { key: 'role', isRole: true, hasFilter: true },
    { key: 'disabled', isStatus: true, hasFilter: true },
    { key: 'createdAt', isDate: true, isSortable: true },
    { key: 'updatedAt', isDate: true, isSortable: true },
  ];

  protected readonly roleOptions = ['owner', 'admin', 'user'];

  protected readonly searchQuery = signal('');
  protected readonly roleFilter = signal<string[]>([]);
  protected readonly statusFilter = signal<boolean | null>(null);
  protected readonly sortKey = signal<keyof User | null>(null);
  protected readonly sortAsc = signal(true);

  protected readonly filteredUsers = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const roles = this.roleFilter();
    const status = this.statusFilter();
    const key = this.sortKey();
    const asc = this.sortAsc();

    let users = this.store.users();

    if (q) {
      users = users.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.surname.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q),
      );
    }

    if (roles.length > 0) {
      users = users.filter((u) => roles.includes(u.role));
    }

    if (status !== null) {
      users = users.filter((u) => u.disabled === status);
    }

    if (key) {
      users = [...users].sort((a, b) => {
        const aVal = String(a[key]);
        const bVal = String(b[key]);
        return asc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      });
    }

    return users;
  });

  protected readonly selectedIds = signal(new Set<string>());
  protected readonly hasSelection = computed(() => this.selectedIds().size > 0);

  protected isRoleSelected(role: string): boolean {
    return this.roleFilter().includes(role);
  }

  protected toggleRole(role: string): void {
    const current = this.roleFilter();
    this.roleFilter.set(
      current.includes(role) ? current.filter((r) => r !== role) : [...current, role],
    );
  }

  protected setStatusFilter(value: boolean | null): void {
    this.statusFilter.set(this.statusFilter() === value ? null : value);
  }

  protected toggleSort(key: keyof User): void {
    if (this.sortKey() === key) {
      this.sortAsc.update((v) => !v);
    } else {
      this.sortKey.set(key);
      this.sortAsc.set(true);
    }
  }

  protected sortIcon(key: keyof User): string {
    if (this.sortKey() !== key) return '@tui.chevrons-up-down';
    return this.sortAsc() ? '@tui.arrow-up' : '@tui.arrow-down';
  }

  protected isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  protected allSelected(): boolean {
    const users = this.filteredUsers();
    return users.length > 0 && users.every((u) => this.selectedIds().has(u.id));
  }

  protected toggleUser(id: string, checked: boolean): void {
    this.selectedIds.update((set) => {
      const next = new Set(set);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }

  protected toggleAll(checked: boolean): void {
    this.selectedIds.set(checked ? new Set(this.filteredUsers().map((u) => u.id)) : new Set());
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
    this.store.loadUsers();
  }
}

import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { filter } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { AppDialogService } from '../../../../../common/dialogs/dialog.service';
import { User } from '../../../../user/types/model/user.model';
import { UserStore } from '../../../../user/store/user.store';
import { EmployeeRolesStore } from '../../../../employee/store/employee-roles.store';
import { USERSDASHBOARDIMPORTS } from './admin-users.imports';
import { APP_SIZE, AppSize } from '../../../../../core/declarations/tokens/size.token';
import { UserDialogComponent, UserDialogData } from '../dialog/user-dialog.component';
import { UserApiService } from '../../../../user/service/user.service';

export type Period = 'last-month' | 'current-month' | 'first-20-days';
type UserColumnKey = keyof User | 'hours';

type Column = {
  key: UserColumnKey;
  isDate?: boolean;
  isRole?: boolean;
  isStatus?: boolean;
  isHours?: boolean;
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
  readonly store = inject(UserStore);
  readonly rolesStore = inject(EmployeeRolesStore);
  private readonly dialogs = inject(AppDialogService);
  private readonly translate = inject(TranslateService);
  private readonly userApi = inject(UserApiService);
  protected readonly tableSize = inject(APP_SIZE);
  protected readonly inputSize: AppSize = 'm';

  protected isUserKey(key: UserColumnKey): key is keyof User {
    return key !== 'hours';
  }

  protected getUserValue(user: User, key: UserColumnKey): User[keyof User] | null {
    return this.isUserKey(key) ? user[key] : null;
  }

  protected readonly columns: Column[] = [
    { key: 'name', width: '8rem' },
    { key: 'surname', width: '8rem' },
    { key: 'username', width: '8rem' },
    { key: 'email', width: '10rem' },
    { key: 'role', isRole: true, width: '8rem' },
    { key: 'disabled', isStatus: true, width: '6rem' },
    { key: 'createdAt', isDate: true, width: '9rem' },
    { key: 'hours', isHours: true, width: '9rem' },
  ];

  protected readonly periods: Period[] = ['last-month', 'current-month', 'first-20-days'];
  protected readonly activePeriod = signal<Period>('last-month');
  protected readonly hoursMap = signal(new Map<string, number>());

  constructor() {
    effect(() => {
      const { from, to } = this.getPeriodDates(this.activePeriod());
      this.userApi.getAllUsersHours(from, to).subscribe((stats) => {
        this.hoursMap.set(new Map(stats.map((s) => [s.userId, s.totalMinutes])));
      });
    });
  }

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

  protected getUserHours(userId: string): string {
    return this.formatMinutes(this.hoursMap().get(userId) ?? 0);
  }

  protected periodLabel(period: Period): string {
    const key = period.replace(/-/g, '_');
    return this.translate.instant(`admin.dashboard.users.periods.${key}`);
  }

  protected openCreateDialog(): void {
    this.dialogs
      .component<UserDialogComponent, void, UserDialogData>(UserDialogComponent, {
        label: this.translate.instant('admin.dashboard.users.dialogs.createTitle'),
        size: 'l',
        data: { user: null },
      })
      .subscribe();
  }

  protected openEditDialog(user: User): void {
    this.dialogs
      .component<UserDialogComponent, void, UserDialogData>(UserDialogComponent, {
        label: this.translate.instant('admin.dashboard.users.dialogs.editTitle'),
        size: 'l',
        data: { user },
      })
      .subscribe();
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

  private getPeriodDates(period: Period): { from: string; to: string } {
    const now = new Date();
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    switch (period) {
      case 'last-month': {
        const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const to = new Date(now.getFullYear(), now.getMonth(), 0);
        return { from: fmt(from), to: fmt(to) };
      }
      case 'current-month': {
        const from = new Date(now.getFullYear(), now.getMonth(), 1);
        return { from: fmt(from), to: fmt(now) };
      }
      case 'first-20-days': {
        const from = new Date(now.getFullYear(), now.getMonth(), 1);
        const to = new Date(now.getFullYear(), now.getMonth(), 20);
        return { from: fmt(from), to: fmt(to) };
      }
    }
  }

  private formatMinutes(minutes: number): string {
    if (minutes <= 0) return '0h';
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (!hours) return `${rest}m`;
    if (!rest) return `${hours}h`;
    return `${hours}h ${rest}m`;
  }
}

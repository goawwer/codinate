import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { UserProfile, UserProfileStats } from '../../types/model/profile.model';
import { UserStore } from '../../store/user.store';
import { UserApiService } from '../../service/user.service';
import { AppDialogService } from '../../../../common/dialogs/dialog.service';
import { ProfileDialogComponent } from '../profile-dialog/profile-dialog';
import { TranslateService } from '@ngx-translate/core';
import { PROFILEIMPORTS } from './profile.imports';
import { API_CONFIG } from '../../../../core/declarations/tokens/api-config.token';

@Component({
  selector: 'app-profile',
  imports: [PROFILEIMPORTS],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class UserProfileComponent {
  protected readonly profile = signal<UserProfile | null>(null);
  protected readonly stats = signal<UserProfileStats | null>(null);
  protected readonly activeTab = signal(0);
  private readonly userStore = inject(UserStore);
  private readonly dialogs = inject(AppDialogService);
  private readonly translate = inject(TranslateService);
  private readonly apiService = inject(UserApiService);
  private readonly apiConfig = inject(API_CONFIG);

  protected readonly isOwnProfile = computed(
    () => this.profile()?.id === this.userStore.user()?.id,
  );

  protected readonly fullName = computed(() => {
    const user = this.profile();
    if (!user) return '';
    const fullName = `${user.name ?? ''} ${user.surname ?? ''}`.trim();
    return fullName || user.username;
  });

  protected readonly initials = computed(() => {
    const user = this.profile();
    if (!user) return '';
    const name = user.name?.[0] ?? user.username?.[0] ?? '';
    const surname = user.surname?.[0] ?? '';
    return `${name}${surname}`.toUpperCase();
  });

  protected readonly recentLabel = computed(() => {
    const minutes = this.profile()?.recentMinutes ?? 0;
    return minutes > 0 ? this.spentLabel(minutes) : '—';
  });

  protected readonly backgroundSrc = computed(() => {
    const bg = this.profile()?.backgroundPicture;
    return bg
      ? `${this.apiConfig.rootUrl}/apipublic/users/backgrounds/${this.profile()!.id}?filename=` + bg
      : null;
  });

  protected readonly totalSpentMinutes = computed(
    () => this.profile()?.projects.reduce((total, p) => total + p.spentMinutes, 0) ?? 0,
  );

  protected readonly projects = computed(() =>
    [...(this.profile()?.projects ?? [])].sort((a, b) => b.spentMinutes - a.spentMinutes),
  );

  protected readonly totalRecentMinutes = computed(() => this.profile()?.recentMinutes ?? 0);

  protected readonly recentProjects = computed(() =>
    this.projects().filter((p) => p.recentMinutes > 0),
  );

  protected readonly workDynamicsMax = 600;

  protected readonly workDynamicsLabelsY = computed(() => {
    const h = this.translate.instant('generic.time.hoursShort');
    return ['0', `2${h}`, `4${h}`, `6${h}`, `8${h}`, `10${h}`];
  });

  protected readonly workDynamicsLabelsX = computed((): string[] => {
    const today = new Date();
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - 13 + i);
      return `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
  });

  protected readonly workDynamicsValue = computed((): ReadonlyArray<ReadonlyArray<number>> => {
    const dynamics = this.stats()?.workDynamics ?? [];
    const lookup = new Map(dynamics.map((s) => [s.date.substring(0, 10), s.spentMinutes]));
    const today = new Date();
    const values = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - 13 + i);
      const key = this.toDateStr(d);
      return Math.min(lookup.get(key) ?? 0, this.workDynamicsMax);
    });
    return [values];
  });

  protected readonly focusActiveIndex = signal(NaN);

  private readonly focusStats = computed(() => {
    const sorted = [...(this.stats()?.projectFocus ?? [])].sort(
      (a, b) => b.spentMinutes - a.spentMinutes,
    );
    const top = sorted.slice(0, 5);
    const rest = sorted.slice(5).reduce((acc, p) => acc + p.spentMinutes, 0);
    return { top, rest };
  });

  protected readonly focusValue = computed((): ReadonlyArray<number> => {
    const { top, rest } = this.focusStats();
    if (!top.length) return [];
    const values = top.map((p) => p.spentMinutes);
    if (rest > 0) values.push(rest);
    return values;
  });

  protected readonly focusLabels = computed((): string[] => {
    const { top, rest } = this.focusStats();
    const labels = top.map((p) => p.projectName);
    if (rest > 0) labels.push(this.translate.instant('generic.titles.others'));
    return labels;
  });

  protected readonly focusActiveLabel = computed((): string => {
    const i = this.focusActiveIndex();
    if (isNaN(i)) return this.translate.instant('models.project.title.all');
    return this.focusLabels()[i] ?? '';
  });

  protected readonly focusActiveTime = computed((): string => {
    const i = this.focusActiveIndex();
    const values = this.focusValue();
    const minutes = isNaN(i) ? values.reduce((a, b) => a + b, 0) : (values[i] ?? 0);
    return this.spentLabel(minutes);
  });

  constructor() {
    const routeId = inject(ActivatedRoute).snapshot.paramMap.get('id');
    const userId = routeId ?? this.userStore.user()?.id;
    if (userId) {
      this.apiService
        .getProfile(userId)
        .pipe(takeUntilDestroyed())
        .subscribe((data) => this.profile.set(data));

      const today = new Date();
      const from = new Date(today);
      from.setDate(from.getDate() - 13);
      this.apiService
        .getProfileStats(userId, this.toDateStr(from), this.toDateStr(today))
        .pipe(takeUntilDestroyed())
        .subscribe((data) => this.stats.set(data));
    }
  }

  private toDateStr(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  protected openSettings(): void {
    const current = this.profile();
    if (!current) return;
    this.dialogs
      .component<ProfileDialogComponent, boolean, UserProfile>(ProfileDialogComponent, {
        label: this.translate.instant('models.user.profile.settings'),
        size: 'l',
        data: current,
      })
      .subscribe((updated) => {
        if (updated) {
          this.apiService.getProfile(current.id).subscribe((data) => this.profile.set(data));
        }
      });
  }

  protected spentLabel(minutes: number): string {
    const h = this.translate.instant('generic.time.hoursShort');
    const m = this.translate.instant('generic.time.minutesShort');
    if (minutes <= 0) return `0${h}`;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (!hours) return `${rest}${m}`;
    if (!rest) return `${hours}${h}`;
    return `${hours}${h} ${rest}${m}`;
  }

  protected workDynamicsFullLabel(index: number): string {
    return this.workDynamicsLabelsX()[index] ?? '';
  }

  protected workDynamicsTotalLabel(): string {
    const total = this.workDynamicsValue()[0]?.reduce((sum, value) => sum + value, 0) ?? 0;

    return this.spentLabel(total);
  }
}

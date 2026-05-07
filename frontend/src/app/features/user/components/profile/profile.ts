import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { UserProfile } from '../../types/model/profile.model';
import { UserStore } from '../../store/user.store';
import { UserApiService } from '../../service/user.service';
import { PROFILEIMPORTS } from './profile.imports';

const PUBLIC_URL = '/api/public/';

@Component({
  selector: 'app-profile',
  imports: [PROFILEIMPORTS],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class UserProfileComponent {
  protected readonly profile = signal<UserProfile | null>(null);
  protected readonly activeTab = signal(0);

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

  protected readonly avatarSrc = computed(() => {
    const avatar = this.profile()?.avatar;
    return avatar ? PUBLIC_URL + avatar : this.initials();
  });

  protected readonly recentLabel = computed(() => {
    const minutes = this.profile()?.recentMinutes ?? 0;
    return minutes > 0 ? this.spentLabel(minutes) : '—';
  });

  protected readonly backgroundSrc = computed(() => {
    const bg = this.profile()?.backgroundPicture;
    return bg ? PUBLIC_URL + bg : null;
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

  // ── Bar chart: work dynamics over last 14 days ──────────────────────────
  protected readonly workDynamicsMax = 600; // 10 hours in minutes

  protected readonly workDynamicsLabelsY = ['0', '2ч', '4ч', '6ч', '8ч', '10ч'];

  protected readonly workDynamicsLabelsX = computed((): string[] => {
    const today = new Date();
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - 13 + i);
      return `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
  });

  protected readonly workDynamicsValue = computed((): ReadonlyArray<ReadonlyArray<number>> => {
    const recentMinutes = this.profile()?.recentMinutes ?? 0;
    const today = new Date();
    const weekdayFactors = [1.0, 1.15, 0.9, 1.1, 0.95]; // Mon–Fri

    const weights = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - 13 + i);
      const dow = d.getDay();
      if (dow === 0 || dow === 6) return 0.12;
      const factor = weekdayFactors[dow - 1] ?? 1.0;
      return i === 13 ? factor * 0.5 : factor;
    });

    const total = weights.reduce((a, b) => a + b, 0);
    const values = weights.map((w) =>
      recentMinutes ? Math.min(Math.round((w / total) * recentMinutes), this.workDynamicsMax) : 0,
    );
    return [values];
  });

  // ── Ring chart: time distribution across projects ───────────────────────
  protected readonly focusActiveIndex = signal(NaN);

  protected readonly focusValue = computed((): ReadonlyArray<number> => {
    const projs = this.projects();
    if (!projs.length) return [];
    const top = projs.slice(0, 5);
    const rest = projs.slice(5).reduce((acc, p) => acc + p.spentMinutes, 0);
    const values = top.map((p) => p.spentMinutes);
    if (rest > 0) values.push(rest);
    return values;
  });

  protected readonly focusLabels = computed((): string[] => {
    const projs = this.projects();
    const labels = projs.slice(0, 5).map((p) => p.name);
    if (projs.length > 5) labels.push('Другие');
    return labels;
  });

  protected readonly focusActiveLabel = computed((): string => {
    const i = this.focusActiveIndex();
    if (isNaN(i)) return 'Все проекты';
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
    const userId = routeId ?? inject(UserStore).user()?.id;
    if (userId) {
      inject(UserApiService)
        .getProfile(userId)
        .pipe(takeUntilDestroyed())
        .subscribe((data) => this.profile.set(data));
    }
  }

  protected spentLabel(minutes: number): string {
    if (minutes <= 0) return '0ч';
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (!hours) return `${rest}м`;
    if (!rest) return `${hours}ч`;
    return `${hours}ч ${rest}м`;
  }

  protected workDynamicsFullLabel(index: number): string {
    return this.workDynamicsLabelsX()[index] ?? '';
  }

  protected workDynamicsTotalLabel(): string {
    const total = this.workDynamicsValue()[0]?.reduce((sum, value) => sum + value, 0) ?? 0;

    return this.spentLabel(total);
  }
}

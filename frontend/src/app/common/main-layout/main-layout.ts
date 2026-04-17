import { Component, computed, inject, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { NavbarComponent } from './navbar/navbar';
import { TuiNavigation } from '@taiga-ui/layout';
import { TuiTabs, TuiChevron } from '@taiga-ui/kit';
import { TranslatePipe } from '@ngx-translate/core';
import { TuiDropdown, TuiDataList } from '@taiga-ui/core';
import { TeamStore } from '../../features/team/store/team.store';
import { ProjectStore } from '../../features/project/store/project.store';
import { UserStore } from '../../features/user/store/user.store';
import { StoreStatus } from '../../core/declarations/types/store-statuses.type';
import { TuiItem } from '@taiga-ui/cdk/directives/item';

const ADMIN_ROUTES = ['/admin/users', '/admin/teams', '/admin/projects', '/admin/settings'];
const MAIN_ROUTES = ['/main/activity'];

@Component({
  selector: 'app-main-layout',
  imports: [
    RouterOutlet,
    NavbarComponent,
    TuiNavigation,
    TuiTabs,
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
    TuiDropdown,
    TuiDataList,
    TuiChevron,
    TuiItem,
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayoutComponent implements OnInit {
  protected readonly router = inject(Router);
  protected readonly teamStore = inject(TeamStore);
  protected readonly projectStore = inject(ProjectStore);
  protected readonly userStore = inject(UserStore);
  protected teamsOpen = false;
  protected projectsOpen = false;

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  protected readonly activeItemIndex = computed(() => {
    const url = this.currentUrl();
    const adminIdx = ADMIN_ROUTES.findIndex((r) => url.startsWith(r));
    if (adminIdx !== -1) return adminIdx;
    const mainIdx = MAIN_ROUTES.findIndex((r) => url.startsWith(r));
    return mainIdx !== -1 ? mainIdx : 0;
  });

  ngOnInit(): void {
    if (this.teamStore.status() !== StoreStatus.Loaded) {
      this.teamStore.loadTeams();
    }
    if (this.projectStore.status() !== StoreStatus.Loaded) {
      this.projectStore.loadProjects();
    }
  }

  protected isMainSection(): boolean {
    const url = this.currentUrl();
    return url.startsWith('/main') || url.startsWith('/teams') || url.startsWith('/projects');
  }

  protected isAdminSection(): boolean {
    return this.currentUrl().startsWith('/admin');
  }

  protected navigateToTeam(id: number): void {
    this.router.navigate(['/teams', id]);
  }

  protected navigateToProject(id: number): void {
    this.router.navigate(['/projects', id]);
  }

  protected stop(event: Event): void {
    event.stopPropagation();
  }
}

import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './navbar/navbar';
import { TuiNavigation } from '@taiga-ui/layout';
import { TuiTabs, TuiChevron } from '@taiga-ui/kit';
import { TuiAnimated } from '@taiga-ui/cdk/directives/animated';
import { TranslatePipe } from '@ngx-translate/core';
import { TuiDropdown, TuiDataList } from '@taiga-ui/core';
import { TeamStore } from '../../features/team/store/team.store';
import { ProjectStore } from '../../features/project/store/project.store';
import { StoreStatus } from '../../core/declarations/types/store-statuses.type';

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
    TuiAnimated,
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayoutComponent implements OnInit {
  protected readonly router = inject(Router);
  protected readonly teamStore = inject(TeamStore);
  protected readonly projectStore = inject(ProjectStore);
  protected activeItemIndex = 0;
  protected teamsOpen = false;
  protected projectsOpen = false;

  ngOnInit(): void {
    if (this.teamStore.status() !== StoreStatus.Loaded) {
      this.teamStore.loadTeams();
    }
    if (this.projectStore.status() !== StoreStatus.Loaded) {
      this.projectStore.loadProjects();
    }
  }

  protected isMainSection(): boolean {
    const url = this.router.url;
    return url.startsWith('/main') || url.startsWith('/teams') || url.startsWith('/projects');
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

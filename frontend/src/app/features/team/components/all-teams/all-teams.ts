import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TeamStore } from '../../store/team.store';
import { Team } from '../../types/model/team.model';
import { avatarColor, avatarLetters } from '../../../../common/avatar/avatar-color.util';
import { TEAMSCARDSIMPORT } from './all-teams.imports';

@Component({
  selector: 'app-all-teams',
  imports: [TEAMSCARDSIMPORT],
  templateUrl: './all-teams.html',
  styleUrl: './all-teams.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AllTeamsComponent {
  protected readonly store = inject(TeamStore);

  protected cardBackground(team: Team): string {
    if (team.pictureName) {
      return `url(/apipublic/project-picture?filename=${team.pictureName})`;
    }
    return '';
  }

  protected cardColor(team: Team): string {
    if (team.pictureName) return 'transparent';
    return avatarColor(avatarLetters(team.name, ''));
  }

  ngOnInit(): void {
    this.store.loadTeams();
  }
}

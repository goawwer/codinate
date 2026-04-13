import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { PROJECTSCARDSIMPORT } from './all-projects.imports';
import { ProjectStore } from '../../store/project.store';
import { Project } from '../../types/model/project.model';
import { avatarColor, avatarLetters } from '../../../../common/avatar/avatar-color.util';

@Component({
  selector: 'app-all-projects',
  imports: [PROJECTSCARDSIMPORT],
  templateUrl: './all-projects.html',
  styleUrl: './all-projects.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AllProjectsComponent implements OnInit {
  protected readonly store = inject(ProjectStore);

  protected cardBackground(project: Project): string {
    if (project.projectPictureName) {
      return `url(/apipublic/project-picture?filename=${project.projectPictureName})`;
    }
    return '';
  }

  protected cardColor(project: Project): string {
    if (project.projectPictureName) return 'transparent';
    return avatarColor(avatarLetters(project.projectName, ''));
  }

  ngOnInit(): void {
    this.store.loadProjects();
  }
}

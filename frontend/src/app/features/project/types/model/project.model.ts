export interface ProjectMember {
  id: string;
  name: string;
  surname: string;
  role: string;
}

export interface ProjectLink {
  title: string;
  url: string;
}

export interface Project {
  id: number;
  authorName: string;
  authorSurname: string;
  projectName: string;
  projectDescription: string;
  projectPictureName: string;
  links: ProjectLink[];
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  members: ProjectMember[];
}

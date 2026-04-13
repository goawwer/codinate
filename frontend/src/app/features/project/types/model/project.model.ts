export interface ProjectMember {
  name: string;
  surname: string;
  userId?: string;
}

export interface Project {
  id: number;
  authorName: string;
  authorSurname: string;
  projectName: string;
  projectDescription: string;
  projectPictureName: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  members: ProjectMember[];
}

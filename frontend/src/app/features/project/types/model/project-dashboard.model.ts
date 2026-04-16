export interface CreateProjectInput {
  projectName: string;
  projectDescription: string;
  projectPictureName: string;
  memberIds?: string[];
}

export interface UpdateProjectInput {
  projectName?: string;
  projectDescription?: string;
  projectPictureName?: string;
}

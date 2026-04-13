export interface CreateProjectInput {
  projectName: string;
  projectDescription: string;
  projectPictureName: string;
}

export interface UpdateProjectInput {
  projectName?: string;
  projectDescription?: string;
  projectPictureName?: string;
}

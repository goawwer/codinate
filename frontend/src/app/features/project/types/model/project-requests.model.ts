export interface CreateProjectInput {
  authorId: string;
  projectName: string;
  projectDescription: string;
  projectPictureName: string;
  memberIds?: string[];
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  pictureName?: string;
}

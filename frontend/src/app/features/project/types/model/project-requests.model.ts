export interface CreateProjectInput {
  authorId: string;
  projectName: string;
  projectDescription: string;
  projectAbout: string;
  projectPictureName: string;
  memberIds?: string[];
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  about?: string;
  pictureName?: string;
}

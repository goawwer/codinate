export interface CreateTeamInput {
  name: string;
  description: string;
  pictureName: string;
  memberIds?: string[];
}

export interface UpdateTeamInput {
  name?: string;
  description?: string;
  pictureName?: string;
}

export interface CreateTeamInput {
  name: string;
  description: string;
  pictureName: string;
}

export interface UpdateTeamInput {
  name?: string;
  description?: string;
  pictureName?: string;
}

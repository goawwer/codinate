export interface TeamMember {
  name: string;
  surname: string;
  userId?: string;
}

export interface Team {
  id: number;
  authorId: string;
  name: string;
  description: string;
  pictureName: string;
  createdAt: string;
  updatedAt: string;
  members: TeamMember[];
}

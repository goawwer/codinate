export interface TeamMember {
  id: string;
  name: string;
  surname: string;
  picture?: string;
}

export interface TeamLink {
  title: string;
  url: string;
}

export interface Team {
  id: number;
  authorId: string;
  name: string;
  description: string;
  pictureName: string;
  links: TeamLink[];
  createdAt: string;
  updatedAt: string;
  members: TeamMember[];
}

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  surname: string;
  description?: string | null;
  avatar?: string | null;
  backgroundPicture?: string | null;
  role?: string | null;
  recentMinutes: number;
  projects: UserProfileProject[];
}

export interface UserProfileProject {
  id: number;
  name: string;
  picture?: string;
  spentMinutes: number;
  recentMinutes: number;
  tasks: UserProfileTaskRef[];
}

export interface UserProfileTaskRef {
  id: string;
  identifier: number;
  title: string;
}

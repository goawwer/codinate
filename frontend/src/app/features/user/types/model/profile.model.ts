export interface UserProfile {
  id: string;
  username: string;
  name: string;
  surname: string;
  createdAt: string;
  about?: string | null;
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
  about?: string;
  spentMinutes: number;
  recentMinutes: number;
  tasks: UserProfileTaskRef[];
}

export interface UserProfileTaskRef {
  id: string;
  identifier: number;
  title: string;
}

export interface UpdateProfileInput {
  username?: string;
  about?: string | null;
}

export interface UserProfileStats {
  workDynamics: DailyWorkStat[];
  projectFocus: ProjectFocusStat[];
}

export interface DailyWorkStat {
  date: string;
  spentMinutes: number;
}

export interface ProjectFocusStat {
  projectId: number;
  projectName: string;
  spentMinutes: number;
}

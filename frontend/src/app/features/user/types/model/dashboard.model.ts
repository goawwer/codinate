export interface CreateUserInput {
  name: string;
  surname: string;
  email: string;
  username: string;
  password: string;
  roleId: number;
  permission: string;
}

export interface UpdateUserInput {
  name?: string;
  surname?: string;
  email?: string;
  password?: string;
  roleId?: number;
  username?: string;
  profilePicture?: string;
  permission?: string;
  disabled?: boolean;
}

export interface UserFilters {
  disabled?: boolean;
}

import { ValueOf } from '../../../../core/declarations/types/value-of.type';
import { EnumPermissionRole } from '../enum/role.enum';

export interface User {
  id: string;
  name: string;
  surname: string;
  username: string;
  password: string;
  email: string;
  role: string;
  permission: ValueOf<typeof EnumPermissionRole>;
  picture: string;
  disabled: boolean;
  createdAt: string;
  updatedAt: string;
}

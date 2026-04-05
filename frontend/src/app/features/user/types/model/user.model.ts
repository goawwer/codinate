import { ValueOf } from '../../../../core/declarations/types/value-of.type';
import { EnumUserRole } from '../enum/role.enum';

export interface User {
  id: string;
  name: string;
  surname: string;
  username: string;
  email: string;
  role: ValueOf<typeof EnumUserRole>;
  profilePicture: string;
  disabled: boolean;
  createdAt: string;
}

import { UserRole } from '../enums/user-role.enum';

export interface CurrentUserPayload {
  id: string;
  email: string;
  role: UserRole;
}

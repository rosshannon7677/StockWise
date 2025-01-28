export type UserRole = 'admin' | 'manager' | 'employee';

export interface UserRoleData {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
}
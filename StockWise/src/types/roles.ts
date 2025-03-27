export type UserRole = 'admin' | 'manager' | 'employee';
export type UserStatus = 'pending' | 'active' | 'inactive';

export interface UserRoleData {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  metadata: {
    createdAt: string;
    lastUpdated: string;
    approvedBy?: string;
    approvedAt?: string;
  };
}
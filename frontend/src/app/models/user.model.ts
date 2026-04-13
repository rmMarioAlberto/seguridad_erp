export type Permission = 'user:crud' | 'group:add' | 'group:edit' | 'group:delete' | 'ticket:create' | 'ticket:edit_all' | 'ticket:delete' | 'profile:view';

export interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: string;
  permissions: Record<Permission, boolean>;
  groups: string[];
  phone?: string;
  address?: string;
  dob?: string;
}

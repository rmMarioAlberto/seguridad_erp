import { Injectable, signal } from '@angular/core';
import { User, Permission } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthPermissionService {
  private readonly _currentUser = signal<User | null>(null);
  readonly currentUser = this._currentUser.asReadonly();

  private readonly _users = signal<User[]>([
    { id: '1', fullName: 'Super Admin', username: 'superadmin', email: 'admin@admin.com', role: 'SuperAdmin', permissions: { 'user:crud': true, 'group:add': true, 'group:edit': true, 'group:delete': true, 'ticket:create': true, 'ticket:edit_all': true, 'ticket:delete': true, 'profile:view': true }, groups: ['Frontend', 'Backend'] },
    { id: '2', fullName: 'Mario Alberto', username: 'mario', email: 'mario@example.com', role: 'Group Manager', permissions: { 'group:add': true, 'group:edit': true, 'ticket:create': true, 'profile:view': true } as any, groups: ['Frontend'] },
    { id: '3', fullName: 'Juan Pérez', username: 'juan', email: 'juan@example.com', role: 'Support', permissions: { 'ticket:create': true, 'profile:view': true } as any, groups: ['Backend'] },
    { id: '4', fullName: 'Invitado Sin Permisos', username: 'invitado', email: 'invitado@example.com', role: 'Viewer', permissions: {} as any, groups: ['Frontend'] }
  ]);
  readonly users = this._users.asReadonly();

  constructor() {
    // No longer auto-login to allow testing individual logins
  }

  login(email: string, password: string): boolean {
    // Generic password for all users for easy testing
    const GENERIC_PASSWORD = '1'; 
    
    if (password !== GENERIC_PASSWORD && email !== 'admin@admin.com') {
      // Special case for the original admin if we want to keep it
      if (email === 'admin@admin.com' && password === 'Admin123!') {
        const admin = this._users().find(u => u.email === email);
        if (admin) {
          this._currentUser.set(admin);
          return true;
        }
      }
      return false;
    }

    const user = this._users().find(u => u.email === email);
    if (user) {
      this._currentUser.set(user);
      return true;
    }
    return false;
  }

  // Helper to update users (used by management)
  updateUsers(users: User[]) {
    this._users.set(users);
  }

  hasPermission(permission: Permission): boolean {
    const user = this.currentUser();
    if (!user) return false;
    if (user.role === 'SuperAdmin') return true;
    return !!user.permissions[permission];
  }

  canEditTicket(ticketCreatorId: string, ticketAsigneeId: string): boolean {
    const user = this.currentUser();
    if (!user) return false;
    if (this.hasPermission('ticket:edit_all')) return true;
    // Creator can edit, assignee might have limited edit (handled in UI)
    return user.id === ticketCreatorId;
  }

  logout() {
    this._currentUser.set(null);
  }
}

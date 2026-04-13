import { Injectable, signal, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, of, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserInfo {
  id: number;
  nombre_completo: string;
  username: string;
  email: string;
  telefono?: string;
  direccion?: string;
}

export interface AuthResponse {
  statusCode: number;
  intOpCode: string;
  data: {
    access_token: string;
    user: UserInfo;
    groups: { id: number; nombre: string }[];
    permisos_por_grupo: Record<string, string[]>;
    permisos_globales_nombres: string[];
  }
}

@Injectable({
  providedIn: 'root'
})
export class AuthPermissionService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  
  private readonly _currentUser = signal<UserInfo | null>(null);
  readonly currentUser = this._currentUser.asReadonly();
  
  private readonly _groups = signal<{ id: number; nombre: string }[]>([]);
  readonly groups = this._groups.asReadonly();
  
  private readonly _permisosPorGrupo = signal<Record<string, string[]>>({});
  private readonly _globalPermissions = signal<string[]>([]);
  private readonly _selectedGroupId = signal<number | null>(null);
  
  readonly selectedGroupId = this._selectedGroupId.asReadonly();
  
  // Permisos efectivos para el grupo actual (mezclados con globales)
  readonly currentPermissions = computed(() => {
    const groupId = this._selectedGroupId();
    const globals = this._globalPermissions();
    const groupPerms = groupId === null ? [] : (this._permisosPorGrupo()[groupId.toString()] || []);
    
    // Unir ambos sin duplicados
    return Array.from(new Set([...globals, ...groupPerms]));
  });

  // Indica si el usuario tiene algún permiso que justifique ver la página de grupos
  readonly canManageOrViewGroups = computed(() => {
    // Permisos globales que permiten ver grupos
    if (this.hasGlobalPermission('groups:view') || 
        this.hasGlobalPermission('groups:manage-members') ||
        this.hasGlobalPermission('tickets:view')) {
      return true;
    }

    // O si tiene permisos específicos en ALGÚN grupo
    const permsByGroup = this._permisosPorGrupo();
    return Object.values(permsByGroup).some(perms => 
      perms.includes('tickets:view') || 
      perms.includes('tickets:manage') ||
      perms.includes('groups:view')
    );
  });

  constructor() {
    this.loadSession();
  }

  private loadSession() {
    const token = localStorage.getItem('jwt_token');
    const userStr = localStorage.getItem('user_info');
    const permsStr = localStorage.getItem('perms_info');
    const globalsStr = localStorage.getItem('globals_info');
    const groupsStr = localStorage.getItem('groups_info');
    const lastGroup = localStorage.getItem('last_group_id');

    if (token && userStr && permsStr && groupsStr) {
      try {
        this._currentUser.set(JSON.parse(userStr));
        this._permisosPorGrupo.set(JSON.parse(permsStr));
        this._globalPermissions.set(globalsStr ? JSON.parse(globalsStr) : []);
        this._groups.set(JSON.parse(groupsStr));
        if (lastGroup) {
          this._selectedGroupId.set(Number(lastGroup));
        }
      } catch (e) {
        console.error('Session parse error:', e);
        this.logout();
      }
    }
  }

  login(username: string, password: string): Observable<boolean> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, { username, password }).pipe(
      map(res => {
        if (res.statusCode === 200 && res.data) {
          this.setSession(res.data);
          return true;
        }
        return false;
      }),
      catchError(() => of(false))
    );
  }

  register(userData: any): Observable<boolean> {
    return this.http.post<any>(`${environment.apiUrl}/auth/register`, userData).pipe(
      map(res => {
        return res.statusCode === 201 || res.status === 201;
      }),
      catchError(() => of(false))
    );
  }

  private setSession(data: AuthResponse['data']) {
    localStorage.setItem('jwt_token', data.access_token);
    localStorage.setItem('user_info', JSON.stringify(data.user));
    localStorage.setItem('perms_info', JSON.stringify(data.permisos_por_grupo));
    localStorage.setItem('globals_info', JSON.stringify(data.permisos_globales_nombres));
    localStorage.setItem('groups_info', JSON.stringify(data.groups));
    
    this._currentUser.set(data.user);
    this._permisosPorGrupo.set(data.permisos_por_grupo);
    this._globalPermissions.set(data.permisos_globales_nombres);
    this._groups.set(data.groups);
    
    if (data.groups.length > 0) {
      this.setSelectedGroup(data.groups[0].id);
    }
  }

  setSelectedGroup(groupId: number | null) {
    this._selectedGroupId.set(groupId);
    if (groupId === null) {
      localStorage.removeItem('last_group_id');
    } else {
      localStorage.setItem('last_group_id', groupId.toString());
    }
  }

  hasPermission(permissionName: string): boolean {
    const groupId = this._selectedGroupId();
    const groupPerms = groupId === null ? [] : (this._permisosPorGrupo()[groupId.toString()] || []);
    
    // Check local group perms OR global perms (with prefix)
    return groupPerms.includes(permissionName) || this.hasGlobalPermission(permissionName);
  }

  hasGlobalPermission(permissionName: string): boolean {
    const globalPerms = this._globalPermissions();
    // Soporta tanto el nuevo formato con prefijo como el antiguo simple
    return globalPerms.includes(`global:${permissionName}`) || 
           globalPerms.includes(permissionName);
  }

  hasPermissionForGroup(permissionName: string, groupId: number | null): boolean {
    if (groupId === null) return this.hasGlobalPermission(permissionName);
    
    // Check if user has global permission
    if (this.hasGlobalPermission(permissionName)) return true;
    
    // Check if user has group permission
    const groupPerms = this._permisosPorGrupo()[groupId.toString()] || [];
    return groupPerms.includes(permissionName);
  }

  updateCurrentUser(userData: Partial<UserInfo>) {
    const current = this._currentUser();
    if (!current) return;

    const updated = { ...current, ...userData };
    this._currentUser.set(updated);
    localStorage.setItem('user_info', JSON.stringify(updated));
  }

  logout() {
    localStorage.clear();
    this._currentUser.set(null);
    this._permisosPorGrupo.set({});
    this._selectedGroupId.set(null);
    this.router.navigate(['/login']);
  }
}

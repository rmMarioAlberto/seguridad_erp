import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserResponse {
  id: number;
  nombre_completo: string;
  username: string;
  email: string;
  telefono?: string;
  direccion?: string;
  fecha_inicio?: string;
  permisos_globales: number[];
}

export interface GlobalPermission {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface ApiResponse<T> {
  statusCode: number;
  intOpCode: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class UserManagementService {
  private readonly http = inject(HttpClient);
  
  private readonly _users = signal<UserResponse[]>([]);
  readonly users = this._users.asReadonly();

  loadUsers(): Observable<UserResponse[]> {
    return this.http.get<ApiResponse<UserResponse[]>>(`${environment.apiUrl}/users`).pipe(
      map(res => res.data),
      tap(users => this._users.set(users))
    );
  }

  getUser(id: number): Observable<UserResponse> {
    return this.http.get<ApiResponse<UserResponse>>(`${environment.apiUrl}/users/${id}`).pipe(
      map(res => res.data)
    );
  }

  loadPermissionsCatalog(): Observable<GlobalPermission[]> {
    return this.http.get<ApiResponse<GlobalPermission[]>>(`${environment.apiUrl}/users/permissions/catalog?scope=GLOBAL`).pipe(
      map(res => res.data)
    );
  }

  createUser(userData: any): Observable<UserResponse> {
    return this.http.post<ApiResponse<UserResponse>>(`${environment.apiUrl}/users`, userData).pipe(
      map(res => res.data),
      tap(newUser => this._users.update(us => [...us, newUser]))
    );
  }

  updateUser(id: number, userData: any): Observable<UserResponse> {
    return this.http.patch<ApiResponse<UserResponse>>(`${environment.apiUrl}/users/${id}`, userData).pipe(
      map(res => res.data),
      tap(updated => this._users.update(us => us.map(u => u.id === id ? updated : u)))
    );
  }

  // Si el backend no tiene delete, lo simulamos o dejamos el bridge
  deleteUser(id: number): Observable<boolean> {
    return this.http.delete<ApiResponse<null>>(`${environment.apiUrl}/users/${id}`).pipe(
      map(res => res.statusCode === 200),
      tap(success => {
          if (success) {
            this._users.update(us => us.filter(u => u.id !== id));
          }
      })
    );
  }
}

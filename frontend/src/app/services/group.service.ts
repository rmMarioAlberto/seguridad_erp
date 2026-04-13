import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap, switchMap, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { Group, GroupMember } from '../models/group.model';
import { RefetchService } from './refetch.service';

export interface ApiResponse<T> {
  statusCode: number;
  intOpCode: string;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class GroupService {
  private readonly http = inject(HttpClient);
  private readonly refetchService = inject(RefetchService);
  
  private readonly _groups = signal<Group[]>([]);
  readonly groups = this._groups.asReadonly();

  private readonly _groupMembers = signal<Record<number, GroupMember[]>>({});
  readonly groupMembers = this._groupMembers.asReadonly();

  getGroupPermissionsCatalog(): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(`${environment.apiUrl}/users/permissions/catalog?scope=GROUP`).pipe(
      map(res => res.data)
    );
  }

  loadGroups(): Observable<Group[]> {
    return this.http.get<ApiResponse<any[]>>(`${environment.apiUrl}/groups`).pipe(
      map(res => res.data.map(g => this.mapGroup(g))),
      tap(groups => this._groups.set(groups))
    );
  }

  getGroupDetails(id: number): Observable<Group> {
    return this.http.get<ApiResponse<any>>(`${environment.apiUrl}/groups/${id}`).pipe(
      map(res => {
        const group = this.mapGroup(res.data);
        group.miembros = (res.data.miembros || []).map((m: any) => ({
          id: m.usuario.id,
          nombre_completo: m.usuario.nombre_completo,
          username: m.usuario.username,
          email: m.usuario.email,
          permisos: []
        } as GroupMember));
        return group;
      }),
      switchMap((group: Group) => {
        // Obtenemos los permisos y los mapeamos a los miembros
        return this.http.get<ApiResponse<any[]>>(`${environment.apiUrl}/groups/${id}/permissions`).pipe(
          map((permRes: any) => {
             const permissionsData = permRes.data || permRes; // Support direct array or wrapped
             if (Array.isArray(permissionsData)) {
                 const permMap = new Map<number, string[]>();
                 permissionsData.forEach((pInfo: any) => {
                     if (pInfo.usuario && pInfo.permisos) {
                         permMap.set(pInfo.usuario.id, pInfo.permisos);
                     }
                 });
                 group.miembros?.forEach((m: GroupMember) => {
                     m.permisos = permMap.get(m.id) || [];
                 });
             }
             return group;
          }),
          // Catch any errors getting permissions so it doesn't break fetching the group
          catchError((err) => {
            console.warn('Could not load group permissions, proceeding with member names only.', err);
            return of(group);
          })
        );
      }),
      tap(group => {
        if (group.id && group.miembros) {
          this._groupMembers.update(current => ({
            ...current,
            [group.id!]: group.miembros!
          }));
        }
      })
    );
  }

  getMembersForGroup(groupId: number): GroupMember[] {
    return this._groupMembers()[groupId] || [];
  }

  addMember(groupId: number, userId: number): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}/groups/${groupId}/members`, {
      usuario_id: userId
    }).pipe(
      tap(() => {
        this.getGroupDetails(groupId).subscribe();
        this.refetchService.requestRefetch();
      })
    );
  }

  removeMember(groupId: number, userId: number): Observable<any> {
    return this.http.delete<ApiResponse<any>>(`${environment.apiUrl}/groups/${groupId}/members/${userId}`).pipe(
      tap(() => {
        this._groupMembers.update(current => ({
          ...current,
          [groupId]: (current[groupId] || []).filter(m => m.id !== userId)
        }));
        this.refetchService.requestRefetch();
      })
    );
  }

  updateMemberPermissions(groupId: number, userId: number, permisos: string[]): Observable<any> {
    return this.http.put<ApiResponse<any>>(`${environment.apiUrl}/groups/${groupId}/users/${userId}/permissions`, {
      permisos
    }).pipe(
      tap(() => {
        this._groupMembers.update(current => {
          const members = current[groupId] || [];
          const updatedMembers = members.map(m => m.id === userId ? { ...m, permisos } : m);
          return { ...current, [groupId]: updatedMembers };
        });
        this.refetchService.requestRefetch();
      })
    );
  }

  private mapGroup(g: any): Group {
    return {
      id: g.id,
      nombre: g.nombre,
      descripcion: g.descripcion,
      nivel: g.nivel || 'Media',
      autor: g.creador?.nombre_completo || 'Desconocido',
      creador_id: g.creador_id,
      integrantes: g._count?.miembros || 0,
      tickets: g._count?.tickets || 0
    };
  }

  addGroup(groupData: any): Observable<Group> {
    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}/groups`, groupData).pipe(
      map(res => this.mapGroup(res.data)),
      tap(newGroup => {
        this._groups.update(gs => [...gs, newGroup]);
        this.refetchService.requestRefetch();
      })
    );
  }

  updateGroup(id: number, groupData: any): Observable<Group> {
    return this.http.put<ApiResponse<any>>(`${environment.apiUrl}/groups/${id}`, groupData).pipe(
      map(res => this.mapGroup(res.data)),
      tap(updated => {
        this._groups.update(gs => gs.map(g => g.id === id ? updated : g));
        this.refetchService.requestRefetch();
      })
    );
  }

  deleteGroup(id: number): Observable<boolean> {
    return this.http.delete<ApiResponse<null>>(`${environment.apiUrl}/groups/${id}`).pipe(
      map(res => res.statusCode === 200),
      tap(success => {
        if (success) {
          this._groups.update(gs => gs.filter(g => g.id !== id));
          this.refetchService.requestRefetch();
        }
      })
    );
  }
}

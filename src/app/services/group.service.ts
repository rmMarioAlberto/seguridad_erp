import { Injectable } from '@angular/core';
import { Group } from '../models/group.model';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GroupService {
  private groups: Group[] = [
    {
      id: 1,
      nivel: 'Básico',
      autor: 'Admin',
      nombre: 'Grupo Alfa',
      integrantes: 5,
      tickets: 10,
      descripcion: 'Grupo inicial de prueba',
    },
    {
      id: 2,
      nivel: 'Avanzado',
      autor: 'User1',
      nombre: 'Grupo Beta',
      integrantes: 8,
      tickets: 25,
      descripcion: 'Grupo avanzado para tareas críticas',
    },
  ];

  private readonly groupsSubject = new BehaviorSubject<Group[]>(this.groups);

  getGroups(): Observable<Group[]> {
    return this.groupsSubject.asObservable();
  }

  addGroup(group: Group): void {
    group.id = this.groups.length > 0 ? Math.max(...this.groups.map((g) => g.id || 0)) + 1 : 1;
    this.groups.push(group);
    this.groupsSubject.next([...this.groups]);
  }

  updateGroup(updatedGroup: Group): void {
    const index = this.groups.findIndex((g) => g.id === updatedGroup.id);
    if (index !== -1) {
      this.groups[index] = updatedGroup;
      this.groupsSubject.next([...this.groups]);
    }
  }

  deleteGroup(id: number): void {
    this.groups = this.groups.filter((g) => g.id !== id);
    this.groupsSubject.next([...this.groups]);
  }
}

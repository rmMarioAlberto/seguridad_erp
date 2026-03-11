import { Injectable, signal } from '@angular/core';
import { Group } from '../models/group.model';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GroupService {
  private readonly _groups = signal<Group[]>([
    {
      id: 1,
      nivel: 'Alta',
      autor: 'Mario Alberto',
      nombre: 'Frontend',
      integrantes: 3,
      tickets: 4,
      descripcion: 'Desarrollo de la interfaz de usuario con Angular y PrimeNG',
    },
    {
      id: 2,
      nivel: 'Media',
      autor: 'Juan Pérez',
      nombre: 'Backend',
      integrantes: 2,
      tickets: 4,
      descripcion: 'API REST y servicios de servidor con Node.js',
    },
  ]);

  readonly groups = this._groups.asReadonly();

  getGroups(): Observable<Group[]> {
    // Keep for potential legacy use, but components should use signals
    return of(this._groups());
  }

  addGroup(group: Group): void {
    group.id = this._groups().length > 0 ? Math.max(...this._groups().map((g) => g.id || 0)) + 1 : 1;
    this._groups.update(g => [...g, group]);
  }

  updateGroup(updatedGroup: Group): void {
    this._groups.update(groups => 
      groups.map((g) => (g.id === updatedGroup.id ? updatedGroup : g))
    );
  }

  deleteGroup(id: number): void {
    this._groups.update(groups => groups.filter((g) => g.id !== id));
  }
}

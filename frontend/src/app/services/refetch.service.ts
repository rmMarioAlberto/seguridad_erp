import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RefetchService {
  private readonly _refetch = new Subject<void>();
  
  /**
   * Observable que emite cada vez que se solicita un refresco global.
   * Los componentes deben suscribirse a este observable para recargar sus datos.
   */
  readonly refetch$ = this._refetch.asObservable();

  /**
   * Solicita un refresco global de datos en toda la aplicación.
   * Úselo después de mutaciones exitosas (POST, PUT, DELETE).
   */
  requestRefetch() {
    console.log('[RefetchService] Global refresh requested');
    this._refetch.next();
  }
}

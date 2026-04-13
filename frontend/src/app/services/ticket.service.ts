import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Ticket, TicketStatus } from '../models/ticket.model';
import { RefetchService } from './refetch.service';

export interface ApiResponse<T> {
  statusCode: number;
  intOpCode: string;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class TicketService {
  private readonly http = inject(HttpClient);
  private readonly refetchService = inject(RefetchService);
  
  private readonly _tickets = signal<Ticket[]>([]);
  readonly tickets = this._tickets.asReadonly();

  private readonly _statuses = signal<any[]>([]);
  readonly statuses = this._statuses.asReadonly();

  // Mapeo de backend a frontend model
  private mapTicket(t: any): Ticket {
    // Fallback logic for status and priority if the backend sends partial data
    let ticketEstado = t.estado?.nombre;
    if (!ticketEstado && t.estado_id) {
        const matchingStatus = this._statuses().find(s => s.id === t.estado_id);
        if (matchingStatus) ticketEstado = matchingStatus.nombre;
    }

    let ticketPrioridad = t.prioridad?.nombre;
    if (!ticketPrioridad && t.prioridad_id) {
        // We don't have a priorities signal yet, but we can at least avoid undefined
        // You might want to add a _priorities signal later if needed
    }

    return {
      id: t.id,
      titulo: t.titulo,
      descripcion: t.descripcion,
      estado: (ticketEstado || 'Abierto') as TicketStatus,
      prioridad: ticketPrioridad || 'Media',
      asignadoA: t.asignado?.nombre_completo || 'Sin asignar',
      asignadoAId: t.asignado_id || undefined,
      fechaCreacion: new Date(t.creado_en),
      fechaLimite: t.fecha_final ? new Date(t.fecha_final) : undefined,
      grupo: t.grupo?.nombre || 'Sin grupo',
      grupoId: t.grupo_id,
      creadorId: String(t.autor_id),
      creadorNombre: t.autor?.nombre_completo,
      comentarios: t.comentarios?.map((c: any) => ({
        autor: c.autor?.nombre_completo,
        texto: c.contenido,
        fecha: new Date(c.creado_en)
      })),
      historialCambios: t.historial?.map((h: any) => ({
        fecha: new Date(h.creado_en),
        usuario: h.usuario?.nombre_completo || `Usuario #${h.usuario_id}`,
        cambio: h.accion
      }))
    };
  }

  loadTickets(groupId?: number): Observable<Ticket[]> {
    const params: any = {};
    if (groupId) params.grupo_id = groupId;

    return this.http.get<ApiResponse<{ tickets: any[], total: number }>>(`${environment.apiUrl}/tickets`, { params }).pipe(
      map(res => res.data.tickets.map(t => this.mapTicket(t))),
      tap(tickets => this._tickets.set(tickets))
    );
  }

  loadStatuses(): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(`${environment.apiUrl}/estados`).pipe(
      map(res => res.data),
      tap(statuses => this._statuses.set(statuses))
    );
  }

  getTicketsByStatus(status: TicketStatus, groupName: string | null = null) {
    let result = this._tickets();
    if (groupName) result = result.filter(t => t.grupo === groupName);
    return result.filter((ticket) => ticket.estado === status);
  }

  addTicket(ticketData: any): Observable<Ticket> {
    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}/tickets`, ticketData).pipe(
      map(res => this.mapTicket(res.data)),
      tap(newTicket => {
        this._tickets.update(current => [newTicket, ...current]);
        this.refetchService.requestRefetch();
      })
    );
  }

  updateTicket(id: number, ticketData: any): Observable<Ticket> {
    return this.http.put<ApiResponse<any>>(`${environment.apiUrl}/tickets/${id}`, ticketData).pipe(
      map(res => this.mapTicket(res.data)),
      tap(updated => {
        this._tickets.update(current => 
          current.map(t => t.id === id ? updated : t)
        );
        this.refetchService.requestRefetch();
      })
    );
  }

  updateStatus(id: number, estado_id: number, usuario_id: number): Observable<Ticket> {
    return this.http.patch<ApiResponse<any>>(`${environment.apiUrl}/tickets/${id}/status`, {
      estado_id,
      usuario_id
    }).pipe(
      map(res => this.mapTicket(res.data)),
      tap(updated => {
        this._tickets.update(current => 
          current.map(t => t.id === id ? updated : t)
        );
        this.refetchService.requestRefetch();
      })
    );
  }

  deleteTicket(id: number): Observable<boolean> {
    return this.http.delete<ApiResponse<null>>(`${environment.apiUrl}/tickets/${id}`).pipe(
      map(res => res.statusCode === 200),
      tap(success => {
        if (success) {
          this._tickets.update(current => current.filter(t => t.id !== id));
          this.refetchService.requestRefetch();
        }
      })
    );
  }

  getTicketById(id: number): Observable<Ticket> {
    return this.http.get<ApiResponse<any>>(`${environment.apiUrl}/tickets/${id}`).pipe(
      map(res => this.mapTicket(res.data))
    );
  }

  addComment(ticketId: number, content: string, userId: number): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}/tickets/${ticketId}/comments`, {
      contenido: content,
      usuario_id: userId
    }).pipe(
      map(res => res.data),
      tap(() => this.refetchService.requestRefetch())
    );
  }
}

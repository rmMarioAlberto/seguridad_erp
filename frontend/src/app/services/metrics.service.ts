import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Log {
  id: number;
  servicio: string;
  endpoint: string;
  metodo: string;
  usuario_id?: number;
  ip?: string;
  status: number;
  duracion?: number;
  error?: string;
  creado_en: string;
}

export interface Metrica {
  endpoint: string;
  metodo: string;
  total_requests: number;
  tiempo_respuesta_avg: number;
  ultima_actualizacion: string;
}

export interface StatsSummary {
  statusCounts: { status: number; count: number }[];
  totalLogs: number;
  avgDuration: number;
}

export interface ApiResponse<T> {
  statusCode: number;
  intOpCode: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class MetricsService {
  private readonly http = inject(HttpClient);

  getLogs(page: number = 1, limit: number = 50, servicio?: string): Observable<Log[]> {
    let params = `?page=${page}&limit=${limit}`;
    if (servicio) params += `&servicio=${servicio}`;
    
    return this.http.get<ApiResponse<Log[]>>(`${environment.apiUrl}/internal/logs${params}`).pipe(
      map(res => res.data)
    );
  }

  getMetricas(): Observable<Metrica[]> {
    return this.http.get<ApiResponse<Metrica[]>>(`${environment.apiUrl}/internal/logs/metricas`).pipe(
      map(res => res.data)
    );
  }

  getSummary(): Observable<StatsSummary> {
    return this.http.get<ApiResponse<StatsSummary>>(`${environment.apiUrl}/internal/logs/summary`).pipe(
      map(res => res.data)
    );
  }
}

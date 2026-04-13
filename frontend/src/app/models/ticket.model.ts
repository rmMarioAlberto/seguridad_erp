export type TicketStatus = 'Abierto' | 'En Progreso' | 'En Revisión' | 'Cerrado';
export type TicketPriority = 'Muy Baja' | 'Baja' | 'Media' | 'Alta' | 'Muy Alta' | 'Urgente' | 'Crítica';

export interface TicketComment {
  autor: string;
  texto: string;
  fecha: Date;
}

export interface TicketHistory {
  fecha: Date;
  usuario: string;
  cambio: string;
}

export interface Ticket {
  id: number;
  titulo: string;
  descripcion: string;
  estado: TicketStatus;
  asignadoA: string;
  asignadoAId?: number;
  prioridad: TicketPriority;
  fechaCreacion: Date;
  fechaLimite?: Date;
  grupo: string; 
  grupoId?: number;
  creadorId: string;
  creadorNombre?: string;
  comentarios?: TicketComment[];
  historialCambios?: TicketHistory[];
}

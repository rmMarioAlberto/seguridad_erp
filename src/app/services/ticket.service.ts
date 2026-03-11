import { Injectable, signal } from '@angular/core';
import { Ticket, TicketStatus } from '../models/ticket.model';

@Injectable({
  providedIn: 'root',
})
export class TicketService {
  private readonly ticketsSignal = signal<Ticket[]>([
    {
      id: 1,
      titulo: 'Diseño de Dashboard',
      descripcion: 'Implementar las tarjetas de estadísticas con PrimeNG.',
      estado: 'Abierto',
      asignadoA: 'Super Admin',
      prioridad: 'Alta',
      fechaCreacion: new Date(),
      grupo: 'Frontend',
      creadorId: '1',
      comentarios: [],
      historialCambios: [{ fecha: new Date(), usuario: 'Sistema', cambio: 'Ticket Creado' }]
    },
    {
      id: 2,
      titulo: 'Integración de Temas',
      descripcion: 'Configurar soporte para modo claro/oscuro dinámico.',
      estado: 'En Progreso',
      asignadoA: 'Invitado Sin Permisos',
      prioridad: 'Media',
      fechaCreacion: new Date(),
      grupo: 'Frontend',
      creadorId: '1',
      historialCambios: [{ fecha: new Date(), usuario: 'Sistema', cambio: 'Ticket Creado' }]
    },
    {
      id: 3,
      titulo: 'API de Usuarios',
      descripcion: 'Crear endpoints para la gestión de perfiles.',
      estado: 'Abierto',
      asignadoA: 'Juan Pérez',
      prioridad: 'Alta',
      fechaCreacion: new Date(),
      grupo: 'Backend',
      creadorId: '1',
      historialCambios: [{ fecha: new Date(), usuario: 'Sistema', cambio: 'Ticket Creado' }]
    },
    {
      id: 4,
      titulo: 'Configuración MongoDB',
      descripcion: 'Establecer el cluster de base de datos y esquemas iniciales.',
      estado: 'Cerrado',
      asignadoA: 'Juan Pérez',
      prioridad: 'Urgente',
      fechaCreacion: new Date(),
      grupo: 'Backend',
      creadorId: '1',
      historialCambios: [{ fecha: new Date(), usuario: 'Sistema', cambio: 'Ticket Creado' }]
    },
    {
      id: 5,
      titulo: 'Error en Login con Google',
      descripcion: 'Varios usuarios reportan error 403 al intentar loguearse.',
      estado: 'Abierto',
      asignadoA: 'Mario Alberto',
      prioridad: 'Crítica',
      fechaCreacion: new Date(),
      grupo: 'Frontend',
      creadorId: '1',
      historialCambios: [{ fecha: new Date(), usuario: 'Sistema', cambio: 'Ticket Creado' }]
    },
    {
      id: 6,
      titulo: 'Validación de Formularios',
      descripcion: 'Agregar validaciones personalizadas a los campos de usuario.',
      estado: 'En Revisión',
      asignadoA: 'Super Admin',
      prioridad: 'Baja',
      fechaCreacion: new Date(),
      grupo: 'Frontend',
      creadorId: '1',
      historialCambios: [{ fecha: new Date(), usuario: 'Sistema', cambio: 'Ticket Creado' }]
    },
    {
      id: 7,
      titulo: 'Optimización de Consultas SQL',
      descripcion: 'El reporte mensual tarda más de 30 segundos en cargar.',
      estado: 'Abierto',
      asignadoA: 'Juan Pérez',
      prioridad: 'Muy Alta',
      fechaCreacion: new Date(),
      grupo: 'Backend',
      creadorId: '3',
      historialCambios: [{ fecha: new Date(), usuario: 'Sistema', cambio: 'Ticket Creado' }]
    },
    {
      id: 8,
      titulo: 'Seguridad en Endpoints',
      descripcion: 'Implementar guards de autorización para la gestión de grupos.',
      estado: 'Abierto',
      asignadoA: 'Super Admin',
      prioridad: 'Urgente',
      fechaCreacion: new Date(),
      grupo: 'Backend',
      creadorId: '1',
      historialCambios: [{ fecha: new Date(), usuario: 'Sistema', cambio: 'Ticket Creado' }]
    }
  ]);

  tickets = this.ticketsSignal.asReadonly();

  getTicketsByStatus(status: TicketStatus, groupName: string | null = null) {
    let result = this.ticketsSignal();
    if (groupName) result = result.filter(t => t.grupo === groupName);
    return result.filter((ticket) => ticket.estado === status);
  }

  addTicket(ticket: Ticket) {
    const nextId = Math.max(...this.ticketsSignal().map(t => t.id), 0) + 1;
    const newTicket = { ...ticket, id: nextId };
    this.ticketsSignal.update((tickets) => [...tickets, newTicket]);
  }

  updateTicket(updatedTicket: Ticket) {
    this.ticketsSignal.update((tickets) =>
      tickets.map((t) => (t.id === updatedTicket.id ? updatedTicket : t))
    );
  }

  deleteTicket(id: number) {
    this.ticketsSignal.update((tickets) => tickets.filter((t) => t.id !== id));
  }

  getTicketById(id: number) {
    return this.ticketsSignal().find((t) => t.id === id);
  }
}

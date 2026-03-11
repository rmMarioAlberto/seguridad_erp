import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { SelectButtonModule } from 'primeng/selectbutton';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SelectModule } from 'primeng/select';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { TicketService } from '../../services/ticket.service';
import { AuthPermissionService } from '../../services/auth-permission.service';
import { Ticket, TicketStatus } from '../../models/ticket.model';
import { TicketDetailComponent } from '../tickets/modals/ticket-detail';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TagModule,
    InputTextModule,
    SelectButtonModule,
    FormsModule,
    TableModule,
    IconFieldModule,
    InputIconModule,
    SelectModule,
    DragDropModule,
    TicketDetailComponent
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private readonly ticketService = inject(TicketService);
  private readonly authService = inject(AuthPermissionService);

  currentUser = this.authService.currentUser;
  
  activeFilter = signal<'all' | 'mine' | 'priority'>('all');
  selectedGroup = signal<string | null>(null);
  searchText = signal('');
  
  filterOptions = [
    { label: 'Todos', value: 'all' },
    { label: 'Mis Tickets', value: 'mine' },
    { label: 'Prioridad Alta', value: 'priority' }
  ];

  groupOptions = computed(() => {
    const user = this.currentUser();
    const groups = user?.groups || [];
    return [
      { label: 'Todos los Grupos', value: null },
      ...groups.map(g => ({ label: g, value: g }))
    ];
  });

  myTickets = computed(() => {
    const user = this.currentUser();
    const query = this.searchText().toLowerCase();
    const filter = this.activeFilter();
    const group = this.selectedGroup();
    if (!user) return [];
    
    let tickets = this.ticketService.tickets().filter((t: Ticket) => t.asignadoA === user.fullName);
    
    if (group) {
      tickets = tickets.filter(t => t.grupo === group);
    }
    
    if (filter === 'priority') {
      tickets = tickets.filter(t => ['Alta', 'Muy Alta', 'Urgente', 'Crítica'].includes(t.prioridad));
    }

    if (query) {
      tickets = tickets.filter(t => 
        t.titulo.toLowerCase().includes(query) || 
        t.descripcion.toLowerCase().includes(query)
      );
    }
    
    return tickets;
  });

  groupTickets = computed(() => {
    const user = this.currentUser();
    const query = this.searchText().toLowerCase();
    const filter = this.activeFilter();
    const group = this.selectedGroup();
    if (!user) return [];
    
    // Si el filtro es "Mis Tickets", ocultamos los del grupo
    if (filter === 'mine') return [];

    // Mostramos tickets de los grupos a los que pertenece el usuario
    let tickets = this.ticketService.tickets().filter((t: Ticket) => 
      user.groups.includes(t.grupo) && t.asignadoA !== user.fullName
    );

    if (group) {
      tickets = tickets.filter(t => t.grupo === group);
    }

    if (filter === 'priority') {
        tickets = tickets.filter(t => ['Alta', 'Muy Alta', 'Urgente', 'Crítica'].includes(t.prioridad));
    }

    if (query) {
      tickets = tickets.filter(t => 
        t.titulo.toLowerCase().includes(query) || 
        t.descripcion.toLowerCase().includes(query)
      );
    }

    return tickets;
  });

  stats = computed(() => {
    const all = this.ticketService.tickets();
    const user = this.currentUser();
    const myGroupTickets = all.filter(t => user?.groups.includes(t.grupo));

    return [
      { 
        label: 'Mis Tickets', 
        value: this.myTickets().length, 
        icon: 'pi pi-ticket', 
        color: 'blue',
        detail: 'Asignados a ti'
      },
      { 
        label: 'Tickets de Grupo', 
        value: myGroupTickets.length, 
        icon: 'pi pi-users', 
        color: 'purple',
        detail: 'En tus departamentos'
      },
      { 
        label: 'Pendientes', 
        value: myGroupTickets.filter(t => t.estado === 'Abierto').length, 
        icon: 'pi pi-clock', 
        color: 'orange',
        detail: 'Sin iniciar'
      },
      { 
        label: 'Completados', 
        value: myGroupTickets.filter(t => t.estado === 'Cerrado').length, 
        icon: 'pi pi-check-circle', 
        color: 'green',
        detail: 'Este mes'
      }
    ];
  });

  selectedTicket: Ticket | null = null;
  displayDetail = false;
  selectedView = 'list';
  
  viewOptions = [
    { label: 'Lista', value: 'list', icon: 'pi pi-list' },
    { label: 'Kanban', value: 'kanban', icon: 'pi pi-th-large' }
  ];

  statuses: TicketStatus[] = ['Abierto', 'En Progreso', 'En Revisión', 'Cerrado'];

  myTicketsByStatus(status: string) {
    return this.myTickets().filter(t => t.estado === status);
  }

  groupTicketsByStatus(status: string) {
    return this.groupTickets().filter(t => t.estado === status);
  }

  getStatusSeverity(status: string): "info" | "success" | "warn" | "danger" | "secondary" | "contrast" | undefined {
    switch (status) {
      case 'Abierto': return 'info';
      case 'En Progreso': return 'warn';
      case 'En Revisión': return 'secondary';
      case 'Cerrado': return 'success';
      default: return 'info';
    }
  }

  getPrioritySeverity(priority: string): "info" | "success" | "warn" | "danger" | "secondary" | "contrast" | undefined {
    switch (priority) {
      case 'Muy Baja': return 'success';
      case 'Baja': return 'info';
      case 'Media': return 'info';
      case 'Alta': return 'warn';
      case 'Muy Alta': return 'warn';
      case 'Urgente': return 'danger';
      case 'Crítica': return 'danger';
      default: return 'info';
    }
  }

  viewTicket(ticket: Ticket) {
    this.selectedTicket = ticket;
    this.displayDetail = true;
  }

  refreshData() {
    // Current tickets are linked to the service's signals via computed properties
  }

  getStatusIcon(status: string) {
    switch (status) {
      case 'Abierto': return 'pi pi-envelope';
      case 'En Progreso': return 'pi pi-sync';
      case 'En Revisión': return 'pi pi-eye';
      case 'Cerrado': return 'pi pi-check-circle';
      default: return 'pi pi-ticket';
    }
  }

  getStatusColor(status: string, bg = false) {
    switch (status) {
      case 'Abierto': return bg ? '#E0F2F1' : '#009688';
      case 'En Progreso': return bg ? '#FFF8E1' : '#FFC107';
      case 'En Revisión': return bg ? '#E1F5FE' : '#03A9F4';
      case 'Cerrado': return bg ? '#F1F8E9' : '#8BC34A';
      default: return '#9E9E9E';
    }
  }

  getPriorityColor(priority: string) {
    switch (priority) {
      case 'Muy Baja': return '#81C784';
      case 'Baja': return '#4CAF50';
      case 'Media': return '#2196F3';
      case 'Alta': return '#FB8C00';
      case 'Muy Alta': return '#F57C00';
      case 'Urgente': return '#E53935';
      case 'Crítica': return '#B71C1C';
      default: return '#757575';
    }
  }

  canMoveTicket(ticket: Ticket): boolean {
    const user = this.currentUser();
    if (!user) return false;
    if (user.role === 'SuperAdmin') return true;
    return ticket.asignadoA === user.fullName || !!user.permissions['ticket:edit_all'];
  }

  onDrop(event: CdkDragDrop<Ticket[]>, newStatus: string) {
    if (event.previousContainer === event.container) {
      // Internal reordering, though signals handle the underlying data
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const ticket = event.item.data as Ticket;
      const oldStatus = ticket.estado;
      
      if (oldStatus !== newStatus) {
        const updatedTicket = { 
          ...ticket, 
          estado: newStatus as TicketStatus,
          historialCambios: [
            ...(ticket.historialCambios || []),
            {
              fecha: new Date(),
              usuario: this.currentUser()?.fullName || 'Sistema',
              cambio: `Movió el ticket de ${oldStatus} a ${newStatus}`
            }
          ]
        };
        this.ticketService.updateTicket(updatedTicket);
      }
    }
  }
}

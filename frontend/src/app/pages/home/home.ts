import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
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
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { ChartModule } from 'primeng/chart';
import { TicketService } from '../../services/ticket.service';
import { AuthPermissionService } from '../../services/auth-permission.service';
import { Ticket, TicketStatus } from '../../models/ticket.model';
import { TicketDetailComponent } from '../tickets/modals/ticket-detail';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

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
    TicketDetailComponent,
    ChartModule,
    ToastModule
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private readonly ticketService = inject(TicketService);
  private readonly authService = inject(AuthPermissionService);
  private readonly messageService = inject(MessageService);

  currentUser = this.authService.currentUser;
  userGroups = this.authService.groups;
  
  activeFilter = signal<'all' | 'mine' | 'priority'>('all');
  selectedGroup = signal<number | null>(null);
  searchText = signal('');
  
  filterOptions = [
    { label: 'Todos', value: 'all' },
    { label: 'Mis Tickets', value: 'mine' },
    { label: 'Prioridad Alta', value: 'priority' }
  ];

  groupOptions = computed(() => {
    const groups = this.userGroups();
    return [
      { label: 'Todos los Grupos', value: null },
      ...groups.map(g => ({ label: g.nombre, value: g.id }))
    ];
  });

  constructor() {
    effect(() => {
      const globalGroupId = this.authService.selectedGroupId();
      if (globalGroupId !== this.selectedGroup()) {
        this.selectedGroup.set(globalGroupId);
        this.refreshData();
      }
    });
  }

  ngOnInit() {
    this.refreshData();
  }

  refreshData() {
    const groupId = this.selectedGroup();
    this.ticketService.loadTickets(groupId || undefined).subscribe();
  }

  onGroupChange(event: any) {
    this.authService.setSelectedGroup(event.value);
  }

  private readonly HIGH_PRIORITIES = ['Alta', 'Muy Alta', 'Urgente', 'Crítica'];

  myTickets = computed(() => {
    const user = this.currentUser();
    const query = this.searchText().toLowerCase().trim();
    const filter = this.activeFilter();
    if (!user) return [];
    
    let tickets = this.ticketService.tickets().filter((t: Ticket) => 
      t.creadorId === String(user.id) || 
      t.asignadoAId === user.id
    );
    
    if (filter === 'priority') {
      tickets = tickets.filter(t => this.HIGH_PRIORITIES.includes(t.prioridad || ''));
    }

    if (query) {
      tickets = tickets.filter(t => 
        t.titulo.toLowerCase().includes(query) || 
        t.descripcion.toLowerCase().includes(query) ||
        t.asignadoA.toLowerCase().includes(query) ||
        t.creadorNombre?.toLowerCase().includes(query) ||
        t.id.toString().includes(query)
      );
    }
    
    return tickets;
  });

  groupTickets = computed(() => {
    const user = this.currentUser();
    const query = this.searchText().toLowerCase().trim();
    const filter = this.activeFilter();
    if (!user) return [];
    
    if (filter === 'mine') return [];

    let tickets = this.ticketService.tickets().filter((t: Ticket) => 
      t.creadorId !== String(user.id) && 
      t.asignadoAId !== user.id
    );

    if (filter === 'priority') {
      tickets = tickets.filter(t => this.HIGH_PRIORITIES.includes(t.prioridad || ''));
    }

    if (query) {
      tickets = tickets.filter(t => 
        t.titulo.toLowerCase().includes(query) || 
        t.descripcion.toLowerCase().includes(query) ||
        t.asignadoA.toLowerCase().includes(query) ||
        t.creadorNombre?.toLowerCase().includes(query) ||
        t.id.toString().includes(query)
      );
    }

    return tickets;
  });

  canViewAllGroupTickets = computed(() => {
    return this.authService.hasPermission('tickets:view') || 
           this.authService.hasPermission('tickets:manage');
  });

  stats = computed(() => {
    const all = this.ticketService.tickets();
    return [
      { 
        label: 'Mis Tickets', 
        value: this.myTickets().length, 
        icon: 'pi pi-ticket', 
        color: 'blue',
        detail: 'Creados por ti'
      },
      { 
        label: 'Tickets de Grupo', 
        value: this.groupTickets().length, 
        icon: 'pi pi-users', 
        color: 'purple',
        detail: 'En este departamento'
      },
      { 
        label: 'Pendientes', 
        value: all.filter(t => t.estado === 'Abierto').length, 
        icon: 'pi pi-clock', 
        color: 'orange',
        detail: 'Sin iniciar'
      },
      { 
        label: 'Completados', 
        value: all.filter(t => t.estado === 'Cerrado').length, 
        icon: 'pi pi-check-circle', 
        color: 'green',
        detail: 'Finalizados'
      }
    ];
  });

  chartData = computed(() => {
    const all = this.ticketService.tickets();
    const statuses = ['Abierto', 'En Progreso', 'En Revisión', 'Cerrado'];
    const statusCounts = statuses.map(s => all.filter(t => t.estado === s).length);
    
    return {
      labels: statuses,
      datasets: [
        {
          data: statusCounts,
          backgroundColor: ['#009688', '#FFC107', '#03A9F4', '#8BC34A'],
          hoverBackgroundColor: ['#4DB6AC', '#FFD54F', '#4FC3F7', '#AED581']
        }
      ]
    };
  });

  priorityChartData = computed(() => {
    const all = this.ticketService.tickets();
    const priorities = ['Baja', 'Media', 'Alta', 'Crítica'];
    const counts = priorities.map(p => all.filter(t => t.prioridad === p || (p === 'Alta' && t.prioridad === 'Muy Alta') || (p === 'Crítica' && t.prioridad === 'Urgente')).length);
    
    return {
      labels: priorities,
      datasets: [
        {
          label: 'Distribución por Prioridad',
          data: counts,
          backgroundColor: ['#4CAF50', '#2196F3', '#FB8C00', '#B71C1C'],
          borderRadius: 8
        }
      ]
    };
  });

  chartOptions = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: { usePointStyle: true, color: '#495057' }
      }
    },
    maintainAspectRatio: false,
    cutout: '65%'
  };

  barOptions = {
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true, grid: { display: false } },
      x: { grid: { display: false } }
    },
    maintainAspectRatio: false
  };

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

  getPrioritySeverity(priority: string | undefined): "info" | "success" | "warn" | "danger" | "secondary" | "contrast" | undefined {
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

  getPriorityColor(priority: string | undefined) {
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
    
    // Admins (Global o Grupo)
    if (this.authService.hasPermissionForGroup('tickets:move', ticket.grupoId || null)) return true;
    if (this.authService.hasPermissionForGroup('tickets:manage', ticket.grupoId || null)) return true;
    
    // Dueño o Asignado
    return ticket.creadorId === String(user.id) || ticket.asignadoAId === user.id;
  }

  onDrop(event: CdkDragDrop<Ticket[]>, newStatus: string) {
    if (event.previousContainer === event.container) return;

    const ticket = event.item.data as Ticket;
    if (this.canMoveTicket(ticket)) {
        const userId = this.currentUser()?.id;
        if (!userId) return;

        this.ticketService.updateStatus(ticket.id, this.mapStatusToId(newStatus), userId).subscribe({
            error: (err) => {
                console.error('Error al mover ticket:', err);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo mover el ticket' });
                // El visual refresh se encargará de devolverlo a su sitio si el service emite
            }
        });
    }
  }

  private mapStatusToId(status: string): number {
    switch(status) {
      case 'Abierto': return 1;
      case 'En Progreso': return 2;
      case 'En Revisión': return 3;
      case 'Cerrado': return 4;
      default: return 1;
    }
  }
}

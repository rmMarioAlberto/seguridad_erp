import { Component, inject, signal, ViewChild, OnInit, computed, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TicketService } from '../../../services/ticket.service';
import { GroupService } from '../../../services/group.service';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { FormsModule } from '@angular/forms';
import { TicketDetailComponent } from '../modals/ticket-detail';
import { TicketCreateComponent } from '../modals/ticket-create';
import { Ticket, TicketStatus } from '../../../models/ticket.model';
import { AuthPermissionService } from '../../../services/auth-permission.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { UserManagementService } from '../../../services/user-management.service';

@Component({
  selector: 'app-ticket-group-view',
  standalone: true,
  imports: [
    CommonModule, 
    SelectButtonModule, 
    TableModule, 
    TagModule, 
    ButtonModule, 
    SelectModule, 
    InputTextModule, 
    CardModule, 
    FormsModule, 
    TicketDetailComponent, 
    TicketCreateComponent,
    DatePipe,
    IconFieldModule,
    InputIconModule,
    RouterLink,
    DragDropModule
  ],
  templateUrl: './group-view.html',
  styleUrl: './group-view.css',
})
export class TicketGroupViewComponent implements OnInit {
  private readonly groupService = inject(GroupService);
  private readonly ticketService = inject(TicketService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthPermissionService);
  private readonly userService = inject(UserManagementService);

  tickets = this.ticketService.tickets;
  statuses: TicketStatus[] = ['Abierto', 'En Progreso', 'En Revisión', 'Cerrado'];
  
  groupOptions = computed(() => {
    return [
      { label: 'Todos los Grupos', value: null },
      ...this.groupService.groups().map(g => ({ label: g.nombre, value: g.id }))
    ];
  });

  activeFilter = signal<'all' | 'mine' | 'unassigned' | 'priority'>('all');
  selectedGroup = signal<number | null>(null);
  currentGroupName = computed(() => {
    const groupId = this.selectedGroup();
    if (!groupId) return 'Todos los Grupos';
    const group = this.groupService.groups().find(g => g.id === groupId);
    return group ? group.nombre : 'Cargando...';
  });
  selectedView = signal<'kanban' | 'list'>('kanban');
  globalFilter = signal('');
  isContextualMode = false;

  filterOptions = [
    { label: 'Todos', value: 'all' },
    { label: 'Mis Tickets', value: 'mine' },
    { label: 'Sin Asignar', value: 'unassigned' },
    { label: 'Prioridad Alta', value: 'priority' }
  ];

  viewOptions = [
    { label: 'Kanban', value: 'kanban', icon: 'pi pi-th-large' },
    { label: 'Lista', value: 'list', icon: 'pi pi-list' }
  ];

  selectedTicket: Ticket | null = null;
  displayDetail = false;

  @ViewChild('ticketCreate') ticketCreate!: TicketCreateComponent;
  @ViewChild(TicketDetailComponent) ticketDetail!: TicketDetailComponent;

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
    this.route.queryParams.subscribe(params => {
      if (params['group']) {
        const groupId = Number(params['group']);
        this.selectedGroup.set(groupId);
        this.isContextualMode = true;
        this.authService.setSelectedGroup(groupId);
      } else {
        this.isContextualMode = false;
      }

      if (params['create']) {
        setTimeout(() => this.ticketCreate.show(), 500);
      }
    });

    const savedView = localStorage.getItem('ticketView');
    if (savedView) this.selectedView.set(savedView as 'kanban' | 'list');
    
    // Pre-cargar datos base para dropdowns de tickets
    this.groupService.loadGroups().subscribe();
    if (this.authService.hasPermission('users:view')) {
      this.userService.loadUsers().subscribe();
    }
    
    this.refreshData();
  }

  saveView() {
    localStorage.setItem('ticketView', this.selectedView());
  }

  openCreate() {
    this.ticketCreate.show();
  }

  filteredTickets = computed(() => {
    let result = this.tickets();
    const user = this.authService.currentUser();
    const groupId = this.selectedGroup();
    const filter = this.activeFilter();
    const query = this.globalFilter().toLowerCase();

    if (groupId) {
      result = result.filter(t => t.grupoId === groupId);
    }

    switch (filter) {
      case 'mine':
        if (user) {
          result = result.filter(t => 
            t.creadorId === String(user.id) || 
            t.asignadoAId === user.id
          );
        }
        break;
      case 'unassigned':
        result = result.filter(t => !t.asignadoAId);
        break;
      case 'priority':
        result = result.filter(t => ['Alta', 'Muy Alta', 'Urgente', 'Crítica'].includes(t.prioridad || ''));
        break;
    }

    if (query) {
      result = result.filter(t => 
        t.titulo.toLowerCase().includes(query) || 
        t.descripcion.toLowerCase().includes(query) ||
        t.asignadoA.toLowerCase().includes(query) ||
        t.grupo.toLowerCase().includes(query)
      );
    }

    return result;
  });

  refreshData() {
    this.ticketService.loadTickets(this.selectedGroup() || undefined).subscribe();
  }

  onGroupChange(id: number | null) {
    this.authService.setSelectedGroup(id);
  }

  getTicketsByStatus(status: string) {
    return this.filteredTickets().filter(t => t.estado === status);
  }

  getCount(status: TicketStatus) {
    return this.filteredTickets().filter(t => t.estado === status).length;
  }

  getPercentage(status: TicketStatus) {
    const total = this.filteredTickets().length;
    if (total === 0) return 0;
    return Math.round((this.getCount(status) / total) * 100);
  }


  getStatusIcon(status: TicketStatus) {
    switch (status) {
      case 'Abierto': return 'pi pi-envelope';
      case 'En Progreso': return 'pi pi-sync';
      case 'En Revisión': return 'pi pi-eye';
      case 'Cerrado': return 'pi pi-check-circle';
      default: return 'pi pi-ticket';
    }
  }

  viewTicket(ticket: Ticket) {
    this.selectedTicket = ticket;
    this.displayDetail = true;
  }

  editTicket(ticket: Ticket, event: Event) {
    event.stopPropagation();
    // Use the direct edit method to avoid double dialog opening
    this.ticketDetail.openEditDirectly(ticket);
  }

  deleteTicket(ticket: Ticket, event: Event) {
    event.stopPropagation();
    // Use the direct delete method to reuse the confirmation logic
    this.ticketDetail.deleteTicketDirectly(ticket);
  }

  canEditTicket(ticket: Ticket): boolean {
    const user = this.authService.currentUser();
    if (!user) return false;
    
    // Admins (Global o Grupo)
    if (this.authService.hasPermissionForGroup('tickets:edit', ticket.grupoId || null)) return true;
    
    // Dueño o Asignado
    return String(user.id) === ticket.creadorId || user.id === ticket.asignadoAId;
  }

  canDeleteTicket(ticket: Ticket): boolean {
    const user = this.authService.currentUser();
    if (!user) return false;
    
    // Admins (Global o Grupo)
    if (this.authService.hasPermissionForGroup('tickets:delete', ticket.grupoId || null)) return true;
    
    // Solo el Creador puede borrar su propio ticket
    return String(user.id) === ticket.creadorId;
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

  getStatusColor(status: string, bg = false) {
    switch (status) {
      case 'Abierto': return bg ? '#E0F2F1' : '#009688';
      case 'En Progreso': return bg ? '#FFF8E1' : '#FFC107';
      case 'En Revisión': return bg ? '#E1F5FE' : '#03A9F4';
      case 'Cerrado': return bg ? '#F1F8E9' : '#8BC34A';
      default: return '#9E9E9E';
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

  hasPermission(perm: string): boolean {
    return this.authService.hasPermissionForGroup(perm, this.selectedGroup());
  }

  canMoveTicket(ticket: Ticket): boolean {
    const user = this.authService.currentUser();
    if (!user) return false;
    
    // Admins (Global o Grupo)
    if (this.authService.hasPermissionForGroup('tickets:move', ticket.grupoId || null)) return true;
    if (this.authService.hasPermissionForGroup('tickets:manage', ticket.grupoId || null)) return true;
    
    // Dueño o Asignado
    return String(user.id) === ticket.creadorId || user.id === ticket.asignadoAId;
  }

  onDrop(event: CdkDragDrop<Ticket[]>, newStatus: string) {
    if (event.previousContainer === event.container) return;

    const ticket = event.item.data as Ticket;
    if (this.canMoveTicket(ticket)) {
        const userId = this.authService.currentUser()?.id;
        if (!userId) return;

        this.ticketService.updateStatus(ticket.id, this.mapStatusToId(newStatus), userId).subscribe({
            error: (err) => {
                console.error('Error al mover ticket:', err);
                // La gestión de errores y reversión visual ya está implícita en el diseño del service
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

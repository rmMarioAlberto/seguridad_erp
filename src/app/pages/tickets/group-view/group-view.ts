import { Component, inject, signal, ViewChild, OnInit, computed } from '@angular/core';
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
import { User, Permission } from '../../../models/user.model';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

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
  template: `
    <div class="p-4 surface-card shadow-1 border-round-xl">
      <!-- Dashboard Header -->
      <div class="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-5 gap-3">
        <div>
            <h2 class="text-3xl font-bold m-0 text-color">
                {{ selectedGroup ? 'Dashboard de ' + selectedGroup : 'Gestión de Tickets' }}
            </h2>
            <p class="text-color-secondary m-0">
                {{ selectedGroup ? 'Estadísticas y tareas para el grupo ' + selectedGroup : 'Organiza y supervisa las tareas de tu equipo.' }}
            </p>
        </div>
        <div class="flex flex-wrap gap-2 w-full md:w-auto">
            @if (!isContextualMode) {
                <p-select [options]="groupOptions()" [(ngModel)]="selectedGroup" optionLabel="label" optionValue="value"
                            placeholder="Seleccionar Grupo" class="w-full md:w-15rem" [showClear]="true" (onChange)="filterTickets()">
                </p-select>
            } @else {
                <p-button label="Volver a Grupos" icon="pi pi-arrow-left" [text]="true" severity="secondary" routerLink="/group"></p-button>
            }
            <p-button *ngIf="hasPermission('ticket:create')" label="Nuevo Ticket" icon="pi pi-plus" (click)="openCreate()"></p-button>
        </div>
      </div>

      <!-- Stats Cards Row -->
      <div class="grid mb-5">
        @for (status of statuses; track status) {
            <div class="col-12 md:col-3">
                <div class="surface-card shadow-1 p-3 border-round-xl border-1 surface-border hover:shadow-2 transition-all transition-duration-300">
                    <div class="flex justify-content-between mb-3">
                        <div>
                            <span class="block text-color-secondary font-medium mb-2 uppercase text-xs tracking-wider">{{ status }}</span>
                            <div class="text-color font-bold text-2xl">{{ getCount(status) }}</div>
                        </div>
                        <div class="flex align-items-center justify-content-center border-round" 
                             [style.width]="'2.5rem'" [style.height]="'2.5rem'" 
                             [style.background-color]="getStatusColor(status, true)">
                            <i [class]="getStatusIcon(status)" [style.color]="getStatusColor(status)"></i>
                        </div>
                    </div>
                    <div class="flex align-items-center">
                        <span class="text-primary font-medium mr-2">{{ getPercentage(status) }}%</span>
                        <span class="text-color-secondary text-xs">del total grupo</span>
                    </div>
                </div>
            </div>
        }
      </div>

      <div class="flex flex-column md:flex-row justify-content-between align-items-center mb-4 gap-3">
        <p-iconfield iconPosition="left" class="w-full md:w-20rem">
            <p-inputicon class="pi pi-search"></p-inputicon>
            <input pInputText type="text" [(ngModel)]="globalFilter" (input)="filterTickets()" placeholder="Buscar ticket..." class="w-full" />
        </p-iconfield>
        <div class="flex flex-wrap align-items-center gap-2">
            <span class="font-medium text-color">Filtros:</span>
            <p-selectbutton [options]="filterOptions" [(ngModel)]="activeFilter" optionLabel="label" optionValue="value" (onChange)="filterTickets()">
            </p-selectbutton>
            <div class="border-left-1 border-border h-2rem mx-2 hidden md:block"></div>
            <span class="font-medium text-color">Vista:</span>
            <p-selectbutton [options]="viewOptions" [(ngModel)]="selectedView" optionLabel="label" optionValue="value" (onChange)="saveView()">
                <ng-template let-item pTemplate="item">
                    <i [class]="item.icon + ' mr-2'"></i>
                    <span>{{item.label}}</span>
                </ng-template>
            </p-selectbutton>
        </div>
      </div>

      <!-- List View -->
      @if (selectedView === 'list') {
        <div class="fadein animation-duration-300">
          <p-table [value]="filteredTickets()" [paginator]="true" [rows]="10" [responsiveLayout]="'scroll'"
                   [globalFilterFields]="['titulo', 'asignadoA', 'descripcion']"
                   class="shadow-1 border-round-xl overflow-hidden custom-table">
            <ng-template pTemplate="header">
              <tr>
                <th pSortableColumn="titulo" style="width:30%">Título <p-sortIcon field="titulo"></p-sortIcon></th>
                <th pSortableColumn="estado">Estado <p-sortIcon field="estado"></p-sortIcon></th>
                <th pSortableColumn="prioridad">Prioridad <p-sortIcon field="prioridad"></p-sortIcon></th>
                <th>Asignado a</th>
                <th pSortableColumn="fechaCreacion">Creado <p-sortIcon field="fechaCreacion"></p-sortIcon></th>
                <th style="width:10%">Acciones</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-ticket>
              <tr class="cursor-pointer" (click)="viewTicket(ticket)">
                <td class="font-bold text-color text-truncate" style="max-width: 0;">{{ ticket.titulo }}</td>
                <td>
                  <p-tag [value]="ticket.estado" [severity]="getStatusSeverity(ticket.estado)" class="uppercase"></p-tag>
                </td>
                <td>
                  <p-tag [value]="ticket.prioridad" [severity]="getPrioritySeverity(ticket.prioridad)" [rounded]="true"></p-tag>
                </td>
                <td>
                  <div class="flex align-items-center gap-2">
                      <div class="w-2rem h-2rem border-circle bg-primary-100 flex align-items-center justify-content-center text-primary font-bold text-xs">
                          {{ ticket.asignadoA.substring(0,1) }}
                      </div>
                      <span class="text-color text-sm">{{ ticket.asignadoA }}</span>
                  </div>
                </td>
                <td class="text-color-secondary text-sm">{{ ticket.fechaCreacion | date:'dd/MM/yyyy' }}</td>
                <td class="text-center" (click)="$event.stopPropagation()">
                  <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="secondary" (click)="viewTicket(ticket)"></p-button>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                  <td colspan="6" class="text-center p-5 text-color-secondary">No se encontraron tickets con los criterios seleccionados.</td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      }

      <!-- Kanban View -->
      @if (selectedView === 'kanban') {
        <div class="grid p-1 fadein animation-duration-300" cdkDropListGroup>
          @for (status of statuses; track status) {
            <div class="col-12 md:col-3 px-2">
                <div class="surface-section p-3 border-round-xl h-full border-1 surface-border">
                    <div class="flex justify-content-between align-items-start mb-3">
                        <h3 class="font-bold text-lg m-0 text-color flex align-items-center">
                             <i class="pi pi-circle-fill mr-2" [style.color]="getStatusColor(status)"></i>
                            {{ status }}
                        </h3>
                        <p-tag [value]="getTicketsByStatus(status).length.toString()" severity="secondary" [rounded]="true"></p-tag>
                    </div>
                    
                    <div class="flex flex-column gap-3 min-h-10rem p-2 border-round surface-100"
                         cdkDropList
                         [id]="'group-view-' + status"
                         [cdkDropListData]="getTicketsByStatus(status)"
                         (cdkDropListDropped)="onDrop($event, status)">
                        @for (ticket of getTicketsByStatus(status); track ticket.id) {
                            <div (click)="viewTicket(ticket)"
                                 cdkDrag
                                 [cdkDragData]="ticket"
                                 [cdkDragDisabled]="!canMoveTicket(ticket)"
                                 class="p-3 surface-card border-round-lg shadow-1 hover:shadow-3 transform transition-all transition-duration-200 cursor-pointer border-bottom-2"
                                 [class.cursor-not-allowed]="!canMoveTicket(ticket)"
                                 [class.opacity-80]="!canMoveTicket(ticket)"
                                 [style.border-color]="getPriorityColor(ticket.prioridad)">
                                
                                <div class="flex justify-content-between align-items-start mb-2">
                                     <small class="text-xs text-color-secondary uppercase font-bold">{{ ticket.grupo }}</small>
                                     <i class="pi pi-ellipsis-v text-color-secondary opacity-50"></i>
                                </div>
                                
                                <div class="font-bold text-color mb-2 line-height-3">{{ ticket.titulo }}</div>
                                
                                <div class="flex justify-content-between align-items-center mt-3">
                                     <div class="flex align-items-center gap-2">
                                        <div class="w-1-5rem h-1-5rem border-circle surface-section flex align-items-center justify-content-center text-color text-xs font-bold border-1 surface-border">
                                            {{ ticket.asignadoA.substring(0,1) }}
                                        </div>
                                        <span class="text-xs text-color-secondary font-medium">{{ ticket.asignadoA }}</span>
                                     </div>
                                     <div class="flex gap-2">
                                        @if (ticket.comentarios?.length) {
                                            <i class="pi pi-comment text-color-secondary text-sm opacity-50"></i>
                                        }
                                        <small class="text-color-secondary text-xs font-semibold">{{ ticket.fechaCreacion | date:'MMM d' }}</small>
                                     </div>
                                </div>

                                <!-- Drag Placeholder -->
                                <div *cdkDragPlaceholder class="surface-hover border-round-xl border-2 border-dashed border-primary-500 opacity-50 p-4 mb-3"></div>
                            </div>
                        }
                    </div>
                </div>
            </div>
          }
        </div>
      }
    </div>

    <!-- Modals -->
    <app-ticket-detail [(visible)]="displayDetail" [ticket]="selectedTicket" (ticketDeleted)="refreshData()"></app-ticket-detail>
    <app-ticket-create #ticketCreate (ticketCreated)="refreshData()"></app-ticket-create>
  `,
  styles: [`
    .text-truncate {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .custom-table .p-datatable-header {
        background: transparent;
        padding: 0;
    }
    :host ::ng-deep .p-datatable-tbody > tr {
        background: var(--surface-card);
    }
    :host ::ng-deep .p-datatable-tbody > tr:hover {
        background: var(--surface-hover) !important;
    }
    :host ::ng-deep .p-selectbutton .p-button {
        color: var(--text-color-secondary);
    }
    :host ::ng-deep .p-selectbutton .p-button.p-highlight {
        color: #ffffff;
    }
    .line-height-3 {
        line-height: 1.5;
    }
  `]
})
export class TicketGroupViewComponent implements OnInit {
  private readonly groupService = inject(GroupService);
  private readonly ticketService = inject(TicketService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthPermissionService);

  tickets = this.ticketService.tickets;
  statuses: TicketStatus[] = ['Abierto', 'En Progreso', 'En Revisión', 'Cerrado'];
  
  groupOptions = computed(() => 
    this.groupService.groups().map(g => ({ label: g.nombre, value: g.nombre }))
  );
  activeFilter: 'all' | 'mine' | 'unassigned' | 'priority' = 'all';

  filterOptions = [
    { label: 'Todos', value: 'all' },
    { label: 'Mis Tickets', value: 'mine' },
    { label: 'Sin Asignar', value: 'unassigned' },
    { label: 'Prioridad Alta', value: 'priority' }
  ];

  selectedGroup: string | null = null;
  selectedView = 'kanban';
  globalFilter = '';
  isContextualMode = false;

  viewOptions = [
    { label: 'Kanban', value: 'kanban', icon: 'pi pi-th-large' },
    { label: 'Lista', value: 'list', icon: 'pi pi-list' }
  ];

  selectedTicket: Ticket | null = null;
  displayDetail = false;

  @ViewChild('ticketCreate') ticketCreate!: TicketCreateComponent;

  filteredTickets = signal<Ticket[]>([]);

  ngOnInit() {
    // Groups are handled by groupOptions computed from Service
    
    // Initial filter
    this.filterTickets();

    // Check for query params
    this.route.queryParams.subscribe(params => {
        if (params['group']) {
            this.selectedGroup = params['group'];
            this.isContextualMode = true;
            this.filterTickets();
        }

        if (params['create']) {
            setTimeout(() => {
              this.ticketCreate.show();
              this.router.navigate([], { 
                queryParams: { create: null }, 
                queryParamsHandling: 'merge' 
              });
            }, 500);
        }
    });

    const savedView = localStorage.getItem('ticketView');
    if (savedView) this.selectedView = savedView;
  }

  saveView() {
    localStorage.setItem('ticketView', this.selectedView);
  }

  openCreate() {
    this.ticketCreate.show();
  }

  filterTickets() {
    let result: Ticket[] = [...this.tickets()];
    const user = this.authService.currentUser();
    
    if (this.selectedGroup) {
        result = result.filter(t => t.grupo === this.selectedGroup);
    }

    // Apply Quick Filters
    switch (this.activeFilter) {
        case 'mine':
            if (user) result = result.filter(t => t.asignadoA === user.fullName);
            break;
        case 'unassigned':
            result = result.filter(t => !t.asignadoA || t.asignadoA === 'Sin asignar');
            break;
        case 'priority':
            result = result.filter(t => ['Alta', 'Muy Alta', 'Urgente', 'Crítica'].includes(t.prioridad));
            break;
    }
    
    if (this.globalFilter) {
        const query = this.globalFilter.toLowerCase();
        result = result.filter(t => 
            t.titulo.toLowerCase().includes(query) || 
            t.asignadoA.toLowerCase().includes(query) ||
            t.descripcion.toLowerCase().includes(query)
        );
    }

    this.filteredTickets.set(result);
  }

  refreshData() {
    this.filterTickets();
  }

  getTicketsByStatus(status: string) {
    return this.filteredTickets().filter(t => t.estado === status);
  }

  getCount(status: TicketStatus) {
    return this.ticketService.getTicketsByStatus(status, this.selectedGroup).length;
  }

  getPercentage(status: TicketStatus) {
    const groupTickets = this.tickets().filter(t => !this.selectedGroup || t.grupo === this.selectedGroup);
    const total = groupTickets.length;
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

  hasPermission(perm: Permission): boolean {
    return this.authService.hasPermission(perm);
  }

  canMoveTicket(ticket: Ticket): boolean {
    const user = this.authService.currentUser();
    if (!user) return false;
    if (user.role === 'SuperAdmin') return true;
    return ticket.asignadoA === user.fullName || !!user.permissions['ticket:edit_all'];
  }

  onDrop(event: CdkDragDrop<Ticket[]>, newStatus: string) {
    if (event.previousContainer === event.container) {
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
              usuario: this.authService.currentUser()?.fullName || 'Sistema',
              cambio: `Movió el ticket de ${oldStatus} a ${newStatus}`
            }
          ]
        };
        this.ticketService.updateTicket(updatedTicket);
        this.filterTickets(); // Refresh view
      }
    }
  }
}

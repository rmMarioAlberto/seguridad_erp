import { Component, Input, Output, EventEmitter, inject, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TimelineModule } from 'primeng/timeline';
import { TextareaModule } from 'primeng/textarea';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Ticket, TicketStatus, TicketPriority } from '../../../models/ticket.model';
import { TicketService } from '../../../services/ticket.service';
import { AuthPermissionService } from '../../../services/auth-permission.service';
import { GroupService } from '../../../services/group.service';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [
    CommonModule, 
    DialogModule, 
    ButtonModule, 
    TagModule, 
    TimelineModule, 
    TextareaModule, 
    FormsModule, 
    ReactiveFormsModule, 
    SelectModule, 
    DatePickerModule, 
    DatePipe,
    InputTextModule
  ],
  template: `
    <p-dialog [(visible)]="visible" [header]="'#' + ticket?.id + ' - ' + ticket?.titulo" 
              [modal]="true" [style]="{width: '60vw'}" [breakpoints]="{'960px': '75vw', '640px': '90vw'}" (onHide)="onHide()">
        
        @if (ticket) {
            <div class="grid pt-3">
                <!-- Left Column: Details -->
                <div class="col-12 md:col-8 pr-4">
                    <div class="mb-5">
                        <h3 class="text-color font-bold mb-2 flex align-items-center">
                            <i class="pi pi-align-left mr-2 text-primary"></i> Descripción
                        </h3>
                        <p class="text-color-secondary line-height-3 m-0 p-3 surface-section border-round">{{ ticket.descripcion }}</p>
                    </div>

                    <div class="mb-5">
                        <h3 class="text-color font-bold mb-3 flex align-items-center">
                            <i class="pi pi-comments mr-2 text-primary"></i> Comentarios
                        </h3>
                        <div class="flex flex-column gap-3 mb-4">
                            @for (comm of ticket.comentarios || []; track comm.fecha) {
                                <div class="p-3 border-round surface-section">
                                    <div class="flex justify-content-between mb-1">
                                        <span class="font-bold text-color">{{ comm.autor }}</span>
                                        <small class="text-color-secondary">{{ comm.fecha | date:'short' }}</small>
                                    </div>
                                    <div class="text-color-secondary">{{ comm.texto }}</div>
                                </div>
                            }
                            @if (!ticket.comentarios?.length) {
                                <div class="text-color-secondary italic">No hay comentarios aún.</div>
                            }
                        </div>
                        
                        <div class="flex flex-column gap-2">
                            <textarea pTextarea [(ngModel)]="newComment" rows="2" placeholder="Escribe un comentario..." class="w-full"></textarea>
                            <div class="flex justify-content-end">
                                <p-button label="Enviar" icon="pi pi-send" size="small" (click)="addComment()" [disabled]="!newComment"></p-button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 class="text-color font-bold mb-3 flex align-items-center">
                            <i class="pi pi-history mr-2 text-primary"></i> Historial de Cambios
                        </h3>
                        <div class="pl-2">
                          <p-timeline [value]="ticket.historialCambios || []" styleClass="w-full custom-timeline">
                              <ng-template pTemplate="content" let-item>
                                  <div class="flex flex-column mb-3">
                                      <span class="font-bold text-color">{{ item.cambio }}</span>
                                      <small class="text-color-secondary">{{ item.usuario }} - {{ item.fecha | date:'short' }}</small>
                                  </div>
                              </ng-template>
                          </p-timeline>
                        </div>
                        @if (!ticket.historialCambios?.length) {
                            <div class="text-color-secondary italic pl-5">Inicio del seguimiento.</div>
                        }
                    </div>
                </div>

                <!-- Right Column: Sidebar -->
                <div class="col-12 md:col-4 border-left-1 border-border pl-4 py-0">
                    <div class="mb-4">
                        <span class="block text-color-secondary font-medium mb-2 uppercase text-xs tracking-wider">Estado</span>
                        <p-tag [value]="ticket.estado" [severity]="getStatusSeverity(ticket.estado)" class="w-full"></p-tag>
                    </div>
                    
                    <div class="mb-4">
                        <span class="block text-color-secondary font-medium mb-2 uppercase text-xs tracking-wider">Prioridad</span>
                        <p-tag [value]="ticket.prioridad" [severity]="getPrioritySeverity(ticket.prioridad)" [rounded]="true" class="w-full"></p-tag>
                    </div>

                    <div class="mb-4">
                        <span class="block text-color-secondary font-medium mb-1 uppercase text-xs tracking-wider">Proyecto / Grupo</span>
                        <div class="text-color font-bold">{{ ticket.grupo }}</div>
                    </div>

                    <div class="mb-4">
                        <span class="block text-color-secondary font-medium mb-1 uppercase text-xs tracking-wider">Asignado a</span>
                        <div class="flex align-items-center gap-2">
                             <div class="w-2rem h-2rem border-circle bg-primary-100 flex align-items-center justify-content-center text-primary font-bold text-xs">
                                {{ ticket.asignadoA.substring(0,1) }}
                            </div>
                            <span class="text-color">{{ ticket.asignadoA }}</span>
                        </div>
                    </div>

                    <div class="mb-4">
                        <span class="block text-color-secondary font-medium mb-1 uppercase text-xs tracking-wider">Fecha Creación</span>
                        <div class="text-color">{{ ticket.fechaCreacion | date:'dd/MM/yyyy HH:mm' }}</div>
                    </div>

                    <div class="mb-4">
                        <span class="block text-color-secondary font-medium mb-1 uppercase text-xs tracking-wider">Fecha Límite</span>
                        <div [class]="isOverdue() ? 'text-red-500 font-bold' : 'text-color'">
                            {{ ticket.fechaLimite ? (ticket.fechaLimite | date:'dd/MM/yyyy') : 'Sin definir' }}
                        </div>
                    </div>
                </div>
            </div>
        }

        <ng-template pTemplate="footer">
            <div class="flex justify-content-between w-full">
                <p-button *ngIf="canDelete()" label="Eliminar" icon="pi pi-trash" severity="danger" [text]="true" (click)="deleteTicket()"></p-button>
                <div *ngIf="!canDelete()"></div>
                <div class="flex gap-2">
                    <p-button label="Cerrar" icon="pi pi-times" (click)="visible = false" severity="secondary" [text]="true"></p-button>
                    <p-button *ngIf="canEdit()" label="Editar Ticket" icon="pi pi-pencil" (click)="openEdit()"></p-button>
                </div>
            </div>
        </ng-template>
    </p-dialog>

    <!-- Edit Dialog -->
    <p-dialog [(visible)]="showEditDialog" [header]="'Editar Ticket #' + ticket?.id" 
              [modal]="true" [style]="{width: '450px'}" [breakpoints]="{'960px': '75vw', '640px': '90vw'}" (onHide)="showEditDialog = false" appendTo="body">
        @if (ticketForm) {
            <form [formGroup]="ticketForm" (ngSubmit)="onSubmit()" class="flex flex-column gap-3 mt-3">
                <div class="field flex flex-column gap-2" *ngIf="canEditFull()">
                    <label for="titulo" class="font-bold text-color">Título del Ticket</label>
                    <input pInputText id="titulo" formControlName="titulo" class="w-full" />
                </div>

                <div class="field flex flex-column gap-2" *ngIf="canEditFull()">
                    <label for="descripcion" class="font-bold text-color">Descripción</label>
                    <textarea pTextarea id="descripcion" formControlName="descripcion" rows="4" class="w-full"></textarea>
                </div>

                <div class="grid">
                    <div class="col-12 md:col-6 field flex flex-column gap-2" *ngIf="canEditFull()">
                        <label for="prioridad" class="font-bold text-color">Prioridad</label>
                        <p-select id="prioridad" [options]="priorities" formControlName="prioridad" class="w-full" appendTo="body"></p-select>
                    </div>
                    <div class="col-12 md:col-6 field flex flex-column gap-2">
                        <label for="estado" class="font-bold text-color">Estado</label>
                        <p-select id="estado" [options]="statuses" formControlName="estado" class="w-full" appendTo="body"></p-select>
                    </div>
                </div>

                <div class="grid">
                    <div class="col-12 md:col-6 field flex flex-column gap-2" *ngIf="canEditFull()">
                        <label for="grupo" class="font-bold text-color">Grupo</label>
                        <p-select id="grupo" [options]="groupOptions()" formControlName="grupo" optionLabel="label" optionValue="value" class="w-full" appendTo="body"></p-select>
                    </div>
                     <div class="col-12 md:col-6 field flex flex-column gap-2" *ngIf="canEditFull()">
                        <label for="fechaLimite" class="font-bold text-color">Fecha Límite</label>
                        <p-datepicker id="fechaLimite" formControlName="fechaLimite" [showIcon]="true" appendTo="body" class="w-full"></p-datepicker>
                    </div>
                </div>

                <div class="field flex flex-column gap-2" *ngIf="canEditFull()">
                    <label for="asignadoA" class="font-bold text-color">Asignado a</label>
                    <p-select id="asignadoA" [options]="userOptions()" formControlName="asignadoA" optionLabel="label" optionValue="value" class="w-full" appendTo="body"></p-select>
                </div>

                <div class="flex justify-content-end gap-2 mt-4 pt-3 border-top-1 surface-border">
                    <p-button label="Cancelar" icon="pi pi-times" (click)="showEditDialog = false" severity="secondary" [text]="true"></p-button>
                    <p-button label="Guardar" icon="pi pi-check" type="submit" [disabled]="ticketForm.invalid" class="p-button-raised"></p-button>
                </div>
            </form>
        }
    </p-dialog>
  `,
  styles: [`
    :host ::ng-deep .custom-timeline .p-timeline-event-content {
        line-height: 1;
    }
  `]
})
export class TicketDetailComponent {
    @Input() ticket: Ticket | null = null;
    @Input() visible = false;
    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() ticketDeleted = new EventEmitter<void>();

    private readonly ticketService = inject(TicketService);
    private readonly authService = inject(AuthPermissionService);
    private readonly groupService = inject(GroupService);
    private readonly fb = inject(FormBuilder);
    private readonly messageService = inject(MessageService);

    newComment = '';
    showEditDialog = false;
    ticketForm: FormGroup;
    priorities: TicketPriority[] = ['Muy Baja', 'Baja', 'Media', 'Alta', 'Muy Alta', 'Urgente', 'Crítica'];
    statuses: TicketStatus[] = ['Abierto', 'En Progreso', 'En Revisión', 'Cerrado'];
    
    groupOptions = computed(() => 
        this.groupService.groups().map(g => ({ label: g.nombre, value: g.nombre }))
    );

    userOptions = computed(() => 
        this.authService.users().map(u => ({ label: u.fullName, value: u.fullName }))
    );

    currentUser = this.authService.currentUser;

    constructor() {
        this.ticketForm = this.fb.group({
            titulo: ['', [Validators.required, Validators.minLength(5)]],
            descripcion: ['', Validators.required],
            prioridad: ['Media' as TicketPriority, Validators.required],
            estado: ['Abierto' as TicketStatus, Validators.required],
            grupo: ['', Validators.required],
            asignadoA: ['', Validators.required],
            fechaLimite: [null as Date | null]
        });
    }

    canEdit(): boolean {
        const user = this.currentUser();
        if (!user || !this.ticket) return false;
        // Superadmin can edit
        if (this.authService.hasPermission('ticket:edit_all')) return true;
        // Creator can edit
        if (user.id === this.ticket.creadorId) return true;
        // Assignee can edit (limited to status, but button is visible)
        if (user.fullName === this.ticket.asignadoA) return true;
        return false;
    }

    canEditFull(): boolean {
        const user = this.currentUser();
        if (!user || !this.ticket) return false;
        if (this.authService.hasPermission('ticket:edit_all')) return true;
        return user.id === this.ticket.creadorId;
    }

    canDelete(): boolean {
        const user = this.currentUser();
        if (!user || !this.ticket) return false;
        if (this.authService.hasPermission('ticket:edit_all')) return true;
        return user.id === this.ticket.creadorId;
    }

    onHide() {
        this.visibleChange.emit(false);
        this.newComment = '';
        this.showEditDialog = false;
    }

    openEdit() {
        if (this.ticket) {
            this.ticketForm.patchValue({
                titulo: this.ticket.titulo,
                descripcion: this.ticket.descripcion,
                prioridad: this.ticket.prioridad,
                estado: this.ticket.estado,
                grupo: this.ticket.grupo,
                asignadoA: this.ticket.asignadoA,
                fechaLimite: this.ticket.fechaLimite ? new Date(this.ticket.fechaLimite) : null
            });
            this.showEditDialog = true;
        }
    }

    onSubmit() {
        if (this.ticketForm.valid && this.ticket) {
            const val = this.ticketForm.value;
            const userName = this.currentUser()?.fullName || 'Usuario';
            
            // Explicitly separate full edit from partial edit
            const hasFullEdit = this.canEditFull();
            
            // Check for changes to log in history
            const changes: string[] = [];
            
            if (hasFullEdit) {
                if (val.titulo !== this.ticket.titulo) changes.push('cambió el título');
                if (val.prioridad !== this.ticket.prioridad) changes.push(`cambió la prioridad a ${val.prioridad}`);
                if (val.descripcion !== this.ticket.descripcion) changes.push('actualizó la descripción');
                if (val.asignadoA !== this.ticket.asignadoA) changes.push(`reasignó a ${val.asignadoA}`);
                if (val.grupo !== this.ticket.grupo) changes.push(`movió al grupo ${val.grupo}`);
            }
            
            if (val.estado !== this.ticket.estado) changes.push(`cambió el estado a ${val.estado}`);

            // Apply changes safely based on permissions
            if (hasFullEdit) {
                Object.assign(this.ticket, {
                    ...val,
                    fechaLimite: val.fechaLimite ? new Date(val.fechaLimite) : undefined
                });
            } else {
                // Assignee can ONLY change status
                this.ticket.estado = val.estado;
            }
            
            if (!this.ticket.historialCambios) this.ticket.historialCambios = [];
            
            const changeDesc = changes.length > 0 ? `Actualizó: ${changes.join(', ')}` : 'Actualizó detalles del ticket';
            
            this.ticket.historialCambios = [
              ...this.ticket.historialCambios,
              {
                  fecha: new Date(),
                  usuario: userName,
                  cambio: changeDesc
              }
            ];

            this.ticketService.updateTicket(this.ticket);
            this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Ticket actualizado correctamente' });
            this.showEditDialog = false;
        }
    }

    deleteTicket() {
      if (this.ticket && this.canDelete()) {
        this.ticketService.deleteTicket(this.ticket.id);
        this.messageService.add({ severity: 'info', summary: 'Eliminado', detail: 'Ticket eliminado definitivamente' });
        this.visible = false;
        this.onHide();
        this.ticketDeleted.emit();
      }
    }

    addComment() {
        if (this.ticket && this.newComment) {
            const userName = this.currentUser()?.fullName || 'Usuario';
            const comment = {
                autor: userName,
                texto: this.newComment,
                fecha: new Date()
            };
            
            const updatedTicket = { ...this.ticket };
            if (!updatedTicket.comentarios) updatedTicket.comentarios = [];
            updatedTicket.comentarios = [...updatedTicket.comentarios, comment];
            
            if (!updatedTicket.historialCambios) updatedTicket.historialCambios = [];
            updatedTicket.historialCambios = [
              ...updatedTicket.historialCambios,
              {
                  fecha: new Date(),
                  usuario: userName,
                  cambio: 'Agregó un comentario'
              }
            ];

            this.ticketService.updateTicket(updatedTicket);
            this.ticket = updatedTicket; // Update local reference for UI
            this.newComment = '';
        }
    }

    isOverdue() {
        if (!this.ticket?.fechaLimite) return false;
        return new Date() > new Date(this.ticket.fechaLimite);
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
}

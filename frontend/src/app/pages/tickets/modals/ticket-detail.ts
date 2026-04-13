import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  computed,
  signal,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TimelineModule } from 'primeng/timeline';
import { TextareaModule } from 'primeng/textarea';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup,
} from '@angular/forms';
import { Ticket, TicketStatus, TicketPriority } from '../../../models/ticket.model';
import { TicketService } from '../../../services/ticket.service';
import { AuthPermissionService } from '../../../services/auth-permission.service';
import { GroupService } from '../../../services/group.service';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService, ConfirmationService } from 'primeng/api';
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
    InputTextModule,
  ],
  template: `
    <p-dialog
      [(visible)]="visible"
      [header]="'#' + ticketSig()?.id + ' - ' + ticketSig()?.titulo"
      [modal]="true"
      [style]="{ width: '60vw' }"
      [breakpoints]="{ '960px': '75vw', '640px': '90vw' }"
      (onHide)="onHide()"
    >
      @if (ticketSig(); as t) {
        <div class="grid pt-3">
          <!-- Left Column: Details -->
          <div class="col-12 md:col-8 pr-4">
            <div class="mb-5">
              <h3 class="text-color font-bold mb-2 flex align-items-center">
                <i class="pi pi-align-left mr-2 text-primary"></i> Descripción
              </h3>
              <p class="text-color-secondary line-height-3 m-0 p-3 surface-section border-round">
                {{ t.descripcion }}
              </p>
            </div>

            <div class="mb-5">
              <h3 class="text-color font-bold mb-3 flex align-items-center">
                <i class="pi pi-comments mr-2 text-primary"></i> Comentarios
              </h3>
              <div class="flex flex-column gap-3 mb-4">
                @for (comm of t.comentarios || []; track $index) {
                  <div class="p-3 border-round surface-section">
                    <div class="flex justify-content-between mb-1">
                      <span class="font-bold text-color">{{ comm.autor }}</span>
                      <small class="text-color-secondary">{{ comm.fecha | date: 'short' }}</small>
                    </div>
                    <div class="text-color-secondary">{{ comm.texto }}</div>
                  </div>
                }
                @if (!t.comentarios?.length) {
                  <div class="text-color-secondary italic">No hay comentarios aún.</div>
                }
              </div>

              <div class="flex flex-column gap-2" *ngIf="canComment()">
                <textarea
                  pTextarea
                  [(ngModel)]="newComment"
                  rows="2"
                  placeholder="Escribe un comentario..."
                  class="w-full"
                ></textarea>
                <div class="flex justify-content-end">
                  <p-button
                    label="Enviar"
                    icon="pi pi-send"
                    size="small"
                    (click)="addComment()"
                    [disabled]="!newComment"
                  ></p-button>
                </div>
              </div>
              @if (!canComment()) {
                <div class="text-color-secondary italic p-2 surface-50 border-round">
                  No tienes permisos para comentar en este ticket.
                </div>
              }
            </div>

            <div>
              <h3 class="text-color font-bold mb-3 flex align-items-center">
                <i class="pi pi-history mr-2 text-primary"></i> Historial de Cambios
              </h3>
              <div class="pl-2">
                <p-timeline [value]="t.historialCambios || []" styleClass="w-full custom-timeline">
                  <ng-template pTemplate="content" let-item>
                    <div class="flex flex-column mb-3">
                      <span class="font-bold text-color">{{ item.cambio }}</span>
                      <small class="text-color-secondary"
                        >{{ item.usuario }} - {{ item.fecha | date: 'short' }}</small
                      >
                    </div>
                  </ng-template>
                </p-timeline>
              </div>
              @if (!t.historialCambios?.length) {
                <div class="text-color-secondary italic pl-5">Inicio del seguimiento.</div>
              }
            </div>
          </div>

          <!-- Right Column: Sidebar -->
          <div class="col-12 md:col-4 border-left-1 border-border pl-4 py-0">
            <div class="mb-4">
              <span
                class="block text-color-secondary font-medium mb-2 uppercase text-xs tracking-wider"
                >Estado</span
              >
              <p-tag
                [value]="t.estado"
                [severity]="getStatusSeverity(t.estado)"
                class="w-full"
              ></p-tag>
            </div>

            <div class="mb-4">
              <span
                class="block text-color-secondary font-medium mb-2 uppercase text-xs tracking-wider"
                >Prioridad</span
              >
              <p-tag
                [value]="t.prioridad"
                [severity]="getPrioritySeverity(t.prioridad)"
                [rounded]="true"
                class="w-full"
              ></p-tag>
            </div>

            <div class="mb-4">
              <span
                class="block text-color-secondary font-medium mb-1 uppercase text-xs tracking-wider"
                >Proyecto / Grupo</span
              >
              <div class="text-color font-bold">{{ t.grupo }}</div>
            </div>

            <div class="mb-4">
              <span
                class="block text-color-secondary font-medium mb-1 uppercase text-xs tracking-wider"
                >Asignado a</span
              >
              <div class="flex align-items-center gap-2">
                <div
                  class="w-2rem h-2rem border-circle bg-primary-100 flex align-items-center justify-content-center text-primary font-bold text-xs"
                >
                  {{ t.asignadoA.substring(0, 1) }}
                </div>
                <span class="text-color">{{ t.asignadoA }}</span>
              </div>
            </div>

            <div class="mb-4">
              <span
                class="block text-color-secondary font-medium mb-1 uppercase text-xs tracking-wider"
                >Fecha Creación</span
              >
              <div class="text-color">{{ t.fechaCreacion | date: 'dd/MM/yyyy HH:mm' }}</div>
            </div>

            <div class="mb-4">
              <div [class]="isOverdue() ? 'text-red-500 font-bold' : 'text-color'">
                {{ t.fechaLimite ? (t.fechaLimite | date: 'dd/MM/yyyy') : 'Sin definir' }}
              </div>
            </div>
          </div>
        </div>
      }

      <ng-template pTemplate="footer">
        <div class="flex justify-content-between w-full pt-3 border-top-1 surface-border" *ngIf="ticketSig()">
          <div>
            <p-button 
              *ngIf="canDelete()"
              label="Eliminar Ticket" 
              icon="pi pi-trash" 
              severity="danger" 
              [text]="true" 
              (click)="deleteTicket()"
            ></p-button>
          </div>
          <div class="flex gap-2">
            <p-button 
              *ngIf="canEdit()"
              label="Editar Ticket" 
              icon="pi pi-pencil" 
              (click)="openEdit()" 
              class="p-button-raised shadow-2"
            ></p-button>
          </div>
        </div>
      </ng-template>
    </p-dialog>

    <!-- Edit Dialog -->
    <p-dialog
      [(visible)]="showEditDialog"
      [header]="'Editar Ticket #' + ticketSig()?.id"
      [modal]="true"
      [style]="{ width: '450px' }"
      [breakpoints]="{ '960px': '75vw', '640px': '90vw' }"
      (onHide)="showEditDialog = false"
      appendTo="body"
    >
      @if (ticketForm) {
        <form [formGroup]="ticketForm" (ngSubmit)="onSubmit()" class="flex flex-column gap-3 mt-3">
          <div class="field flex flex-column gap-2" *ngIf="canEditFull()">
            <label for="titulo" class="font-bold text-color">Título del Ticket</label>
            <input pInputText id="titulo" formControlName="titulo" class="w-full" />
          </div>

          <div class="field flex flex-column gap-2" *ngIf="canEditFull()">
            <label for="descripcion" class="font-bold text-color">Descripción</label>
            <textarea
              pTextarea
              id="descripcion"
              formControlName="descripcion"
              rows="4"
              class="w-full"
            ></textarea>
          </div>

          <div class="grid">
            <div class="col-12 md:col-6 field flex flex-column gap-2" *ngIf="canEditFull()">
              <label for="prioridad" class="font-bold text-color">Prioridad</label>
              <p-select
                id="prioridad"
                [options]="priorities"
                formControlName="prioridad"
                class="w-full"
                appendTo="body"
              ></p-select>
            </div>
            <div class="col-12 md:col-6 field flex flex-column gap-2">
              <label for="estado" class="font-bold text-color">Estado</label>
              <p-select
                id="estado"
                [options]="statuses"
                formControlName="estado"
                class="w-full"
                appendTo="body"
              ></p-select>
            </div>
          </div>

          <div class="grid" *ngIf="canEditFull()">
            <div class="col-12 md:col-6 field flex flex-column gap-2">
              <label for="grupo" class="font-bold text-color">Grupo</label>
              <p-select
                id="grupo"
                [options]="groupOptions()"
                formControlName="grupo"
                optionLabel="label"
                optionValue="value"
                class="w-full"
                appendTo="body"
                (onChange)="onEditGroupChange($event.value)"
              ></p-select>
            </div>
            <div class="col-12 md:col-6 field flex flex-column gap-2">
              <label for="fechaLimite" class="font-bold text-color">Fecha Límite</label>
              <p-datepicker
                id="fechaLimite"
                formControlName="fechaLimite"
                [showIcon]="true"
                appendTo="body"
                class="w-full"
              ></p-datepicker>
            </div>
          </div>

          <div class="field flex flex-column gap-2" *ngIf="canEditFull()">
            <label for="asignadoA" class="font-bold text-color">Asignado a</label>
            <p-select
              id="asignadoA"
              [options]="editMemberOptions()"
              [showClear]="true"
              formControlName="asignadoA"
              optionLabel="label"
              optionValue="value"
              class="w-full"
              appendTo="body"
            ></p-select>
          </div>

          <div class="flex justify-content-end gap-2 mt-4 pt-3 border-top-1 surface-border">
            <p-button
              label="Cancelar"
              icon="pi pi-times"
              (click)="showEditDialog = false"
              severity="secondary"
              [text]="true"
            ></p-button>
            <p-button
              label="Guardar"
              icon="pi pi-check"
              type="submit"
              [disabled]="ticketForm.invalid"
              class="p-button-raised"
            ></p-button>
          </div>
        </form>
      }
    </p-dialog>
  `,
  styles: [
    `
      :host ::ng-deep .custom-timeline .p-timeline-event-content {
        line-height: 1;
      }
    `,
  ],
})
export class TicketDetailComponent implements OnChanges {
  @Input() ticket: Ticket | null = null;
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() ticketDeleted = new EventEmitter<void>();
  @Output() ticketUpdated = new EventEmitter<void>();

  // Internal Signal for proper Angular change detection
  readonly ticketSig = signal<Ticket | null>(null);

  private readonly ticketService = inject(TicketService);
  private readonly authService = inject(AuthPermissionService);
  private readonly groupService = inject(GroupService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  newComment = '';
  showEditDialog = false;
  ticketForm: FormGroup;
  priorities: TicketPriority[] = ['Alta', 'Media', 'Baja'];
  statuses: TicketStatus[] = ['Abierto', 'En Progreso', 'En Revisión', 'Cerrado'];

  groupOptions = computed(() =>
    this.groupService.groups().map((g) => ({ label: g.nombre, value: g.id })),
  );

  // For the edit dialog — members of the group selected in the edit form
  private readonly editGroupId = signal<number | null>(null);

  editMemberOptions = computed(() => {
    const groupId = this.editGroupId();
    if (!groupId) return [];
    return this.groupService.getMembersForGroup(groupId).map((m) => ({
      label: m.nombre_completo,
      value: m.id,
    }));
  });

  currentUser = this.authService.currentUser;

  constructor() {
    this.ticketForm = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(5)]],
      descripcion: ['', Validators.required],
      prioridad: ['Media' as TicketPriority, Validators.required],
      estado: ['Abierto' as TicketStatus, Validators.required],
      grupo: [null as number | null, Validators.required],
      asignadoA: [null as number | null],
      fechaLimite: [null as Date | null],
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['ticket'] && this.ticket) {
      this.ticketSig.set(this.ticket);
      this.loadFullDetails(this.ticket.id);
    }
  }

  loadFullDetails(id: number) {
    this.ticketService.getTicketById(id).subscribe({
      next: (fullTicket) => {
        this.ticketSig.set(fullTicket);
      },
      error: (err) => {
        console.error('Error loading full ticket details:', err);
      }
    });
  }

  canEdit(): boolean {
    const user = this.currentUser();
    const t = this.ticketSig();
    if (!user || !t) return false;

    // Admins (Global o Grupo)
    if (this.authService.hasPermissionForGroup('tickets:edit', t.grupoId || null)) return true;

    // Dueño o Asignado
    if (String(user.id) === t.creadorId) return true;
    if (user.id === t.asignadoAId) return true;

    return false;
  }

  canEditFull(): boolean {
    const user = this.currentUser();
    const t = this.ticketSig();
    if (!user || !t) return false;

    // Admins (Global o Grupo)
    if (this.authService.hasPermissionForGroup('tickets:edit', t.grupoId || null)) return true;

    // Solo el Creador puede editar todo (Título, desc, etc.)
    return String(user.id) === t.creadorId;
  }

  canDelete(): boolean {
    const user = this.currentUser();
    const t = this.ticketSig();
    if (!user || !t) return false;

    // Admins (Global o Grupo)
    if (this.authService.hasPermissionForGroup('tickets:delete', t.grupoId || null)) return true;

    // Solo el Creador puede borrar su propio ticket
    return String(user.id) === t.creadorId;
  }

  canComment(): boolean {
    const user = this.currentUser();
    const t = this.ticketSig();
    if (!user || !t) return false;

    // Admins (Global o Grupo)
    if (this.authService.hasPermissionForGroup('tickets:comment', t.grupoId || null)) return true;

    // Dueño o Asignado
    return String(user.id) === t.creadorId || user.id === t.asignadoAId;
  }

  onHide() {
    this.visibleChange.emit(false);
    this.newComment = '';
    this.showEditDialog = false;
  }

  private mapPriorityToId(priority: string): number {
    switch (priority) {
      case 'Alta':
        return 3;
      case 'Media':
        return 1;
      case 'Baja':
        return 2;
      default:
        return 1;
    }
  }

  private mapStatusToId(status: string): number {
    switch (status) {
      case 'Abierto':
        return 1;
      case 'En Progreso':
        return 2;
      case 'En Revisión':
        return 3;
      case 'Cerrado':
        return 4;
      default:
        return 1;
    }
  }

  onEditGroupChange(groupId: number | null) {
    this.editGroupId.set(groupId);
    this.ticketForm.patchValue({ asignadoA: null });
    if (groupId) {
      const cached = this.groupService.getMembersForGroup(groupId);
      if (cached.length === 0) {
        this.groupService.getGroupDetails(groupId).subscribe();
      }
    }
  }

  openEdit() {
    const t = this.ticketSig();
    if (t) {
      this.openEditDirectly(t);
    }
  }

  openEditDirectly(ticket: Ticket) {
    this.ticketSig.set(ticket);
    this.editGroupId.set(ticket.grupoId || null);

        // Pre-load group members ONLY if we have full edit permissions (needed for assignee dropdown)
    if (this.canEditFull() && ticket.grupoId) {
      const cached = this.groupService.getMembersForGroup(ticket.grupoId);
      if (cached.length === 0) {
        this.groupService.getGroupDetails(ticket.grupoId).subscribe();
      }
    }

    this.ticketForm.patchValue({
      titulo: ticket.titulo,
      descripcion: ticket.descripcion,
      prioridad: ticket.prioridad,
      estado: ticket.estado,
      grupo: ticket.grupoId,
      asignadoA: ticket.asignadoAId,
      fechaLimite: ticket.fechaLimite ? new Date(ticket.fechaLimite) : null,
    });
    this.showEditDialog = true;
  }

  onSubmit() {
    const t = this.ticketSig();
    if (this.ticketForm.valid && t) {
      const val = this.ticketForm.value;
      const hasFullEdit = this.canEditFull();
      const user = this.currentUser();

      const payload: any = {};

      if (hasFullEdit) {
        payload.titulo = val.titulo;
        payload.descripcion = val.descripcion;
        payload.grupo_id = val.grupo;
        payload.prioridad_id = this.mapPriorityToId(val.prioridad);
        payload.estado_id = this.mapStatusToId(val.estado);
        payload.asignado_id = val.asignadoA || null;
        payload.usuario_id = user?.id;
        payload.fecha_final = val.fechaLimite ? new Date(val.fechaLimite).toISOString() : null;
      } else {
        payload.estado_id = this.mapStatusToId(val.estado);
        payload.usuario_id = user?.id;
      }

      this.ticketService.updateTicket(t.id, payload).subscribe({
        next: () => {
          // Después de actualizar, pedimos el objeto COMPLETO con relaciones para evitar info vacía
          this.ticketService.getTicketById(t.id).subscribe({
            next: (fullTicket) => {
              this.ticketSig.set(fullTicket);
              this.messageService.add({
                severity: 'success',
                summary: 'Actualizado',
                detail: 'Ticket actualizado correctamente',
              });
              this.showEditDialog = false;
              this.ticketUpdated.emit();
            }
          });
        },
        error: (err) => {
          console.error('Error al actualizar ticket:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo actualizar el ticket',
          });
        },
      });
    }
  }

  deleteTicket() {
    const t = this.ticketSig();
    if (t) {
      this.deleteTicketDirectly(t);
    }
  }

  deleteTicketDirectly(ticket: Ticket) {
    this.confirmationService.confirm({
      message: `¿Estás seguro de que deseas eliminar el ticket #${ticket.id}? Esta acción no se puede deshacer.`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      rejectButtonStyleClass: 'p-button-text',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.ticketService.deleteTicket(ticket.id).subscribe({
          next: (success) => {
            if (success) {
              this.messageService.add({
                severity: 'info',
                summary: 'Eliminado',
                detail: 'Ticket eliminado definitivamente',
              });
              this.visible = false;
              this.showEditDialog = false; // Hide edit dialog if it was open
              this.onHide();
              this.ticketDeleted.emit();
            }
          },
        });
      },
    });
  }

  addComment() {
    const t = this.ticketSig();
    if (t && this.newComment) {
      const user = this.currentUser();
      if (!user) return;

      const commentText = this.newComment;

      this.ticketService.addComment(t.id, commentText, user.id).subscribe({
        next: () => {
          const newCommentObj = {
            autor: user.nombre_completo,
            texto: commentText,
            fecha: new Date(),
          };

          const historyEntry = {
            fecha: new Date(),
            usuario: user.nombre_completo,
            cambio: 'Agregó un comentario',
          };

          // Update the signal fully — this triggers Angular change detection
          this.ticketSig.update((current) => ({
            ...current!,
            comentarios: [...(current!.comentarios || []), newCommentObj],
            historialCambios: [...(current!.historialCambios || []), historyEntry],
          }));

          this.newComment = '';
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Comentario agregado',
          });
        },
        error: (err) => {
          console.error('Error al agregar comentario:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo guardar el comentario',
          });
        },
      });
    }
  }

  isOverdue() {
    const t = this.ticketSig();
    if (!t?.fechaLimite) return false;
    return new Date() > new Date(t.fechaLimite);
  }

  getStatusSeverity(
    status: string,
  ): 'info' | 'success' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    switch (status) {
      case 'Abierto':
        return 'info';
      case 'En Progreso':
        return 'warn';
      case 'En Revisión':
        return 'secondary';
      case 'Cerrado':
        return 'success';
      default:
        return 'info';
    }
  }

  getPrioritySeverity(
    priority: string,
  ): 'info' | 'success' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    switch (priority) {
      case 'Baja':
        return 'info';
      case 'Media':
        return 'info';
      case 'Alta':
        return 'warn';
      default:
        return 'info';
    }
  }
}

import { Component, Output, EventEmitter, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TicketPriority } from '../../../models/ticket.model';
import { TicketService } from '../../../services/ticket.service';
import { GroupService } from '../../../services/group.service';
import { MessageService } from 'primeng/api';
import { AuthPermissionService } from '../../../services/auth-permission.service';
import { UserManagementService } from '../../../services/user-management.service';

@Component({
  selector: 'app-ticket-create',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    DialogModule, 
    ButtonModule, 
    InputTextModule, 
    TextareaModule, 
    SelectModule, 
    DatePickerModule
  ],
  template: `
    <p-dialog [(visible)]="visible" header="Crear Nuevo Ticket" [modal]="true" 
              [style]="{width: '450px'}" [breakpoints]="{'960px': '75vw', '640px': '90vw'}" 
              (onHide)="onHide()" class="ticket-create-dialog">
        
        <form [formGroup]="ticketForm" (ngSubmit)="onSubmit()" class="flex flex-column gap-3 mt-3">
            <div class="field flex flex-column gap-2">
                <label for="titulo" class="font-bold text-color">Título del Ticket</label>
                <input pInputText id="titulo" formControlName="titulo" placeholder="Ej: Error en pasarela de pagos" class="w-full" />
                @if (ticketForm.get('titulo')?.invalid && ticketForm.get('titulo')?.touched) {
                    <small class="text-red-500">
                        El título es obligatorio (mín. 5 caracteres).
                    </small>
                }
            </div>

            <div class="field flex flex-column gap-2">
                <label for="descripcion" class="font-bold text-color">Descripción detallada</label>
                <textarea pTextarea id="descripcion" formControlName="descripcion" rows="4" placeholder="Explica el problema o tarea..." class="w-full"></textarea>
            </div>

            <div class="grid">
                <div class="col-12 md:col-6 field flex flex-column gap-2">
                    <label for="prioridad" class="font-bold text-color">Prioridad</label>
                    <p-select id="prioridad" [options]="priorityOptions" formControlName="prioridad" optionLabel="label" optionValue="value" placeholder="Seleccionar" class="w-full" appendTo="body"></p-select>
                </div>
                <div class="col-12 md:col-6 field flex flex-column gap-2">
                    <label for="grupo" class="font-bold text-color">Proyecto / Grupo</label>
                    <p-select id="grupo" [options]="groupOptions()" formControlName="grupo" optionLabel="label" optionValue="value" 
                              placeholder="Seleccionar" class="w-full" appendTo="body"
                              (onChange)="onGroupChange($event.value)"></p-select>
                    @if (ticketForm.get('grupo')?.invalid && ticketForm.get('grupo')?.touched) {
                        <small class="text-red-500">Debe elegir un grupo existente.</small>
                    }
                </div>
            </div>

            <div class="grid">
                <div class="col-12 md:col-6 field flex flex-column gap-2">
                    <label for="asignadoA" class="font-bold text-color">Asignar a (Opcional)</label>
                    <p-select id="asignadoA" [showClear]="true" [options]="memberOptions()" formControlName="asignadoA" 
                              optionLabel="label" optionValue="value" 
                              [placeholder]="ticketForm.get('grupo')?.value ? 'Seleccionar miembro' : 'Primero selecciona un grupo'" 
                              class="w-full" appendTo="body"
                              [disabled]="!ticketForm.get('grupo')?.value"></p-select>
                </div>
                <div class="col-12 md:col-6 field flex flex-column gap-2">
                    <label for="fechaLimite" class="font-bold text-color">Fecha Límite (Opcional)</label>
                    <p-datepicker id="fechaLimite" formControlName="fechaLimite" [showIcon]="true" appendTo="body" class="w-full"></p-datepicker>
                </div>
            </div>

            <div class="flex justify-content-end gap-2 mt-4 pt-3 border-top-1 surface-border">
                <p-button label="Cancelar" icon="pi pi-times" (click)="visible = false" severity="secondary" [text]="true"></p-button>
                <p-button label="Crear Ticket" icon="pi pi-check" type="submit" [disabled]="ticketForm.invalid" class="p-button-raised"></p-button>
            </div>
        </form>
    </p-dialog>
  `,
  styles: [`
    :host ::ng-deep .p-datepicker {
        width: 100%;
    }
  `]
})
export class TicketCreateComponent {
    visible = false;
    private readonly fb = inject(FormBuilder);
    private readonly ticketService = inject(TicketService);
    private readonly groupService = inject(GroupService);
    private readonly authService = inject(AuthPermissionService);
    private readonly messageService = inject(MessageService);

    // Selected group's members for the assignee dropdown
    private readonly selectedGroupId = signal<number | null>(null);

    priorityOptions = [
      { label: 'Alta', value: 'Alta' },
      { label: 'Media', value: 'Media' },
      { label: 'Baja', value: 'Baja' }
    ];
    
    groupOptions = computed(() => 
        this.groupService.groups().map(g => ({ label: g.nombre, value: g.id }))
    );

    // Only show members of the selected group
    memberOptions = computed(() => {
        const groupId = this.selectedGroupId();
        if (!groupId) return [];
        return this.groupService.getMembersForGroup(groupId).map(m => ({
            label: m.nombre_completo,
            value: m.id
        }));
    });

    ticketForm = this.fb.group({
        titulo: ['', [Validators.required, Validators.minLength(5)]],
        descripcion: ['', Validators.required],
        prioridad: ['Media' as TicketPriority, Validators.required],
        grupo: [null as number | null, Validators.required],
        asignadoA: [null as number | null],
        fechaLimite: [null as Date | null]
    });

    @Output() ticketCreated = new EventEmitter<void>();

    onHide() {
        this.ticketForm.reset({
            prioridad: 'Media' as TicketPriority,
            grupo: null,
            asignadoA: null
        });
        this.selectedGroupId.set(null);
    }

    show() {
        this.visible = true;
    }

    onGroupChange(groupId: number | null) {
        this.selectedGroupId.set(groupId);
        this.ticketForm.patchValue({ asignadoA: null });

        if (groupId) {
            // Load group members if not already cached
            const cached = this.groupService.getMembersForGroup(groupId);
            if (cached.length === 0) {
                this.groupService.getGroupDetails(groupId).subscribe();
            }
        }
    }

    private mapPriorityToId(priority: string): number {
        switch (priority) {
            case 'Alta': return 3;
            case 'Media': return 1;
            case 'Baja': return 2;
            default: return 1;
        }
    }

    onSubmit() {
        if (this.ticketForm.valid) {
            const formValue = this.ticketForm.value;
            const user = this.authService.currentUser();
            
            const dto = {
                titulo: formValue.titulo,
                descripcion: formValue.descripcion,
                grupo_id: formValue.grupo,
                estado_id: 1, // Abierto
                prioridad_id: this.mapPriorityToId(formValue.prioridad as string),
                asignado_id: formValue.asignadoA || null,
                autor_id: user?.id,
                fecha_final: formValue.fechaLimite ? new Date(formValue.fechaLimite).toISOString() : null
            };

            this.ticketService.addTicket(dto).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Ticket creado correctamente' });
                    this.visible = false;
                    this.onHide();
                    this.ticketCreated.emit();
                },
                error: (err) => {
                    console.error('Error al crear ticket:', err);
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el ticket' });
                }
            });
        }
    }
}

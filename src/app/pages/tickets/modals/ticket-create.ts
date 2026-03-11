import { Component, Output, EventEmitter, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TicketPriority, Ticket } from '../../../models/ticket.model';
import { TicketService } from '../../../services/ticket.service';
import { GroupService } from '../../../services/group.service';
import { MessageService } from 'primeng/api';
import { AuthPermissionService } from '../../../services/auth-permission.service';

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
                    <p-select id="prioridad" [options]="priorities" formControlName="prioridad" placeholder="Seleccionar" class="w-full" appendTo="body"></p-select>
                </div>
                <div class="col-12 md:col-6 field flex flex-column gap-2">
                    <label for="grupo" class="font-bold text-color">Proyecto / Grupo</label>
                    <p-select id="grupo" [options]="groupOptions()" formControlName="grupo" optionLabel="label" optionValue="value" placeholder="Seleccionar" class="w-full" appendTo="body"></p-select>
                    @if (ticketForm.get('grupo')?.invalid && ticketForm.get('grupo')?.touched) {
                        <small class="text-red-500">Debe elegir un grupo existente.</small>
                    }
                </div>
            </div>

            <div class="grid">
                <div class="col-12 md:col-6 field flex flex-column gap-2">
                    <label for="asignadoA" class="font-bold text-color">Asignar a</label>
                    <p-select id="asignadoA" [options]="userOptions()" formControlName="asignadoA" optionLabel="label" optionValue="value" placeholder="Seleccionar usuario" class="w-full" appendTo="body"></p-select>
                    @if (ticketForm.get('asignadoA')?.invalid && ticketForm.get('asignadoA')?.touched) {
                        <small class="text-red-500">Debe asignar el ticket a un usuario.</small>
                    }
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

    priorities: TicketPriority[] = ['Muy Baja', 'Baja', 'Media', 'Alta', 'Muy Alta', 'Urgente', 'Crítica'];
    
    groupOptions = computed(() => 
        this.groupService.groups().map(g => ({ label: g.nombre, value: g.nombre }))
    );

    userOptions = computed(() => 
        this.authService.users().map(u => ({ label: u.fullName, value: u.fullName }))
    );

    ticketForm = this.fb.group({
        titulo: ['', [Validators.required, Validators.minLength(5)]],
        descripcion: ['', Validators.required],
        prioridad: ['Media' as TicketPriority, Validators.required],
        grupo: ['', Validators.required],
        asignadoA: ['', Validators.required],
        fechaLimite: [null as Date | null]
    });

    @Output() ticketCreated = new EventEmitter<void>();

    onHide() {
        this.ticketForm.reset({
            prioridad: 'Media' as TicketPriority,
            grupo: '',
            asignadoA: ''
        });
    }

    show() {
        this.visible = true;
    }

    onSubmit() {
        if (this.ticketForm.valid) {
            const formValue = this.ticketForm.value;
            const user = this.authService.currentUser();
            const newTicket: Ticket = {
                id: 0,
                titulo: formValue.titulo!,
                descripcion: formValue.descripcion!,
                prioridad: formValue.prioridad as TicketPriority,
                grupo: formValue.grupo!,
                asignadoA: formValue.asignadoA!,
                creadorId: user?.id || 'anonymous',
                fechaLimite: formValue.fechaLimite ? new Date(formValue.fechaLimite) : undefined,
                estado: 'Abierto',
                fechaCreacion: new Date(),
                comentarios: [],
                historialCambios: [{
                    fecha: new Date(),
                    usuario: user?.fullName || 'Sistema',
                    cambio: 'Ticket Creado'
                }]
            };
            this.ticketService.addTicket(newTicket);
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Ticket creado correctamente' });
            this.visible = false;
            this.ticketCreated.emit();
        }
    }
}

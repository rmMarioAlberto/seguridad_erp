import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { User, Permission } from '../../models/user.model';
import { AuthPermissionService } from '../../services/auth-permission.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    MultiSelectModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <div class="p-4 surface-card shadow-1 border-round-xl">
      <div class="flex justify-content-between align-items-center mb-4">
        <h2 class="text-3xl font-bold m-0 text-color">Gestión de Usuarios</h2>
        <p-button label="Nuevo Usuario" icon="pi pi-user-plus" (click)="openNew()"></p-button>
      </div>

      <p-table [value]="users()" [rows]="10" [paginator]="true" responsiveLayout="scroll">
        <ng-template pTemplate="header">
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Permisos</th>
            <th style="width: 15rem">Acciones</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-user>
          <tr>
            <td>{{ user.fullName }}</td>
            <td>{{ user.email }}</td>
            <td>{{ user.role }}</td>
            <td>
              <div class="flex flex-wrap gap-1">
                <span *ngFor="let p of getPermissionKeys(user.permissions)" class="p-1 px-2 border-round bg-primary-reverse text-xs">
                  {{ p }}
                </span>
              </div>
            </td>
            <td>
              <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="info" (click)="editUser(user)"></p-button>
              <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" (click)="deleteUser(user)"></p-button>
            </td>
          </tr>
        </ng-template>
      </p-table>

      <p-dialog [(visible)]="userDialog" [header]="editingUser?.id ? 'Editar Usuario' : 'Nuevo Usuario'" 
                [modal]="true" class="p-fluid" [style]="{width: '500px'}" [breakpoints]="{'960px': '75vw', '640px': '90vw'}"
                appendTo="body">
        <ng-template pTemplate="content">
          <form [formGroup]="userForm" class="flex flex-column gap-3">
            <div class="field">
              <label for="fullName" class="font-bold">Nombre Completo</label>
              <input type="text" pInputText id="fullName" formControlName="fullName" autofocus />
              <small class="p-error block" *ngIf="userForm.get('fullName')?.invalid && userForm.get('fullName')?.touched">
                El nombre es requerido (mín. 3 caracteres).
              </small>
            </div>
            
            <div class="field">
              <label for="email" class="font-bold">Email</label>
              <input type="email" pInputText id="email" formControlName="email" />
              <small class="p-error block" *ngIf="userForm.get('email')?.invalid && userForm.get('email')?.touched">
                Ingrese un email válido.
              </small>
            </div>
            
            <div class="field">
              <label for="role" class="font-bold">Rol</label>
              <input type="text" pInputText id="role" formControlName="role" />
            </div>
            
            <div class="field">
              <label for="permissions" class="font-bold">Permisos</label>
              <p-multiselect [options]="permissionOptions" formControlName="permissions" 
                            optionLabel="label" optionValue="value" placeholder="Seleccionar Permisos"
                            display="chip" appendTo="body"></p-multiselect>
            </div>
          </form>
        </ng-template>

        <ng-template pTemplate="footer">
          <p-button label="Cancelar" icon="pi pi-times" [text]="true" (click)="hideDialog()"></p-button>
          <p-button label="Guardar" icon="pi pi-check" (click)="saveUser()" [disabled]="userForm.invalid"></p-button>
        </ng-template>
      </p-dialog>

      <p-toast></p-toast>
    </div>
  `,
  styles: [`
    :host ::ng-deep .p-dialog-content {
        overflow-y: visible !important;
    }
  `]
})
export class UserManagementComponent implements OnInit {
  private readonly messageService = inject(MessageService);
  private readonly authService = inject(AuthPermissionService);
  private readonly fb = inject(FormBuilder);

  users = this.authService.users;
  editingUser: User | null = null;
  userDialog = false;
  userForm: FormGroup;

  permissionOptions = [
    { label: 'Gestionar Usuarios (SuperAdmin)', value: 'user:crud' },
    { label: 'Crear Grupos', value: 'group:add' },
    { label: 'Editar Grupos', value: 'group:edit' },
    { label: 'Eliminar Grupos', value: 'group:delete' },
    { label: 'Crear Tickets', value: 'ticket:create' },
    { label: 'Editar Todos los Tickets', value: 'ticket:edit_all' },
    { label: 'Eliminar Tickets', value: 'ticket:delete' },
    { label: 'Ver Perfil Propio', value: 'profile:view' }
  ];

  constructor() {
    this.userForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      role: ['User', Validators.required],
      permissions: [[] as Permission[]]
    });
  }

  ngOnInit() {
    // No need to set initial data, handled by Service
  }

  openNew() {
    this.editingUser = null;
    this.userForm.reset({
      role: 'User',
      permissions: []
    });
    this.userDialog = true;
  }

  editUser(user: User) {
    this.editingUser = { ...user };
    this.userForm.patchValue({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      permissions: Object.keys(user.permissions).filter(k => user.permissions[k as Permission])
    });
    this.userDialog = true;
  }

  deleteUser(user: User) {
    const updated = this.users().filter(u => u.id !== user.id);
    this.authService.updateUsers(updated);
    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario eliminado' });
  }

  hideDialog() {
    this.userDialog = false;
  }

  saveUser() {
    if (this.userForm.valid) {
      const formVal = this.userForm.value;
      const permissionsArr = formVal.permissions as Permission[];
      const permissionsObj = permissionsArr.reduce((acc, p) => ({ ...acc, [p]: true }), {} as Record<Permission, boolean>);
      
      if (this.editingUser?.id) {
        const updatedUser: User = {
          ...this.editingUser,
          ...formVal,
          permissions: permissionsObj
        };
        const updated = this.users().map(u => u.id === updatedUser.id ? updatedUser : u);
        this.authService.updateUsers(updated);
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario actualizado' });
      } else {
        const newUser: User = {
          id: Math.random().toString(36).substring(2, 11),
          username: formVal.fullName.toLowerCase().replace(/\s+/g, ''),
          groups: [],
          ...formVal,
          permissions: permissionsObj
        };
        const updated = [...this.users(), newUser];
        this.authService.updateUsers(updated);
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario creado' });
      }
      this.userDialog = false;
      this.editingUser = null;
    } else {
      this.userForm.markAllAsTouched();
    }
  }

  getPermissionKeys(permissions: Record<Permission, boolean>): string[] {
    return Object.keys(permissions).filter(k => permissions[k as Permission]);
  }
}

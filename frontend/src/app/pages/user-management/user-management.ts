import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { UserManagementService, UserResponse, GlobalPermission } from '../../services/user-management.service';
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
    ToastModule,
    TagModule,
    IconFieldModule,
    InputIconModule,
    CheckboxModule,
    DatePickerModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './user-management.html',
  styleUrl: './user-management.css',
})
export class UserManagementComponent implements OnInit {
  private readonly messageService = inject(MessageService);
  private readonly userService = inject(UserManagementService);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly authService = inject(AuthPermissionService);

  readonly canCreate = computed(() => this.authService.hasPermission('users:create'));
  readonly canEdit = computed(() => this.authService.hasPermission('users:edit'));
  readonly canDelete = computed(() => this.authService.hasPermission('users:delete'));

  users = this.userService.users;
  editingUser: UserResponse | null = null;
  userDialog = false;
  userForm: FormGroup;

  availablePermissions: GlobalPermission[] = [];

  constructor() {
    this.userForm = this.fb.group({
      nombre_completo: ['', [Validators.required, Validators.minLength(3)]],
      username: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      direccion: ['', [Validators.required]],
      fecha_inicio: [null, [Validators.required, UserManagementComponent.adultAge()]],
      permisos_globales: [[]]
    });
  }

  static strongPassword(): any {
    return (control: any): any => {
      const value = control.value;
      if (!value) return null;
      const hasMinLength = value.length >= 10;
      const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(value);
      return !(hasMinLength && hasSpecial) ? { strongPassword: true } : null;
    };
  }

  static adultAge(): any {
    return (control: any): any => {
      const value = control.value;
      if (!value) return null;
      const dob = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      return age < 18 ? { underage: true } : null;
    };
  }

  ngOnInit() {
    this.userService.loadUsers().subscribe();
    this.userService.loadPermissionsCatalog().subscribe(permissions => {
      this.availablePermissions = permissions;
    });
  }

  openNew() {
    this.editingUser = null;
    this.userForm.reset({
      permisos_globales: []
    });
    this.userDialog = true;
  }

  editUser(user: UserResponse) {
    this.editingUser = { ...user };
    this.userForm.patchValue({
      nombre_completo: user.nombre_completo,
      username: user.username,
      email: user.email,
      telefono: user.telefono || '',
      direccion: user.direccion || '',
      fecha_inicio: user.fecha_inicio ? new Date(user.fecha_inicio) : null,
      permisos_globales: [...(user.permisos_globales || [])]
    });
    this.sortPermissions();
    this.userDialog = true;
  }

  togglePermission(id: number) {
    const current = this.userForm.get('permisos_globales')?.value as number[];
    if (current.includes(id)) {
      this.userForm.patchValue({
        permisos_globales: current.filter(pid => pid !== id)
      });
    } else {
      this.userForm.patchValue({
        permisos_globales: [...current, id]
      });
    }
    this.sortPermissions();
  }

  isPermissionSelected(id: number): boolean {
    const current = this.userForm.get('permisos_globales')?.value as number[];
    return current.includes(id);
  }

  private sortPermissions() {
    const selected = this.userForm.get('permisos_globales')?.value as number[];
    this.availablePermissions.sort((a, b) => {
      const aSel = selected.includes(a.id);
      const bSel = selected.includes(b.id);
      if (aSel && !bSel) return -1;
      if (!aSel && bSel) return 1;
      return a.id - b.id;
    });
  }

  deleteUser(user: UserResponse) {
    this.confirmationService.confirm({
      message: `¿Estás seguro de que deseas eliminar a ${user.nombre_completo}?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      rejectButtonStyleClass: 'p-button-text',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.userService.deleteUser(user.id).subscribe({
          next: (success) => {
            if (success) {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario eliminado' });
            }
          }
        });
      }
    });
  }

  hideDialog() {
    this.userDialog = false;
  }

  saveUser() {
    if (this.userForm.valid) {
      const formVal = this.userForm.value;
      
      if (this.editingUser?.id) {
        this.userService.updateUser(this.editingUser.id, formVal).subscribe({
          next: () => {
              this.userDialog = false;
              // Si nos editamos a nosotros mismos, los cambios se verán al recargar
              if (this.editingUser?.id === this.authService.currentUser()?.id) {
                // No facemos nada especial por ahora para evitar problemas de sincronía
              }
          }
        });
      } else {
        // Asignar contraseña por defecto bebeto123:V
        const payload = { ...formVal, password: 'bebeto123:V' };
        this.userService.createUser(payload).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario creado' });
            this.userDialog = false;
          }
        });
      }
    } else {
      this.userForm.markAllAsTouched();
    }
  }
}

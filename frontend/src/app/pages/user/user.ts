import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Router } from '@angular/router';
import { AuthPermissionService } from '../../services/auth-permission.service';
import { UserManagementService } from '../../services/user-management.service';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule,
  ],
  templateUrl: './user.html',
  styleUrl: './user.css',
})
export class UserComponent implements OnInit {
  private readonly authService = inject(AuthPermissionService);
  private readonly userManagementService = inject(UserManagementService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly router = inject(Router);

  currentUser = this.authService.currentUser;
  
  user: any = {
    fullName: '',
    username: '',
    email: '',
    role: '',
    phone: '',
    address: '',
    dob: ''
  };

  canEdit: boolean = false;
  canDelete: boolean = false;
  editMode: boolean = false;
  clonedUser: any = {};

  get userId() {
    return this.currentUser()?.id;
  }

  ngOnInit() {
    const session = this.currentUser();
    if (!session || !this.authService.hasPermission('profile:view')) {
      this.router.navigate(['/home']);
      return;
    }

    this.canEdit = this.authService.hasPermission('profile:edit');
    this.canDelete = this.authService.hasPermission('profile:delete');

    // Cargar datos iniciales básicos
    this.user = {
      fullName: session.nombre_completo,
      username: session.username,
      email: session.email,
      role: this.authService.hasPermission('users:manage') ? 'Administrador' : 'Usuario',
      phone: 'Cargando...',
      address: 'Cargando...',
      dob: 'Cargando...'
    };

    // Cargar perfil completo si tenemos ID
    if (session.id) {
      this.userManagementService.getUser(session.id).subscribe({
        next: (fullUser) => {
          this.user = {
            fullName: fullUser.nombre_completo,
            username: fullUser.username,
            email: fullUser.email,
            role: this.authService.hasPermission('users:manage') ? 'Administrador' : 'Usuario',
            phone: fullUser.telefono || '',
            address: fullUser.direccion || '',
            dob: fullUser.fecha_inicio || ''
          };
          this.clonedUser = { ...this.user };
        }
      });
    }

    this.clonedUser = { ...this.user };
  }

  toggleEdit() {
    if (!this.canEdit) return;
    this.editMode = !this.editMode;
    // Siempre refrescar clonedUser al entrar o salir para asegurar consistencia
    this.clonedUser = { ...this.user };
  }

  saveProfile() {
    if (!this.userId) return;

    const updateData = {
      nombre_completo: this.clonedUser.fullName,
      username: this.clonedUser.username,
      email: this.clonedUser.email,
      telefono: this.clonedUser.phone || null,
      direccion: this.clonedUser.address || null
    };

    this.userManagementService.updateUser(this.userId, updateData).subscribe({
      next: (updated) => {
        this.user = {
          ...this.user,
          fullName: updated.nombre_completo,
          username: updated.username,
          email: updated.email,
          phone: updated.telefono || '',
          address: updated.direccion || ''
        };
        
        // Actualizar sesión global localmente para sincronizar datos básicos
        this.authService.updateCurrentUser(updateData);

        this.editMode = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Perfil actualizado correctamente',
        });
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el perfil',
        });
      }
    });
  }

  deleteProfile() {
    const id = this.userId;
    if (!id) return;

    this.confirmationService.confirm({
      message: '¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer y perderás el acceso al sistema.',
      header: 'Confirmar eliminación absoluta',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.userManagementService.deleteUser(id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Cuenta eliminada',
              detail: 'Tu cuenta ha sido eliminada correctamente. Redirigiendo...',
            });
            
            setTimeout(() => {
              this.authService.logout();
            }, 1500);
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar la cuenta',
            });
          }
        });
      },
    });
  }
}


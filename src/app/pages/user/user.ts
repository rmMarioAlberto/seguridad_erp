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
  providers: [MessageService, ConfirmationService],
  templateUrl: './user.html',
  styleUrl: './user.css',
})
export class UserComponent implements OnInit {
  private readonly authService = inject(AuthPermissionService);
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

  editMode: boolean = false;
  clonedUser: any = {};

  ngOnInit() {
    const user = this.currentUser();
    if (!user || !this.authService.hasPermission('profile:view')) {
      this.router.navigate(['/home']);
      return;
    }

    this.user = {
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      role: user.role,
      phone: user.phone || 'No especificado',
      address: user.address || 'No especificada',
      dob: user.dob || 'No especificada'
    };
    this.clonedUser = { ...this.user };
  }

  toggleEdit() {
    this.editMode = !this.editMode;
    if (!this.editMode) {
      this.clonedUser = { ...this.user };
    }
  }

  saveProfile() {
    this.user = { ...this.clonedUser };
    this.editMode = false;
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Perfil actualizado correctamente',
    });
  }

  deleteProfile() {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.',
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Eliminado',
          detail: 'Cuenta eliminada (Simulación)',
        });
        
        // Redirigir a login después de un pequeño retraso para mostrar el mensaje
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },
    });
  }
}


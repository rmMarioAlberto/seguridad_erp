import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Router } from '@angular/router';

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
  user = {
    fullName: 'Alberto Admin',
    username: 'alberto_admin',
    email: 'admin@example.com',
    phone: '1234567890',
    address: '123 Admin St.',
    dob: '01/01/1990',
    role: 'Administrator',
  };

  editMode: boolean = false;
  clonedUser: any = {};

  constructor(
    private readonly messageService: MessageService,
    private readonly confirmationService: ConfirmationService,
    private readonly router: Router
  ) {}

  ngOnInit() {
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


import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthPermissionService } from '../../../services/auth-permission.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    PasswordModule,
    FloatLabelModule,
    DatePickerModule,
    ToastModule,
    RouterLink,
  ],
  providers: [MessageService],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  registerForm: FormGroup;
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthPermissionService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  constructor() {
    this.registerForm = this.fb.group(
      {
        fullName: ['', Validators.required],
        username: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
        address: ['', Validators.required],
        dob: [null, [Validators.required, RegisterComponent.adultAge()]],
        password: ['', [Validators.required, RegisterComponent.strongPassword()]],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator },
    );
  }

  static strongPassword(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;
      const hasMinLength = value.length >= 10;
      const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(value);
      return !(hasMinLength && hasSpecial) ? { strongPassword: true } : null;
    };
  }

  static adultAge(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
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

  passwordMatchValidator(g: AbstractControl): ValidationErrors | null {
    const password = g.get('password')?.value;
    const confirmPassword = g.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  onSubmit() {
    this.registerForm.markAllAsTouched();
    if (this.registerForm.valid) {
      const formValue = this.registerForm.value;
      const payload = {
        nombre_completo: formValue.fullName,
        username: formValue.username,
        email: formValue.email,
        password: formValue.password,
        fecha_inicio: formValue.dob,
        direccion: formValue.address,
        telefono: formValue.phone
      };

      this.authService.register(payload).subscribe({
        next: (success) => {
          if (success) {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: '¡Registro completado! Ahora puedes iniciar sesión.',
            });
            setTimeout(() => this.router.navigate(['/login']), 2000);
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo completar el registro. Intenta con otro correo o username.',
            });
          }
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Ocurrió un error en el servidor.',
          });
        }
      });
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor, corrige los errores del formulario.',
      });
    }
  }
}

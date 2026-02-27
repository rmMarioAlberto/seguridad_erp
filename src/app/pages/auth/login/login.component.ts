import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    PasswordModule,
    FloatLabelModule,
    ToastModule,
    RouterLink,
  ],
  providers: [MessageService],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  loginForm: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly messageService: MessageService,
    private readonly router: Router,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      if (email === 'admin@admin.com' && password === 'Admin123!') {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Login successful!',
        });
        setTimeout(() => this.router.navigate(['/home']), 1000);
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Invalid credentials. Try admin@admin.com / Admin123!',
        });
      }
    }
  }
}

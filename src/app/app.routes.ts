import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { LoginComponent } from './pages/auth/login/login.component';
import { RegisterComponent } from './pages/auth/register/register.component';

export const routes: Routes = [
  //
  { path: '', component: LandingComponent },
  // path para el componente de login
  { path: 'login', component: LoginComponent },
  // path para componente de registro
  { path: 'register', component: RegisterComponent },
  //
  { path: '**', redirectTo: '' },
];

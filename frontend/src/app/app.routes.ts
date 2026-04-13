import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { LoginComponent } from './pages/auth/login/login.component';
import { RegisterComponent } from './pages/auth/register/register.component';
import { MainLayout } from './layouts/main-layout/main-layout';
import { Home } from './pages/home/home';
import { GroupComponent } from './pages/group/group';
import { UserComponent } from './pages/user/user';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  
  // Rutas Protegidas
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: 'home', component: Home },
      { path: 'group', component: GroupComponent },
      { path: 'user', component: UserComponent },
      {
        path: 'user-management',
        loadComponent: () =>
          import('./pages/user-management/user-management').then((m) => m.UserManagementComponent),
      },
      {
        path: 'tickets',
        loadComponent: () =>
          import('./pages/tickets/group-view/group-view').then((m) => m.TicketGroupViewComponent),
      },
      {
        path: 'metrics',
        loadComponent: () =>
          import('./pages/metrics/metrics').then((m) => m.MetricsComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];

import { Component, inject, effect, signal } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { AuthPermissionService } from '../../services/auth-permission.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [MenuModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  private readonly authService = inject(AuthPermissionService);
  items = signal<MenuItem[] | undefined>(undefined);

  constructor() {
    effect(() => {
      // El efecto se disparará cuando cambien los permisos en authService
      this.updateMenu();
    });
  }

  updateMenu() {
    const userMenuItems: MenuItem[] = [
      {
        label: 'Inicio',
        icon: 'pi pi-home',
        routerLink: '/home',
      },
    ];

    // Permisos reales del backend
    const canViewGroups = this.authService.canManageOrViewGroups();

    if (canViewGroups) {
      userMenuItems.push({
        label: 'Grupos',
        icon: 'pi pi-users',
        routerLink: '/group',
      });
    }

    if (
      this.authService.hasGlobalPermission('tickets:view') ||
      this.authService.hasGlobalPermission('tickets:create') ||
      this.authService.hasGlobalPermission('tickets:edit') ||
      this.authService.hasGlobalPermission('tickets:delete') ||
      this.authService.hasGlobalPermission('tickets:manage')
    ) {
      userMenuItems.push({
        label: 'Tickets',
        icon: 'pi pi-ticket',
        routerLink: '/tickets',
      });
    }

    if (
      this.authService.hasPermission('users:view') ||
      this.authService.hasPermission('users:create') ||
      this.authService.hasPermission('users:edit') ||
      this.authService.hasPermission('users:delete')
    ) {
      userMenuItems.push({
        label: 'Gestión Usuarios',
        icon: 'pi pi-user-plus',
        routerLink: '/user-management',
      });
    }

    if (
      this.authService.hasPermission('metrics:view') ||
      this.authService.hasPermission('logs:view')
    ) {
      userMenuItems.push({
        label: 'Métricas',
        icon: 'pi pi-chart-bar',
        routerLink: '/metrics',
      });
    }
    if (this.authService.hasPermission('profile:view')) {
      userMenuItems.push({
        label: 'Mi Perfil',
        icon: 'pi pi-user',
        routerLink: '/user',
      });
    }

    userMenuItems.push({
      label: 'Cerrar Sesión',
      icon: 'pi pi-sign-out',
      command: () => this.authService.logout(),
    });

    this.items.set([
      {
        label: 'Menú ERP',
        items: userMenuItems,
      },
    ]);
  }
}

import { Component, inject, effect } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { AuthPermissionService } from '../../services/auth-permission.service';

@Component({
  selector: 'app-sidebar',
  imports: [MenuModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  private readonly authService = inject(AuthPermissionService);
  items: MenuItem[] | undefined;

  constructor() {
    effect(() => {
      this.updateMenu();
    });
  }

  updateMenu() {
    const userMenuItems: MenuItem[] = [
      {
        label: 'Inicio',
        icon: 'pi pi-home',
        routerLink: '/home',
      }
    ];

    if (this.authService.hasPermission('group:add') || 
        this.authService.hasPermission('group:edit') || 
        this.authService.hasPermission('group:delete')) {
      userMenuItems.push({
        label: 'Grupos',
        icon: 'pi pi-users',
        routerLink: '/group',
      });
    }

    if (this.authService.hasPermission('profile:view')) {
      userMenuItems.push({
        label: 'Mi Perfil',
        icon: 'pi pi-user',
        routerLink: '/user',
      });
    }

    if (this.authService.hasPermission('user:crud')) {
      userMenuItems.push({
        label: 'Gestión Usuarios',
        icon: 'pi pi-user-plus',
        routerLink: '/user-management',
      });
    }

    userMenuItems.push({
      label: 'Cerrar Sesión',
      icon: 'pi pi-sign-out',
      command: () => this.authService.logout(),
      routerLink: '/login',
    });

    this.items = [
      {
        label: 'Menú ERP',
        items: userMenuItems,
      },
    ];
  }
}

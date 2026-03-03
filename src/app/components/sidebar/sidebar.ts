import { Component, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';

@Component({
  selector: 'app-sidebar',
  imports: [MenuModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit {
  items: MenuItem[] | undefined;

  ngOnInit() {
    this.items = [
      {
        label: 'Menú',
        items: [
          {
            label: 'Inicio',
            icon: 'pi pi-home',
            routerLink: '/home',
          },
          {
            label: 'Group',
            icon: 'pi pi-users',
            routerLink: '/group',
          },
          {
            label: 'User',
            icon: 'pi pi-user',
            routerLink: '/user',
          },
          {
            label: 'Cerrar Sesión',
            icon: 'pi pi-sign-out',
            routerLink: '/login',
          },
        ],
      },
    ];
  }
}

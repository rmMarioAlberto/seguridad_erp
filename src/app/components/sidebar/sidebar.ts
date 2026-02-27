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
        label: 'Menú ERP',
        items: [
          {
            label: 'Inicio',
            icon: 'pi pi-home',
            routerLink: '/home',
          },
          {
            label: 'Ventas',
            icon: 'pi pi-shopping-cart',
          },
          {
            label: 'Inventario',
            icon: 'pi pi-box',
          },
          {
            label: 'Clientes',
            icon: 'pi pi-users',
          },
          {
            label: 'Configuración',
            icon: 'pi pi-cog',
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

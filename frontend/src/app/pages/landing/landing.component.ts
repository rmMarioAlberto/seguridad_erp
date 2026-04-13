import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MenubarModule } from 'primeng/menubar';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [ButtonModule, CardModule, MenubarModule, RouterLink],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
})
export class LandingComponent {
  items = [
    {
      label: 'Home',
      icon: 'pi pi-home',
    },
    {
      label: 'Features',
      icon: 'pi pi-star',
    },
    {
      label: 'Contact',
      icon: 'pi pi-envelope',
    },
  ];
}

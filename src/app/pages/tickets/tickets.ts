import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [RouterOutlet, ToastModule],
  template: `
    <div class="p-4">
      <p-toast></p-toast>
      <router-outlet></router-outlet>
    </div>
  `,
})
export class TicketsComponent {}

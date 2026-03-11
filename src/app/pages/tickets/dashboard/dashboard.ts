import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TicketService } from '../../../services/ticket.service';
import { TicketStatus } from '../../../models/ticket.model';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-ticket-dashboard',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, RouterLink],
  template: `
    <div class="grid">
      <div class="col-12 flex justify-content-between align-items-center mb-4">
        <h1 class="text-3xl font-bold m-0 text-color">Dashboard de Tickets</h1>
        <p-button label="Ver Todos los Tickets" icon="pi pi-list" routerLink="../group" severity="secondary"></p-button>
      </div>

      <!-- Stats Cards -->
      @for (status of statuses; track status) {
        <div class="col-12 md:col-3">
          <p-card class="shadow-2 border-round-xl overflow-hidden hover:shadow-4 transition-all transition-duration-300">
              <div class="flex justify-content-between mb-3">
                  <div>
                      <span class="block text-color-secondary font-medium mb-3">{{ status }}</span>
                      <div class="text-color font-bold text-4xl">{{ getCount(status) }}</div>
                  </div>
                  <div class="flex align-items-center justify-content-center border-round" 
                       [ngStyle]="{'width': '2.5rem', 'height': '2.5rem', 'background-color': getStatusColor(status, true)}">
                      <i [class]="getStatusIcon(status)" [ngStyle]="{'color': getStatusColor(status)}"></i>
                  </div>
              </div>
              <span class="text-green-500 font-medium">%{{ getPercentage(status) }} </span>
              <span class="text-color-secondary">del total</span>
          </p-card>
        </div>
      }

      <div class="col-12 mt-4">
        <p-card header="Acciones Rápidas" class="shadow-2">
            <div class="flex flex-wrap gap-3">
                <p-button label="Nuevo Ticket" icon="pi pi-plus" routerLink="../group" [queryParams]="{create: true}"></p-button>
                <p-button label="Reporte Mensual" icon="pi pi-file-pdf" severity="help" [outlined]="true"></p-button>
                <p-button label="Configuración" icon="pi pi-cog" severity="secondary" [outlined]="true"></p-button>
            </div>
        </p-card>
      </div>
    </div>
  `,
})
export class TicketDashboardComponent {
  private readonly ticketService = inject(TicketService);
  statuses: TicketStatus[] = ['Abierto', 'En Progreso', 'En Revisión', 'Cerrado'];

  getCount(status: TicketStatus) {
    return this.ticketService.getTicketsByStatus(status).length;
  }

  getPercentage(status: TicketStatus) {
    const total = this.ticketService.tickets().length;
    if (total === 0) return 0;
    return Math.round((this.getCount(status) / total) * 100);
  }

  getStatusIcon(status: TicketStatus) {
    switch (status) {
      case 'Abierto': return 'pi pi-envelope';
      case 'En Progreso': return 'pi pi-sync';
      case 'En Revisión': return 'pi pi-eye';
      case 'Cerrado': return 'pi pi-check-circle';
      default: return 'pi pi-ticket';
    }
  }

  getStatusColor(status: TicketStatus, bg = false) {
    switch (status) {
      case 'Abierto': return bg ? '#E0F2F1' : '#009688';
      case 'En Progreso': return bg ? '#FFF8E1' : '#FFC107';
      case 'En Revisión': return bg ? '#E1F5FE' : '#03A9F4';
      case 'Cerrado': return bg ? '#F1F8E9' : '#8BC34A';
      default: return '#9E9E9E';
    }
  }
}

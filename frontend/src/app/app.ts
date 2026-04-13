import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressBarModule } from 'primeng/progressbar';
import { LoadingService } from './services/loading.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastModule, ConfirmDialogModule, ProgressBarModule, CommonModule],
  template: `
    <p-progressBar 
      *ngIf="loadingService.isLoading()" 
      mode="indeterminate" 
      [style]="{'height': '4px', 'position': 'fixed', 'top': '0', 'left': '0', 'width': '100%', 'z-index': '9999'}">
    </p-progressBar>
    <router-outlet />
    <p-toast />
    <p-confirmDialog />
  `,
})
export class App {
  protected readonly loadingService = inject(LoadingService);
  protected readonly title = signal('erp');
}

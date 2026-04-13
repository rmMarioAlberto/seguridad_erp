import { Component, OnInit, inject, signal, ChangeDetectionStrategy, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { MetricsService, Log, Metrica, StatsSummary } from '../../services/metrics.service';
import { AuthPermissionService } from '../../services/auth-permission.service';
import { RefetchService } from '../../services/refetch.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, catchError, of } from 'rxjs';

@Component({
  selector: 'app-metrics',
  standalone: true,
  imports: [CommonModule, TableModule, ChartModule, CardModule, TagModule],
  templateUrl: './metrics.html',
  styleUrl: './metrics.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetricsComponent implements OnInit {
  private readonly metricsService = inject(MetricsService);
  private readonly authService = inject(AuthPermissionService);
  private readonly refetchService = inject(RefetchService);
  private readonly destroyRef = inject(DestroyRef);

  readonly logs = signal<Log[]>([]);
  readonly metricas = signal<Metrica[]>([]);
  readonly summary = signal<StatsSummary | null>(null);

  // Computed signals for permissions
  readonly canViewMetrics = computed(() => this.authService.hasPermission('metrics:view'));
  readonly canViewLogs = computed(() => this.authService.hasPermission('logs:view'));

  // Chart models
  trafficData: any;
  latencyData: any;
  statusData: any;
  chartOptions: any;
  pieOptions: any;

  ngOnInit() {
    this.loadData();

    // Escuchar refrescos globales
    this.refetchService.refetch$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        console.log('[Metrics] Refreshing due to global event');
        this.loadData();
      });
  }

  loadData() {
    // 1. Load core metrics only if permitted
    if (this.canViewMetrics()) {
      const coreMetrics$ = forkJoin({
        metricas: this.metricsService.getMetricas().pipe(catchError(() => of([]))),
        summary: this.metricsService.getSummary().pipe(catchError(() => of(null)))
      });

      coreMetrics$.subscribe({
        next: (res) => {
          if (res.metricas) this.metricas.set(res.metricas);
          if (res.summary) {
            this.summary.set(res.summary);
            this.initCharts(res.metricas, res.summary);
          }
        }
      });
    }

    // 2. Load logs only if permitted to avoid 403 errors
    if (this.canViewLogs()) {
      this.metricsService.getLogs(1, 10).pipe(
        catchError((err) => {
          console.warn('Error fetching logs:', err);
          return of([]);
        })
      ).subscribe(logs => this.logs.set(logs));
    }
  }

  initCharts(metricas: Metrica[], summary: StatsSummary) {
    
    // Explicit high-contrast colors for dark theme
    const textColor = '#f1f5f9';
    const textColorSecondary = '#94a3b8';
    const surfaceBorder = 'rgba(255, 255, 255, 0.1)';

    // Chart 1: Traffic by Endpoint
    this.trafficData = {
      labels: metricas.slice(0, 5).map(m => `${m.metodo} ${m.endpoint.split('/').pop()}`),
      datasets: [
        {
          label: 'Total Requests',
          data: metricas.slice(0, 5).map(m => m.total_requests),
          backgroundColor: [
            'rgba(54, 162, 235, 0.5)', 
            'rgba(75, 192, 192, 0.5)', 
            'rgba(255, 159, 64, 0.5)', 
            'rgba(153, 102, 255, 0.5)', 
            'rgba(255, 99, 132, 0.5)'
          ],
          borderColor: [
            'rgb(54, 162, 235)', 
            'rgb(75, 192, 192)', 
            'rgb(255, 159, 64)', 
            'rgb(153, 102, 255)', 
            'rgb(255, 99, 132)'
          ],
          borderWidth: 1
        }
      ]
    };

    // Chart 2: Latency
    this.latencyData = {
      labels: metricas.slice(0, 5).map(m => m.endpoint.split('/').pop()),
      datasets: [
        {
          label: 'Promedio de Respuesta (ms)',
          data: metricas.slice(0, 5).map(m => Math.round(m.tiempo_respuesta_avg)),
          fill: true,
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderColor: '#3b82f6',
          tension: 0.4,
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#ffffff'
        }
      ]
    };

    // Chart 3: Status Distribution
    this.statusData = {
      labels: summary.statusCounts.map(s => `HTTP ${s.status}`),
      datasets: [
        {
          data: summary.statusCounts.map(s => s.count),
          backgroundColor: [
            '#10b981', // green-500
            '#3b82f6', // blue-500
            '#f59e0b', // yellow-500
            '#ef4444'  // red-500
          ],
          hoverOffset: 15
        }
      ]
    };

    this.chartOptions = {
        maintainAspectRatio: false,
        aspectRatio: 0.8,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: textColor,
                    padding: 20,
                    font: { size: 12 }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#ffffff',
                bodyColor: '#ffffff',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                borderWidth: 1
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    color: textColorSecondary,
                    font: { size: 11 }
                },
                grid: {
                    color: surfaceBorder,
                    drawBorder: false
                }
            },
            x: {
                ticks: {
                    color: textColorSecondary,
                    font: { size: 11 },
                    maxRotation: 45,
                    minRotation: 45
                },
                grid: {
                    color: 'transparent',
                    drawBorder: false
                }
            }
        }
    };

    this.pieOptions = {
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    color: textColor,
                    padding: 15,
                    usePointStyle: true,
                    font: { size: 11 }
                }
            }
        }
    };
  }

  getStatusSeverity(status: number): "success" | "secondary" | "info" | "warn" | "danger" {
    if (status < 300) return 'success';
    if (status < 400) return 'info';
    if (status < 500) return 'warn';
    return 'danger';
  }
}

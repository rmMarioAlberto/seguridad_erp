import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import { AuthPermissionService } from '../services/auth-permission.service';

@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private readonly templateRef = inject(TemplateRef<any>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authService = inject(AuthPermissionService);

  @Input('appHasPermission') permission!: string;

  constructor() {
    // Usar effect para reaccionar a cambios en los permisos reactivos (Signals)
    effect(() => {
      const hasPerm = this.authService.hasPermission(this.permission);
      
      this.viewContainer.clear();
      if (hasPerm) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    });
  }
}

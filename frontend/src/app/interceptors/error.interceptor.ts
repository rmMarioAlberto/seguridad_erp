import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const messageService = inject(MessageService);

  return next(req).pipe(
    catchError((error) => {
      let detail = 'Ocurrió un error inesperado';
      
      if (error.error && error.error.message) {
        detail = error.error.message;
      } else if (error.status === 401) {
        detail = 'Sesión expirada o no autorizada';
      } else if (error.status === 403) {
        detail = 'No tienes permisos para realizar esta acción';
      } else if (error.status === 404) {
        detail = 'Recurso no encontrado';
      } else if (error.status === 500) {
        detail = 'Error interno del servidor';
      }

      messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: detail,
        life: 5000
      });

      return throwError(() => error);
    })
  );
};

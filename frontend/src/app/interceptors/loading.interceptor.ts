import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LoadingService } from '../services/loading.service';
import { finalize } from 'rxjs';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);
  
  // Skip loading for specific requests if needed
  if (req.headers.has('skip-loading')) {
    return next(req);
  }

  loadingService.show();
  return next(req).pipe(
    finalize(() => loadingService.hide())
  );
};

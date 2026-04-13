import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('jwt_token');

  if (token) {
    return true;
  }

  // Redirigir al login si no hay token
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

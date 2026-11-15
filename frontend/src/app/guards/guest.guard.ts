import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) return true;

  return auth.isAdmin() || auth.isVendedor()
    ? router.createUrlTree(['/menu/dashboard'])
    : router.createUrlTree(['/catalogo']);
};

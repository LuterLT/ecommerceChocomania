import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(AuthService).restore().pipe(
    map(user => user ? true : router.createUrlTree(['/login'])),
    catchError(() => of(router.createUrlTree(['/login']))),
  );
};

export const guestGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(AuthService).restore().pipe(
    map(user => user ? router.createUrlTree(['/logado']) : true),
    // Keep the form reachable during an outage so the user can retry authentication.
    catchError(() => of(true)),
  );
};

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {

  const auth = inject(AuthService);
  const router = inject(Router);

  // 1️⃣ Not logged in → block
  if (!auth.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  // 2️⃣ Logged in but not admin → block
  if (!auth.isAdmin()) {
    router.navigate(['/']);
    return false;
  }

  // 3️⃣ Admin → allow access
  return true;
};

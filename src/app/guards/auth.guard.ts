import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {

  const auth = inject(AuthService);
  const router = inject(Router);

  // 🔐 1️⃣ Check ADMIN token only
  if (!auth.isAdmin()) {
    router.navigate(['/admin/login']);
    return false;
  }

  // ✔ Admin token present → allow
  return true;
};

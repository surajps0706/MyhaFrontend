import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);

  // 🔐 Check admin token ONLY
  const token = localStorage.getItem("admin_token");

  // ❌ Not logged in → redirect to admin login
  if (!token) {
    router.navigate(['/admin/login']);
    return false;
  }

  // ✔ Logged in → allow access
  return true;
};

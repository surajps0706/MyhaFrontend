import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const auth = inject(AuthService);

  // FIRST check admin token
  const adminToken = auth.getAdminToken();

  // If no admin token, then use user token
  const userToken = auth.getToken();

  const token = adminToken || userToken;

  if (!token) return next(req);

  const modifiedReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(modifiedReq);
};

import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private tokenKey = 'userToken';
  private roleKey = 'userRole';
  private nameKey = 'userName';

  constructor(private router: Router) {}

  // Save token, role, name for customer login
  saveAuthData(token: string, role: string, name: string) {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.roleKey, role);   // "customer"
    localStorage.setItem(this.nameKey, name);
  }

  // Save ADMIN token separately
  saveAdminToken(token: string) {
    localStorage.setItem('adminToken', token);
  }

  getAdminToken() {
    return localStorage.getItem('adminToken');
  }

  // Customer token
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUserName(): string | null {
    return localStorage.getItem(this.nameKey);
  }

  // Customer login check
  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  // Admin login check
  isAdmin(): boolean {
    return !!localStorage.getItem('adminToken');
  }

  getRole(): string | null {
    return localStorage.getItem(this.roleKey);
  }

logout() {
  localStorage.removeItem(this.tokenKey);
  localStorage.removeItem(this.roleKey);
  localStorage.removeItem(this.nameKey);

  // also remove admin token to avoid conflict
  localStorage.removeItem('adminToken');

  this.router.navigate(['/login']);
}


  logoutAdmin() {
    localStorage.removeItem('adminToken');
    this.router.navigate(['/admin/login']);
  }
}

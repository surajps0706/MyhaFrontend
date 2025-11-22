import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private userTokenKey = 'userToken';
  private userRoleKey = 'userRole';
  private userNameKey = 'userName';

  private adminTokenKey = 'adminToken'; // 🔥 Single correct admin key

  constructor(private router: Router) {}

  // ============================
  // CUSTOMER AUTH
  // ============================
  saveAuthData(token: string, role: string, name: string) {
    localStorage.setItem(this.userTokenKey, token);
    localStorage.setItem(this.userRoleKey, role);
    localStorage.setItem(this.userNameKey, name);
  }

  getToken(): string | null {
    return localStorage.getItem(this.userTokenKey);
  }

  getUserName() {
    return localStorage.getItem(this.userNameKey);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.userTokenKey);
  }

  // ============================
  // ADMIN AUTH
  // ============================
  saveAdminToken(token: string) {
    localStorage.setItem(this.adminTokenKey, token);
  }

  getAdminToken(): string | null {
    return localStorage.getItem(this.adminTokenKey);
  }

  isAdmin(): boolean {
    return !!localStorage.getItem(this.adminTokenKey);
  }

  // ============================
  // LOGOUTS
  // ============================
  logoutUser() {
    localStorage.removeItem(this.userTokenKey);
    localStorage.removeItem(this.userRoleKey);
    localStorage.removeItem(this.userNameKey);
    this.router.navigate(['/login']);
  }

  logoutAdmin() {
    localStorage.removeItem(this.adminTokenKey);
    this.router.navigate(['/admin/login']);
  }
}

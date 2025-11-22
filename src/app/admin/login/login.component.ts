import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <h2>🔐 Admin Login</h2>

      <form (ngSubmit)="login()">
        <input
          type="text"
          placeholder="Username"
          [(ngModel)]="username"
          name="username"
          required
        />
        <input
          type="password"
          placeholder="Password"
          [(ngModel)]="password"
          name="password"
          required
        />

        <button type="submit" [disabled]="loading">
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>

        <p class="error" *ngIf="errorMessage">{{ errorMessage }}</p>
      </form>
    </div>
  `,
  styles: [`
    .login-container {
      max-width: 350px;
      margin: 100px auto;
      padding: 25px;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
      text-align: center;
      background: #fff;
    }
    input {
      display: block;
      width: 100%;
      margin: 10px 0;
      padding: 10px;
    }
    button {
      width: 100%;
      padding: 10px;
      background: black;
      color: white;
      border: none;
      cursor: pointer;
      border-radius: 4px;
      font-size: 15px;
    }
    button[disabled] {
      background: #555;
      cursor: not-allowed;
    }
    .error {
      color: red;
      margin-top: 10px;
    }
  `]
})
export class LoginComponent implements OnInit {

  username: string = '';
  password: string = '';
  errorMessage: string = '';
  loading: boolean = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    if (this.authService.isAdmin()) {
      this.router.navigate(['/admin/orders']);
    }
  }

  login() {
    this.errorMessage = '';
    this.loading = true;

    this.http.post<any>(`${environment.apiUrl}/admin/login`, {
      username: this.username,
      password: this.password
    }).subscribe({
      next: (res) => {
        this.authService.saveAuthData(res.token, 'admin', 'Admin');
        this.router.navigate(['/admin/orders']);
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Invalid username or password';
        this.authService.logout();
        this.loading = false;
      }
    });
  }
}

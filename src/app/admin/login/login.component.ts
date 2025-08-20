import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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
        <button type="submit">Login</button>
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
    button:hover {
      background: #333;
    }
    .error {
      color: red;
      margin-top: 10px;
    }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  errorMessage = '';

  constructor(private http: HttpClient, private router: Router) {}

  login() {
    this.http.post<any>('http://localhost:8000/admin/login', {
      username: this.username,
      password: this.password
    }).subscribe({
      next: (res) => {
        localStorage.setItem('admin_token', res.token);
        this.router.navigate(['/admin/orders']);
      },
      error: () => {
        this.errorMessage = 'Invalid credentials';
      }
    });
  }
}

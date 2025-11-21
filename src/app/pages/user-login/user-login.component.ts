import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-user-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './user-login.component.html',
  styleUrls: ['./user-login.component.css']
})
export class UserLoginComponent {

  formData = {
    email: '',
    password: ''
  };

  loading = false;
  errorMessage = '';

  private baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  login() {
    this.errorMessage = '';
    this.loading = true;

    const payload = {
      email: this.formData.email,
      password: this.formData.password
    };

    this.http.post<any>(`${this.baseUrl}/login`, payload).subscribe({
      next: (res) => {
        this.loading = false;

        // Save token & role
        this.authService.saveAuthData(res.token, res.role, res.name);

        // Redirect user
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading = false;

        if (err.error?.error) {
          this.errorMessage = err.error.error;
        } else {
          this.errorMessage = 'Login failed. Please try again.';
        }
      }
    });
  }
}

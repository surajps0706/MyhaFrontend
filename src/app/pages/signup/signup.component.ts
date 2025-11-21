import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {

  formData = {
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  };

  loading = false;
  errorMessage = '';
  successMessage = '';
  passwordMismatch = false;

  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient, private router: Router) {}

  signup() {
    this.errorMessage = '';
    this.successMessage = '';
    this.passwordMismatch = false;

    // Password match check
    if (this.formData.password !== this.formData.confirmPassword) {
      this.passwordMismatch = true;
      return;
    }

    this.loading = true;

    const payload = {
      name: this.formData.name,
      email: this.formData.email,
      phone: this.formData.phone,
      password: this.formData.password
    };

    this.http.post(`${this.baseUrl}/signup`, payload).subscribe({
      next: () => {
        this.successMessage = "Account created successfully!";
        this.loading = false;

        // Redirect to login after 1 second
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1200);
      },
      error: (err) => {
        this.loading = false;
        if (err.error?.error) {
          this.errorMessage = err.error.error;
        } else {
          this.errorMessage = "Signup failed. Try again.";
        }
      }
    });
  }
}

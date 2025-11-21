import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {

  email = '';
  message = '';
  loading = false;

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private router: Router) {}

  sendOtp() {
    this.loading = true;
    this.message = '';

    this.http.post(`${this.apiUrl}/forgot-password`, { email: this.email })
      .subscribe({
        next: (res: any) => {
          this.loading = false;
          this.message = "OTP sent to your email. Redirecting...";
          setTimeout(() => {
            this.router.navigate(['/reset-password'], {
              queryParams: { email: this.email }
            });
          }, 1500);
        },
        error: (err) => {
          this.loading = false;
          this.message = err.error?.detail || "Something went wrong.";
        }
      });
  }
}

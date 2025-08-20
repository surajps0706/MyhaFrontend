import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-track-order',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './track-order.component.html',
  styleUrl: './track-order.component.css'
})
export class TrackOrderComponent {
  orderId: string = '';
  email: string = '';
  order: any = null;
  error: string = '';
  loading: boolean = false;

  constructor(private http: HttpClient) {}

  trackOrder() {
    this.error = '';
    this.order = null;
    this.loading = true;

    this.http.post<any>('http://localhost:8000/track-order', {
      orderId: this.orderId,
      email: this.email
    }).subscribe({
      next: (res) => {
        this.order = res;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.detail || 'Unable to fetch order. Please try again.';
        this.loading = false;
      }
    });
  }
}

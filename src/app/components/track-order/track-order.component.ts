import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-track-order',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './track-order.component.html',
  styleUrls: ['./track-order.component.css']
})
export class TrackOrderComponent {
  orderId: string = '';
  email: string = '';
  order: any = null;
  error: string = '';
  loading: boolean = false;

  // 🚀 for animation
  activeSteps: string[] = [];

  constructor(private http: HttpClient) {}

  trackOrder() {
    this.error = '';
    this.order = null;
    this.activeSteps = [];
    this.loading = true;

    this.http.post<any>(`${environment.apiUrl}/track-order`, {
      orderId: this.orderId,
      email: this.email
    }).subscribe({
      next: (res) => {
        this.order = res;
        this.loading = false;
        this.animateSteps(res.status);
      },
      error: (err) => {
        this.error = err.error?.detail || 'Unable to fetch order. Please try again.';
        this.loading = false;
      }
    });
  }

  // ✅ Animate steps one by one (4-step pipeline)
  animateSteps(currentStatus: string) {
    const pipeline = ["Pending Delivery", "Processing", "Shipped", "Delivered"]; // ✅ matches backend
    const index = pipeline.indexOf(currentStatus);

    if (index >= 0) {
      pipeline.slice(0, index + 1).forEach((step, i) => {
        setTimeout(() => {
          this.activeSteps.push(step);
        }, i * 500); // 0.5s delay between steps
      });
    }
  }

  // ✅ Check if a step is active
  isActive(...statuses: string[]): boolean {
    return statuses.some(s => this.activeSteps.includes(s));
  }

  getStepTime(step: string): string | null {
  return this.order?.statusTimeline?.[step] || null;
}

}

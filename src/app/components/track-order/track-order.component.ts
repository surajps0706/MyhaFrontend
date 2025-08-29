import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-track-order',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './track-order.component.html',
  styleUrls: ['./track-order.component.css']
})
export class TrackOrderComponent implements OnInit {
  orderId: string = '';
  email: string = '';
  order: any = null;
  timeline: any[] = [];          // full backend timeline
  animatedTimeline: any[] = [];  // animated display
  error: string = '';
  loading: boolean = false;

  // ⭐ Horizontal Progress Steps
  progressSteps: string[] = [
    "Preparing",
    "Packed",
    "Shipped",
    "In Transit",
    "Out for Delivery",
    "Delivered"
  ];

  constructor(private http: HttpClient, private route: ActivatedRoute) {}

  ngOnInit(): void {
    // ✅ Auto-load orderId from query params (e.g. from OrderSuccess page)
    this.route.queryParams.subscribe(params => {
      if (params['orderId']) {
        this.orderId = params['orderId'];
        this.trackOrder(true); // auto-track without email
      }
    });
  }

  trackOrder(skipEmailCheck = true) {
    this.error = '';
    this.order = null;
    this.timeline = [];
    this.animatedTimeline = [];
    this.loading = true;

    if (!this.orderId) {
      this.error = '⚠️ Please enter Order ID';
      this.loading = false;
      return;
    }

    const apiUrl = skipEmailCheck
      ? `${environment.apiUrl}/orders/${this.orderId}/timeline`
      : `${environment.apiUrl}/track-order`;

    const request$ = skipEmailCheck
      ? this.http.get<any>(apiUrl)
      : this.http.post<any>(apiUrl, { orderId: this.orderId, email: this.email });

    request$.subscribe({
      next: (res) => {
        this.order = res;
        this.timeline = res.timeline || [];
        this.loading = false;
        this.animateTimeline();
      },
      error: (err) => {
        this.error = err.error?.detail || 'Unable to fetch order. Please try again.';
        this.loading = false;
      }
    });
  }

  // ⭐ Animate dynamic timeline
  animateTimeline() {
    this.animatedTimeline = [];
    this.timeline.forEach((step, i) => {
      setTimeout(() => {
        this.animatedTimeline.push(step);
      }, i * 600);
    });
  }

  // ✅ Check if progress step is active
  isStepActive(step: string): boolean {
    return this.timeline.some(s => s.status.toLowerCase().includes(step.toLowerCase()));
  }

  // ✅ Check if progress step is completed
  isStepCompleted(step: string): boolean {
    const idx = this.progressSteps.indexOf(step);
    const lastIdx = this.progressSteps.findIndex(
      s => this.timeline.some(st => st.status.toLowerCase().includes(s.toLowerCase()))
    );
    return lastIdx !== -1 && idx <= lastIdx;
  }
}

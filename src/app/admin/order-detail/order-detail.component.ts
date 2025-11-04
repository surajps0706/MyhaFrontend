import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.css']
})
export class OrderDetailComponent implements OnInit {
  orderId: string | null = null;
  order: any = null;
  token: string | null = null;
  baseUrl: string = environment.apiUrl;
  objectKeys = Object.keys;

  // 🔹 New: status-related properties
  statusOptions: string[] = ['Ordered', 'Preparing', 'Packed'];
  selectedStatus: string = '';

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit(): void {
    this.token = localStorage.getItem('admin_token');
    this.orderId = this.route.snapshot.paramMap.get('orderId');

    if (this.token && this.orderId) {
      this.loadOrder();
    }
  }

  private authHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: 'Bearer ' + this.token });
  }

  loadOrder() {
    this.http.get(`${this.baseUrl}/orders/${this.orderId}`, {
      headers: this.authHeaders()
    }).subscribe({
      next: (res: any) => {
        this.order = res;
        this.selectedStatus = res.status || ''; // preselect current
      },
      error: (err) => console.error('❌ Failed to load order details', err)
    });
  }

  // 🔹 New: update order status
  updateStatus() {
    if (!this.selectedStatus) {
      alert('Please select a status');
      return;
    }

    const payload = { status: this.selectedStatus };
    this.http.put(`${this.baseUrl}/orders/${this.orderId}/status`, payload, {
      headers: this.authHeaders()
    }).subscribe({
      next: (res: any) => {
        alert(`✅ Status updated to ${this.selectedStatus}`);
        this.order.status = this.selectedStatus;
      },
      error: (err) => {
        console.error('❌ Failed to update status', err);
        alert('Failed to update status');
      }
    });
  }
}

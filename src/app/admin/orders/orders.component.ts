import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class OrdersComponent implements OnInit {
  orders: any[] = [];
  filteredOrders: any[] = [];
  searchQuery: string = '';
  filterStatus: string = '';
  token: string | null = null;

  private baseUrl: string = environment.apiUrl;  // ✅ dynamic API URL

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    // Get token from localStorage
    this.token = localStorage.getItem('admin_token');

    if (!this.token) {
      // If no token → redirect to login
      this.router.navigate(['/login']);
      return;
    }

    this.loadOrders();
  }

  // Fetch all orders
  loadOrders() {
    this.http.get(`${this.baseUrl}/orders`, {
      headers: { Authorization: 'Bearer ' + this.token }
    }).subscribe((res: any) => {
      this.orders = res;
      this.filteredOrders = [...this.orders];
    }, error => {
      console.error(error);
      if (error.status === 401) {
        alert('Session expired, please log in again.');
        localStorage.removeItem('admin_token');
        this.router.navigate(['/login']);
      }
    });
  }

  // Apply search + filter
  applyFilters() {
    this.filteredOrders = this.orders.filter(order => {
      const matchesSearch =
        order.orderId?.toLowerCase().includes(this.searchQuery.toLowerCase()) || // ✅ use orderId, not id
        order.checkoutData?.name?.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchesStatus =
        this.filterStatus === '' || order.status === this.filterStatus;

      return matchesSearch && matchesStatus;
    });
  }

  // Update order status
  updateStatus(order: any, newStatus: string) {
    this.http.put(
      `${this.baseUrl}/orders/${order.orderId}/status`,   // ✅ use order.orderId, not order.id
      { status: newStatus },
      { headers: { Authorization: 'Bearer ' + this.token } }
    ).subscribe({
      next: (res: any) => {
        alert(`✅ Order ${res.orderId} updated to ${res.status}`);
        order.status = res.status; // ✅ keep UI in sync without full reload
      },
      error: (err) => {
        console.error(err);
        alert('❌ Failed to update order status');
      }
    });
  }

  // Download all orders as Excel
  downloadExcel() {
    this.http.get(`${this.baseUrl}/orders/export`, {
      headers: { Authorization: 'Bearer ' + this.token },
      responseType: 'blob'
    }).subscribe((res: Blob) => {
      const blob = new Blob([res], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'orders.xlsx';
      a.click();

      window.URL.revokeObjectURL(url);
    }, error => {
      console.error(error);
      alert('❌ Failed to download Excel');
    });
  }
}

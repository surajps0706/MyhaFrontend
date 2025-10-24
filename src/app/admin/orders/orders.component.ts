import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
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
    this.token = localStorage.getItem('admin_token');

    if (!this.token) {
      this.router.navigate(['/admin/login']); // corrected path
      return;
    }

    this.loadOrders();
  }

  private authHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: 'Bearer ' + this.token });
  }

  // Fetch all orders
  loadOrders() {
    this.http.get(`${this.baseUrl}/orders`, {
      headers: this.authHeaders()
    }).subscribe({
      next: (res: any) => {
        this.orders = res;
        this.filteredOrders = [...this.orders];
      },
      error: (error) => {
        console.error(error);
        if (error.status === 401) {
          alert('Session expired, please log in again.');
          localStorage.removeItem('admin_token');
          this.router.navigate(['/admin/login']);
        }
      }
    });
  }

  // Apply search + filter
  applyFilters() {
    const q = this.searchQuery.toLowerCase();

    this.filteredOrders = this.orders.filter(order => {
      const matchesSearch =
        order.orderId?.toLowerCase().includes(q) ||
        order.checkoutData?.name?.toLowerCase().includes(q);

      const matchesStatus =
        this.filterStatus === '' || order.status === this.filterStatus;

      return matchesSearch && matchesStatus;
    });
  }

  clearFilters() {
    this.searchQuery = '';
    this.filterStatus = '';
    this.filteredOrders = [...this.orders];
  }

  // Navigate to Order Details
  viewDetails(orderId: string) {
    if (!orderId) return;
    this.router.navigate(['/admin/orders', orderId]);
  }

  // Copy AWB to clipboard
 copyAwb(awb?: string, event?: Event) {
  if (event) event.stopPropagation(); // prevent row click
  if (!awb) return;

  navigator.clipboard.writeText(awb).then(() => {
    alert(`📋 AWB ${awb} copied to clipboard`);
  }).catch(err => {
    console.error('Clipboard copy failed', err);
    alert('❌ Failed to copy AWB');
  });
}


  // Update order status (only until Packed)
  updateStatus(order: any, newStatus?: string) {
    if (!newStatus) return;

    if (["Shipped", "In Transit", "Out for Delivery", "Delivered"].includes(newStatus)) {
      alert("❌ This status is controlled by the courier and cannot be updated manually.");
      return;
    }

    this.http.put(
      `${this.baseUrl}/orders/${order.orderId}/status`,
      { status: newStatus },
      { headers: this.authHeaders() }
    ).subscribe({
      next: (res: any) => {
        alert(`✅ Order ${res.orderId} updated to ${res.status}`);
        order.status = res.status;
        if (res.awb) order.awb = res.awb;
        this.applyFilters();
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
      headers: this.authHeaders(),
      responseType: 'blob'
    }).subscribe({
      next: (res: Blob) => {
        const blob = new Blob([res], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'orders.xlsx';
        a.click();

        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error(error);
        alert('❌ Failed to download Excel');
      }
    });
  }

  cancelOrder(orderId: string) {
    if (!confirm(`⚠️ Are you sure you want to cancel order ${orderId}?`)) return;

    this.http.put(
      `${this.baseUrl}/orders/${orderId}/cancel`,
      {},
      { headers: this.authHeaders() }
    ).subscribe({
      next: (res: any) => {
        alert(`✅ Order ${res.orderId || orderId} cancelled successfully`);

        const order = this.orders.find(o => o.orderId === orderId);
        if (order) order.status = "Cancelled";

        this.applyFilters();
      },
      error: (err) => {
        console.error('❌ Cancel order failed:', err);
        alert('Failed to cancel order. Please try again.');
      }
    });
  }


  // 🗑️ Delete order completely from MongoDB
deleteOrder(orderId: string) {
  if (!confirm(`⚠️ Permanently delete order ${orderId}? This cannot be undone.`)) return;

  this.http.delete(`${this.baseUrl}/delete-order/${orderId}`, {
    headers: this.authHeaders()
  }).subscribe({
    next: (res: any) => {
      alert(`✅ ${res.message || 'Order deleted successfully.'}`);
      // Remove from UI immediately
      this.orders = this.orders.filter(o => o.orderId !== orderId);
      this.filteredOrders = this.filteredOrders.filter(o => o.orderId !== orderId);
    },
    error: (err) => {
      console.error('❌ Delete order failed:', err);
      alert('Failed to delete order. Please try again.');
    }
  });
}

}

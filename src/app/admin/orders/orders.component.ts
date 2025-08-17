import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  ADMIN_TOKEN = 'super-secret-admin'; // must match backend

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  // Fetch all orders
  loadOrders() {
    this.http.get('http://localhost:8000/orders', {
      headers: { Authorization: 'Bearer ' + this.ADMIN_TOKEN }
    }).subscribe((res: any) => {
      this.orders = res;
      this.filteredOrders = [...this.orders];
    });
  }

  // Apply search + filter
  applyFilters() {
    this.filteredOrders = this.orders.filter(order => {
      const matchesSearch =
        order.id.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        order.checkoutData?.name.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchesStatus =
        this.filterStatus === '' || order.status === this.filterStatus;

      return matchesSearch && matchesStatus;
    });
  }

  // Update order status
  updateStatus(order: any, newStatus: string) {
    this.http.put(
      `http://localhost:8000/orders/${order.id}/status`,
      { status: newStatus },
      { headers: { Authorization: 'Bearer ' + this.ADMIN_TOKEN } }
    ).subscribe({
      next: () => {
        alert(`✅ Order ${order.id} updated to ${newStatus}`);
        this.loadOrders();
      },
      error: (err) => {
        console.error(err);
        alert('❌ Failed to update order status');
      }
    });
  }

  // Download all orders as Excel
  downloadExcel() {
    this.http.get('http://localhost:8000/orders/export', {
      headers: { Authorization: 'Bearer ' + this.ADMIN_TOKEN },
      responseType: 'blob' // important for file download
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

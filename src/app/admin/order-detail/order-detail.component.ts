import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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

  // Order navigation
orderIds: string[] = [];
currentOrderIndex: number = -1;
isNavigating: boolean = false;

  // 🔹 New: status-related properties
  statusOptions: string[] = ['Ordered', 'Preparing', 'Packed'];
  selectedStatus: string = '';

  constructor(private route: ActivatedRoute, private http: HttpClient,  private router: Router,) {}

 ngOnInit(): void {
  this.token = localStorage.getItem('admin_token');

  if (!this.token) {
    console.error('Admin token not found');
    return;
  }

  // Load order IDs for navigation
  this.loadOrderIds();

  // Listen for order ID changes in the URL
  this.route.paramMap.subscribe(params => {
    this.orderId = params.get('orderId');

    if (this.orderId) {
      this.loadOrder();
    }
  });
}

  private authHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: 'Bearer ' + this.token });
  }

  private loadOrderIds(): void {
  this.http.get<any[]>(`${this.baseUrl}/orders`, {
    headers: this.authHeaders()
  }).subscribe({
    next: (orders: any) => {

      // Support either a direct array or an object containing orders
      const orderList = Array.isArray(orders)
        ? orders
        : orders?.orders || [];

      this.orderIds = orderList
        .map((o: any) => o.orderId)
        .filter((id: string) => !!id);

      this.updateCurrentOrderIndex();

    },
    error: (err) => {
      console.error('Failed to load order list for navigation', err);
    }
  });
}

private updateCurrentOrderIndex(): void {
  if (!this.orderId) {
    this.currentOrderIndex = -1;
    return;
  }

  this.currentOrderIndex = this.orderIds.indexOf(this.orderId);
}

navigateOrder(direction: number): void {

  if (this.isNavigating || this.currentOrderIndex < 0) {
    return;
  }

  const nextIndex = this.currentOrderIndex + direction;

  if (nextIndex < 0 || nextIndex >= this.orderIds.length) {
    return;
  }

  const nextOrderId = this.orderIds[nextIndex];

  this.isNavigating = true;

  this.router.navigate(['../', nextOrderId], {
    relativeTo: this.route
  }).then(success => {
    this.isNavigating = false;

    if (!success) {
      console.error('Navigation to the selected order failed');
    }
  }).catch(err => {
    this.isNavigating = false;
    console.error('Order navigation failed', err);
  });
}

saveAndNext(): void {
  if (!this.orderId || !this.selectedStatus || this.isNavigating) {
    return;
  }

  // No next order exists
  if (this.currentOrderIndex >= this.orderIds.length - 1) {
    alert('This is the last order. The status will be saved.');
    this.saveCurrentStatus();
    return;
  }

  this.isNavigating = true;

  const payload = { status: this.selectedStatus };

  this.http.put(
    `${this.baseUrl}/orders/${this.orderId}/status`,
    payload,
    { headers: this.authHeaders() }
  ).subscribe({
    next: () => {
      // Update the current order locally
      this.order.status = this.selectedStatus;

      // Open the next order only after a successful save
      const nextOrderId = this.orderIds[this.currentOrderIndex + 1];

      this.router.navigate(['../', nextOrderId], {
        relativeTo: this.route
      }).then(success => {
        this.isNavigating = false;

        if (!success) {
          alert('Status saved, but navigation failed.');
        }
      }).catch(err => {
        this.isNavigating = false;
        console.error('Navigation failed:', err);
        alert('Status saved, but navigation failed.');
      });
    },
    error: err => {
      this.isNavigating = false;
      console.error('Failed to save order status:', err);
      alert('Failed to save the order status. You are still on the current order.');
    }
  });
}

saveCurrentStatus(): void {
  if (!this.orderId || !this.selectedStatus || this.isNavigating) {
    return;
  }

  this.isNavigating = true;

  this.http.put(
    `${this.baseUrl}/orders/${this.orderId}/status`,
    { status: this.selectedStatus },
    { headers: this.authHeaders() }
  ).subscribe({
    next: () => {
      this.order.status = this.selectedStatus;
      this.isNavigating = false;
      alert('Order status saved successfully.');
    },
    error: err => {
      this.isNavigating = false;
      console.error('Failed to save order status:', err);
      alert('Failed to save the order status.');
    }
  });
}

closeOrder(): void {
  if (this.isNavigating) {
    return;
  }

  this.router.navigate(['/admin/orders']);
}

  loadOrder() {
    this.http.get(`${this.baseUrl}/orders/${this.orderId}`, {
      headers: this.authHeaders()
    }).subscribe({
      next: (res: any) => {
        this.order = res;
        this.selectedStatus = res.status || ''; // preselect current
        this.updateCurrentOrderIndex();

      },
      error: (err) => console.error('❌ Failed to load order details', err)
    });
  }

  // 🔹 New: update order status
updateStatus(): void {
  if (!this.selectedStatus) {
    alert('Please select a status');
    return;
  }

  if (this.isNavigating) {
    return;
  }

  if (!this.orderId) {
    alert('Order ID is missing');
    return;
  }

  this.isNavigating = true;

  const payload = { status: this.selectedStatus };

  this.http.put(
    `${this.baseUrl}/orders/${this.orderId}/status`,
    payload,
    { headers: this.authHeaders() }
  ).subscribe({
    next: (res: any) => {
      this.order.status = this.selectedStatus;
      this.isNavigating = false;

      alert(`✅ Status updated to ${this.selectedStatus}`);
    },
    error: (err) => {
      console.error('❌ Failed to update status', err);
      this.isNavigating = false;
      alert('Failed to update status');
    }
  });
}
}

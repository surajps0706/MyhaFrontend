import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = 'http://localhost:8000'; // ✅ backend

  constructor(private http: HttpClient) {}

  // ✅ Save order after checkout
  saveOrder(orderData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/save-order`, orderData);
  }

  // ✅ Get order by ID (for order-success)
  getOrderById(orderId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/orders/${orderId}`);
  }

  // ✅ Track order (orderId + email)
  trackOrder(orderId: string, email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/track-order`, { orderId, email });
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

declare var Razorpay: any;

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
})
export class CheckoutComponent implements OnInit {
  cartItems: any[] = [];

  checkoutData = {
    name: '',
    phone: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: ''
  };

  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
  }

  getItemTotal(item: any): number {
    const basePrice = Number(item.price?.toString().replace(/[^0-9]/g, '') || 0);
    const sleevePrice = Number(item.sleevePrice || 0);
    const heightPrice = Number(item.extraHeightPrice || 0);
    const qty = item.quantity || 1;
    return (basePrice + sleevePrice + heightPrice) * qty;
  }

  get totalAmount(): number {
    return this.cartItems.reduce((total, item) => total + this.getItemTotal(item), 0);
  }

  placeOrder(): void {
    if (!this.checkoutData.name || !this.checkoutData.phone || !this.checkoutData.addressLine1 || !this.checkoutData.email) {
      alert('⚠️ Please fill all required fields before placing your order.');
      return;
    }

    this.http.post(`${this.baseUrl}/create-order`, { amount: this.totalAmount })
      .subscribe({
        next: (order: any) => this.openRazorpay(order),
        error: err => {
          console.error('Error creating order:', err);
          alert('❌ Could not initiate payment.');
        }
      });
  }

  openRazorpay(order: any) {
    const options = {
      key: environment.razorpayKey, // Razorpay Test Key
      amount: order.amount,
      currency: order.currency,
      name: 'Myha Couture',
      description: 'Order Payment',
      order_id: order.id,
      handler: (response: any) => {
        console.log('✅ Payment successful:', response);

        // Merge address lines into one full address for backend
        const fullAddress = `${this.checkoutData.addressLine1}, ${this.checkoutData.addressLine2 || ''}`.trim();

        const orderData = {
          razorpayPaymentId: response.razorpay_payment_id,
          razorpayOrderId: response.razorpay_order_id,
          checkoutData: {
            ...this.checkoutData,
            address: fullAddress // ✅ unified address field for backend
          },
          cartItems: this.cartItems,
          totalAmount: this.totalAmount,
          paymentType: 'Prepaid'
        };

        this.http.post<any>(`${this.baseUrl}/save-order`, orderData)
          .subscribe({
            next: (res) => {
              if (res.orderId) {
                localStorage.removeItem('cart');
                this.cartItems = [];
                this.router.navigate(['/order-success'], { queryParams: { orderId: res.orderId } });
              }
            },
            error: (err) => {
              console.error("❌ Order save failed:", err);
              alert("❌ Could not save order.");
            }
          });
      },
      prefill: {
        name: this.checkoutData.name,
        email: this.checkoutData.email,
        contact: this.checkoutData.phone
      },
      theme: {
        color: '#3399cc'
      }
    };

    const rzp = new Razorpay(options);
    rzp.open();
  }
}

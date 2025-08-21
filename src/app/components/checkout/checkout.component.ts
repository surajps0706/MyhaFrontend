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
  imports: [CommonModule, FormsModule, HttpClientModule,],
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

  // ✅ Base URL from environment
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

    // ✅ use environment URL
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
      key: 'rzp_test_VSPMG0czjNmS4T', // Razorpay Test Key
      amount: order.amount,
      currency: order.currency,
      name: 'Myha Couture',
      description: 'Order Payment',
      order_id: order.id,
      handler: (response: any) => {
        console.log('Payment successful:', response);

        const tempOrderId = `TEMP-${order.id}`;
        const orderData = {
          tempOrderId: tempOrderId,
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id,
          checkoutData: this.checkoutData,
          cartItems: this.cartItems,
          totalAmount: this.totalAmount,
          status: 'Pending Delivery',
          createdAt: new Date()
        };

        // ✅ use environment URL
        this.http.post(`${this.baseUrl}/save-order`, orderData)
          .subscribe({
            next: () => {
              localStorage.removeItem('cart');
              this.cartItems = [];
              this.router.navigate(['/order-success'], { 
                queryParams: { orderId: tempOrderId }
              });
            },
            error: err => {
              console.error('Error saving order:', err);
              alert('⚠️ Payment done but could not save order.');
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

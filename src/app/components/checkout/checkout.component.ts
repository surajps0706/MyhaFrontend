import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

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

  constructor(private http: HttpClient) {}

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
    if (!this.checkoutData.name || !this.checkoutData.phone || !this.checkoutData.addressLine1) {
      alert('⚠️ Please fill all required fields before placing your order.');
      return;
    }

    this.http.post('http://localhost:8000/create-order', { amount: this.totalAmount })
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
      key: 'rzp_test_VSPMG0czjNmS4T', // Replace with your Razorpay Test Key
      amount: order.amount,
      currency: order.currency,
      name: 'MyhaCouture',
      description: 'Order Payment',
      order_id: order.id,
      handler: (response: any) => {
        console.log('Payment successful:', response);
        alert('✅ Payment successful!');
        localStorage.removeItem('cart');
        this.cartItems = [];
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

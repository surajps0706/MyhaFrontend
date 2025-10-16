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
  shippingCost: number = 0;
grandTotal: number = 0;
couponCode: string = '';
discountAmount: number = 0;
couponSuccess: boolean = false;
couponError: boolean = false;


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
    if (!this.checkoutData.name || !this.checkoutData.phone || !this.checkoutData.addressLine1 || !this.checkoutData.email || !this.checkoutData.pincode || !this.checkoutData.city || !this.checkoutData.state) {
      alert('⚠️ Please fill all required fields before placing your order.');
      return;
    }

    this.http.post(`${this.baseUrl}/create-order`, { amount: this.grandTotal })
      .subscribe({
        next: (order: any) => this.openRazorpay(order),
        error: err => {
          console.error('Error creating order:', err);
          alert('❌ Could not initiate payment.');
        }
      });
  }

  
onPincodeChange() {
  if (this.checkoutData.pincode && this.checkoutData.pincode.length === 6) {
    this.http
      .get<{ total_amount: number }>(
        `${this.baseUrl}/shipping-charge?d_pin=${this.checkoutData.pincode}`
      )
      .subscribe({
        next: (res) => {
          const packing = res?.total_amount ?? 0;

          this.shippingCost = Math.round(packing + 20);

          // ✅ Keep coupon discount in final total
          const discount = this.discountAmount || 0;
          this.grandTotal = Math.round(this.totalAmount + this.shippingCost - discount);

          console.log(
            "✅ Shipping cost applied:",
            this.shippingCost,
            "Discount:",
            discount,
            "Grand total:",
            this.grandTotal
          );
        },
        error: (err) => {
          console.error("❌ Failed to fetch shipping cost:", err);
          this.shippingCost = 0;

          // ✅ Even in case of error, retain discount
          const discount = this.discountAmount || 0;
          this.grandTotal = Math.round(this.totalAmount - discount);
        },
      });
  } else {
    this.shippingCost = 0;

    // ✅ Still retain discount when pincode is cleared
    const discount = this.discountAmount || 0;
    this.grandTotal = Math.round(this.totalAmount - discount);
  }
}


openRazorpay(order: any) {
  const options = {
    key: environment.razorpayKey,
    amount: Math.round(this.grandTotal) * 100, // ✅ amount in paise
    currency: order.currency || 'INR',
    name: 'Myha Couture',
    description: 'Order Payment',
    order_id: order.razorpay_order.id, // ✅ FIXED: use nested ID from backend
    handler: (response: any) => {
      console.log('✅ Payment successful:', response);

      const fullAddress = `${this.checkoutData.addressLine1}, ${this.checkoutData.addressLine2 || ''}`.trim();

      const orderData = {
        razorpayPaymentId: response.razorpay_payment_id,
        razorpayOrderId: order.razorpay_order.id, // ✅ FIXED here too
        checkoutData: {
          ...this.checkoutData,
          address: fullAddress
        },
        cartItems: this.cartItems,
        grandTotal: Math.round(this.grandTotal),
        shippingCost: Math.round(this.shippingCost),
        totalAmount: this.totalAmount,
        paymentType: 'Prepaid'
      };

      this.http.post<any>(`${this.baseUrl}/save-order`, orderData)
        .subscribe({
          next: (res) => {
            if (res.orderId) {
              this.shippingCost = res.shippingCost;
              this.grandTotal = res.grandTotal;

              localStorage.removeItem('cart');
              this.cartItems = [];
              this.router.navigate(['/order-success'], {
                queryParams: {
                  orderId: res.orderId,
                  total: res.grandTotal
                }
              });
            }
          },
          error: (err) => {
            console.error('❌ Order save failed:', err);
            alert('❌ Could not save order.');
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



validCoupons = [
  { code: 'MYHADIWALI15', discountType: 'percentage', value: 15 },  // 10% off
  // { code: 'WELCOME100', discountType: 'flat', value: 100 }    // ₹100 off
];

applyCoupon() {
  const enteredCode = this.couponCode.trim().toUpperCase();
  const coupon = this.validCoupons.find(c => c.code === enteredCode);

  if (!coupon) {
    this.couponSuccess = false;
    this.couponError = true;
    this.discountAmount = 0;
    this.updateGrandTotal();
    return;
  }

  // Calculate discount
  if (coupon.discountType === 'percentage') {
    this.discountAmount = (this.totalAmount * coupon.value) / 100;
  } else if (coupon.discountType === 'flat') {
    this.discountAmount = coupon.value;
  }

  // Apply discount
  this.couponSuccess = true;
  this.couponError = false;
  this.updateGrandTotal();
}

updateGrandTotal() {
  const delivery = this.shippingCost || 0;
  const discount = this.discountAmount || 0;
  this.grandTotal = this.totalAmount + delivery - discount;
}

}

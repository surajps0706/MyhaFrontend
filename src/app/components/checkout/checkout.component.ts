import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
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
handlingCharge: number = 0;
agreedToTerms: boolean = false;

isLoggedIn = false;
userRole: string | null = null;





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

  constructor(private http: HttpClient, private router: Router, private authService: AuthService) {}

ngOnInit(): void {

  this.isLoggedIn = this.authService.isLoggedIn();
this.userRole = this.authService.getUserRole();

  // ✅ Load cart from localStorage
  this.cartItems = JSON.parse(localStorage.getItem('cart') || '[]');

  // ✅ If cart is empty, prevent proceeding
  if (!this.cartItems.length) {
    alert('🛒 Your cart is empty. Please add items before checkout.');
    this.router.navigate(['/products']);
    return;
  }

  // ✅ Initialize totals immediately
  this.updateGrandTotal();

  // ✅ Auto-fetch shipping cost if pincode already entered (e.g. returning user)
  if (this.checkoutData.pincode && this.checkoutData.pincode.length === 6) {
    this.onPincodeChange();
  }

  console.log('🛍️ Cart loaded:', this.cartItems);
  console.log('💰 Initial grand total:', this.grandTotal);
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
  // ✅ Step 1: Basic validation
  if (
    !this.checkoutData.name ||
    !this.checkoutData.phone ||
    !this.checkoutData.email ||
    !this.checkoutData.addressLine1 ||
    !this.checkoutData.city ||
    !this.checkoutData.state ||
    !this.checkoutData.pincode
  ) {
    alert('⚠️ Please fill all required fields before placing your order.');
    return;
  }

  // ✅ Step 2: Clean & validate amount
  const cleanAmount = Number(this.grandTotal) || 0;
  if (cleanAmount <= 0) {
    alert('⚠️ Invalid amount. Please refresh or recheck your cart.');
    return;
  }

  // ✅ Step 3: Build proper payload
  const payload = {
  amount: cleanAmount,
  currency: 'INR',
  destination_pincode: this.checkoutData.pincode,
  mode: this.isLoggedIn ? 'user' : 'guest',   // NEW
  userId: this.isLoggedIn ? this.authService.getUserToken() : null, // optional future
  notes: {
    name: this.checkoutData.name,
    phone: this.checkoutData.phone,
  }
};


  console.log('📦 Payload sent to backend:', payload);

  // ✅ Step 4: Create Razorpay order
  this.http.post(`${this.baseUrl}/create-order`, payload).subscribe({
    next: (order: any) => {
      console.log('✅ Order created successfully:', order);
      this.openRazorpay(order);
    },
    error: (err) => {
      console.error('❌ Error creating order:', err);
      if (err?.error?.error) {
        alert(`❌ ${err.error.error}`);
      } else {
        alert('❌ Could not initiate payment. Please try again.');
      }
    },
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
          this.shippingCost = Math.round(packing + 20); // base + packing

          // ✅ Now merge handling logic into delivery
          this.updateGrandTotal();
        },
        error: (err) => {
          console.error("❌ Failed to fetch shipping cost:", err);
          this.shippingCost = 0;
          this.updateGrandTotal();
        },
      });
  } else {
    this.shippingCost = 0;
    this.updateGrandTotal();
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
  mode: this.isLoggedIn ? 'user' : 'guest',   // ✅ NEW
userId: this.isLoggedIn ? this.authService.getUserToken() : null,
  razorpayPaymentId: response.razorpay_payment_id,
  razorpayOrderId: order.razorpay_order.id,
  orderId: order.orderId,
  checkoutData: {
    name: this.checkoutData.name,
    phone: this.checkoutData.phone,
    email: this.checkoutData.email,
    addressLine1: this.checkoutData.addressLine1,
    addressLine2: this.checkoutData.addressLine2 || "",
    address: fullAddress,
    city: this.checkoutData.city,
    state: this.checkoutData.state,
    pincode: this.checkoutData.pincode
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
  { code: 'MYHADIWALI10', discountType: 'percentage', value: 10 },  // 10% off
   { code: 'myhadiwali10', discountType: 'percentage', value: 10 },
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
  const discount = this.discountAmount || 0;

  // ✅ Calculate total quantity of all items
  const totalQty = this.cartItems.reduce(
    (sum, item) => sum + (item.quantity || 1),
    0
  );

  // ✅ Base delivery (fetched or default)
  let delivery = this.shippingCost || 0;

  // ✅ Add ₹20 extra to delivery if 3 or more items
  if (totalQty >= 3) {
    delivery += 20;
  }

  // ✅ Save updated delivery cost
  this.shippingCost = delivery;

  // ✅ Final grand total
  this.grandTotal = this.totalAmount + this.shippingCost - discount;

  console.log(
    `🚚 Delivery: ₹${this.shippingCost} (Qty ${totalQty}), Grand Total: ₹${this.grandTotal}`
  );
}

tac(){
  this.router.navigate(['/terms-and-conditions'])
}


getTotalQuantity(): number {
  return this.cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
}



}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { timeout } from 'rxjs';

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
  isCreatingOrder = false;
  couponCode: string = '';
  discountAmount: number = 0;
  couponSuccess: boolean = false;
  couponError: boolean = false;
  handlingCharge: number = 0;
  agreedToTerms: boolean = false;
  shippingCalculated = false;
shippingLoading = false;
pricesRefreshed = false;

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

  constructor(private http: HttpClient, private router: Router, private authService: AuthService) { }

 

ngOnInit(): void {

  this.isLoggedIn = this.authService.isLoggedIn();
  this.userRole = this.authService.getUserRole();

  // Load cart from localStorage
  this.cartItems = JSON.parse(localStorage.getItem('cart') || '[]');

  // Stop if cart is empty
  if (!this.cartItems.length) {
    alert('🛒 Your cart is empty. Please add items before checkout.');
    this.router.navigate(['/products']);
    return;
  }

  // Do not allow checkout until prices are verified
  this.pricesRefreshed = false;

  console.log('🛍️ Cart loaded:', this.cartItems);

  // Fetch latest products and refresh all cart prices
  this.refreshCartPrices();

}




refreshCartPrices(): void {

  // Block checkout while prices are being verified
  this.pricesRefreshed = false;

  this.http.get<any[]>(`${this.baseUrl}/products`).subscribe({

    next: (products) => {

      this.cartItems = this.cartItems.map(item => {

        const latest = products.find(p =>
          String(p.id || p._id) === String(item.id || item._id)
        );

        // Product no longer exists
        if (!latest) {
          return {
            ...item,
            isUnavailable: true,
            isSoldOut: true
          };
        }

        // Refresh product details while preserving customer selections
        const updated = {
          ...item,
          ...latest,

          selectedSize: item.selectedSize,
          measurements: item.measurements,
          quantity: item.quantity,

          sleeveType: item.sleeveType,
          preferredHeight: item.preferredHeight,
          hasHeightCustomization: item.hasHeightCustomization,

          hasNeckCustomization: item.hasNeckCustomization,
          neckCustomization: item.neckCustomization,

          hasBuiltInPads: item.hasBuiltInPads,
          customizationNotes: item.customizationNotes,

          isUnavailable: false,

          isSoldOut:
            latest.isSoldOut === true ||
            (
              latest.stock !== undefined &&
              latest.stock !== null &&
              Number(latest.stock) <= 0
            )
        };

        // --------------------------------
        // 1. RECALCULATE SLEEVE PRICE
        // --------------------------------

        const fabricPrice = Number(latest.fabricBasePrice || 0);

        const sleevePrices: { [key: string]: number } =
          latest.enableFabricPrice === true && fabricPrice > 0
            ? {
                'Small Sleeve': 0,
                'Small Sleeves': 0,
                'Half Sleeve': Math.round(fabricPrice / 2),
                '3/4 Sleeve': Math.round(fabricPrice * 0.75),
                'Full Sleeve': fabricPrice
              }
            : {
                'Small Sleeve': 0,
                'Small Sleeves': 0,
                'Elbow Sleeves': 50,
                '3/4 Sleeves': 70,
                '3/4 Sleeve': 70,
                'Full Sleeve': 100
              };

        updated.sleevePrice =
          sleevePrices[item.sleeveType] ?? 0;


        // --------------------------------
        // 2. RECALCULATE HEIGHT CHARGE
        // --------------------------------

        updated.extraHeightPrice =
          item.hasHeightCustomization === true &&
          latest.enableHeightCustomization === true &&
          latest.category?.toLowerCase() === 'kurti' &&
          Number(item.preferredHeight) > 35
            ? 150
            : 0;


        // --------------------------------
        // 3. RECALCULATE BUST CHARGE
        // --------------------------------

        updated.bustExtra =
          Number(item.measurements?.bust) >= 45
            ? 150
            : 0;


        // --------------------------------
        // 4. RECALCULATE BUILT-IN PADS
        // --------------------------------

        updated.builtInPadsPrice =
          item.hasBuiltInPads === true &&
          latest.enableBuiltInPads === true
            ? 200
            : 0;


        return updated;

      });


      // --------------------------------
      // SAVE UPDATED CART
      // --------------------------------

      localStorage.setItem(
        'cart',
        JSON.stringify(this.cartItems)
      );


      // --------------------------------
      // RECALCULATE GRAND TOTAL
      // --------------------------------

      this.updateGrandTotal();


      // Price verification succeeded
      this.pricesRefreshed = true;


      console.log('✅ Cart prices refreshed:', this.cartItems);
      console.log('💰 Updated grand total:', this.grandTotal);


      // --------------------------------
      // CHECK PRODUCT AVAILABILITY
      // --------------------------------

      if (
        this.cartItems.some(item =>
          item.isSoldOut === true ||
          item.isUnavailable === true
        )
      ) {

        alert(
          'Some products in your cart are sold out or unavailable. Please review your cart before checkout.'
        );

      }

    },

    error: (err) => {

      console.error(
        '❌ Could not refresh product prices:',
        err
      );

      // Keep checkout blocked
      this.pricesRefreshed = false;

      alert(
        'Unable to verify current product prices. Please refresh the page and try again.'
      );

    }

  });

}




  

getItemTotal(item: any): number {

  const basePrice = Number(
    item.price?.toString().replace(/[^0-9.]/g, '') || 0
  );

  const sleevePrice = Number(item.sleevePrice || 0);

  const heightPrice = Number(item.extraHeightPrice || 0);

  const bustPrice = Number(item.bustExtra || 0);

  const builtInPadsPrice = item.hasBuiltInPads === true
    ? Number(item.builtInPadsPrice ?? 0)
    : 0;

  const qty = Number(item.quantity) || 1;

  return (
    basePrice +
    sleevePrice +
    heightPrice +
    bustPrice +
    builtInPadsPrice
  ) * qty;

}



  get totalAmount(): number {
    return this.cartItems.reduce((total, item) => total + this.getItemTotal(item), 0);
  }

  onPhoneInput(): void {
  this.checkoutData.phone = this.checkoutData.phone
    .replace(/[^0-9]/g, '')
    .slice(0, 10);
}

 

placeOrder(): void {

  // 1. Verify current product prices
  if (!this.pricesRefreshed) {
    alert('Please wait until current product prices are verified.');
    return;
  }

  // 2. Check product availability
  if (this.cartItems.some(item =>
    item.isSoldOut === true || item.isUnavailable === true
  )) {
    alert('Your cart contains unavailable products. Please review your cart.');
    return;
  }

  // 3. Prevent empty cart
  if (!this.cartItems.length) {
    alert('Your cart is empty.');
    return;
  }

  // 4. Prevent duplicate order creation
  if (this.isCreatingOrder) {
    return;
  }

  // 5. Validate customer name
  if (!this.checkoutData.name?.trim()) {
    alert('Please enter your full name.');
    return;
  }

  // 6. Clean customer details
  this.checkoutData.name = this.checkoutData.name.trim();
  this.checkoutData.phone = this.checkoutData.phone?.trim() || '';
  this.checkoutData.email = this.checkoutData.email?.trim() || '';
  this.checkoutData.addressLine1 = this.checkoutData.addressLine1.trim();

  // 7. Validate required fields
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

  // 8. Validate exactly 10 phone digits
  if (!/^[0-9]{10}$/.test(this.checkoutData.phone)) {
    alert('Please enter a valid 10-digit phone number.');
    return;
  }

  // 9. Validate amount
  const cleanAmount = Number(this.grandTotal);

  if (!Number.isFinite(cleanAmount) || cleanAmount <= 0) {
    alert('⚠️ Invalid amount. Please refresh or recheck your cart.');
    return;
  }

  // 10. Build checkout payload
  const payload = {
    amount: cleanAmount,
    currency: 'INR',

    destination_pincode: this.checkoutData.pincode,

    mode: this.isLoggedIn ? 'user' : 'guest',

    userId: this.isLoggedIn
      ? this.authService.getUserToken()
      : null,

    notes: {
      name: this.checkoutData.name,
      phone: this.checkoutData.phone
    },

    checkoutData: this.checkoutData,

    cartItems: this.cartItems,

    cartTotal: this.totalAmount,

    shippingCost: this.shippingCost,

    grandTotal: this.grandTotal,

    paymentType: 'Prepaid'
  };

  console.log('📦 Payload sent to backend:', payload);

  // 11. Lock button while creating payment order
  this.isCreatingOrder = true;

  // 12. Create Razorpay order
  this.http.post(`${this.baseUrl}/create-order`, payload).subscribe({

    next: (order: any) => {

      console.log('✅ Order created successfully:', order);

      // Keep lock active while Razorpay payment is processing
      this.openRazorpay(order);

    },

    error: (err) => {

      this.isCreatingOrder = false;

      console.error('❌ Error creating order:', err);

      if (err?.error?.error) {
        alert(`❌ ${err.error.error}`);
      } else if (err?.error?.detail) {
        alert(`❌ ${err.error.detail}`);
      } else {
        alert('❌ Could not initiate payment. Please try again.');
      }

    }

  });

}




  onPincodeChange() {

  if (
    this.checkoutData.pincode &&
    this.checkoutData.pincode.length === 6
  ) {

    // 🔒 Block payment button while fetching
    this.shippingLoading = true;
    this.shippingCalculated = false;

    this.http
      .get<{ total_amount: number }>(
        `${this.baseUrl}/shipping-charge?d_pin=${this.checkoutData.pincode}`
      )
      .subscribe({

        next: (res) => {

          const packing = res?.total_amount ?? 0;

          // Delivery + packing charge
          this.shippingCost = Math.round(
            packing + 20
          );

          // Update final payable amount
          this.updateGrandTotal();


          // ✅ Now payment can be enabled
          this.shippingCalculated = true;
          this.shippingLoading = false;

        },


        error: (err) => {

          console.error(
            "❌ Failed to fetch shipping cost:",
            err
          );

          this.shippingCost = 0;

          this.updateGrandTotal();


          // ❌ Keep payment disabled
          this.shippingCalculated = false;
          this.shippingLoading = false;

          alert(
            "Unable to calculate delivery charge. Please check pincode again."
          );

        }

      });


  } else {

    this.shippingCost = 0;

    this.updateGrandTotal();

    // ❌ Invalid pincode means no payment
    this.shippingCalculated = false;
    this.shippingLoading = false;

  }

}


 

async openRazorpay(order: any) {
  const razorpayOrderId = order.razorpay_order.id;
  const orderId = order.orderId;

  const options = {
    key: environment.razorpayKey,
    amount: order.razorpay_order.amount,
    currency: order.currency || 'INR',
    name: 'Myha Couture',
    description: 'Order Payment',
    order_id: razorpayOrderId,

    handler: async (response: any) => {
      console.log('Payment successful:', response);

      const fullAddress =
        `${this.checkoutData.addressLine1}, ${this.checkoutData.addressLine2 || ''}`.trim();

      const orderData = {
        mode: this.isLoggedIn ? 'user' : 'guest',
        userId: this.isLoggedIn
          ? this.authService.getUserToken()
          : null,

        razorpayPaymentId: response.razorpay_payment_id,
        razorpayOrderId: response.razorpay_order_id,
        razorpaySignature: response.razorpay_signature,
        orderId: orderId,

        checkoutData: {
          name: this.checkoutData.name,
          phone: this.checkoutData.phone,
          email: this.checkoutData.email,
          addressLine1: this.checkoutData.addressLine1,
          addressLine2: this.checkoutData.addressLine2 || '',
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

      // Complete the order only after backend confirms payment.
      const completeOrder = (res: any) => {
        if (res.grandTotal !== undefined && res.grandTotal !== null) {
          this.grandTotal = res.grandTotal;
        }

        if (res.shippingCost !== undefined && res.shippingCost !== null) {
          this.shippingCost = res.shippingCost;
        }

        localStorage.removeItem('cart');
        this.cartItems = [];

        this.router.navigate(['/order-success'], {
          queryParams: {
            orderId: orderId,
            total: this.grandTotal
          }
        });
      };

      // First attempt: save and verify payment directly.
      try {
        const res = await firstValueFrom(
          this.http.post<any>(
            `${this.baseUrl}/save-order`,
            orderData
          ).pipe(timeout(10000))
        );

        console.log('Save order response:', res);

        if (res?.paymentStatus === 'Paid') {
          completeOrder(res);
          return;
        }

      } catch (err) {
        console.error('Direct order confirmation failed:', err);
      }

      // Fallback: wait for webhook confirmation.
      console.log('Checking payment confirmation through backend...');

      for (let attempt = 1; attempt <= 20; attempt++) {
        try {
          const status = await firstValueFrom(
            this.http.get<any>(
              `${this.baseUrl}/order-payment-status/${orderId}`,
              {
                params: {
                  razorpayOrderId: razorpayOrderId
                }
              }
            ).pipe(timeout(5000))
          );

          console.log(
            `Payment status check ${attempt}:`,
            status.paymentStatus
          );

          if (status?.paymentStatus === 'Paid') {
            completeOrder(status);
            return;
          }

        } catch (err) {
          console.error(
            `Payment status check ${attempt} failed:`,
            err
          );
        }

        // Wait 3 seconds before the next check.
        if (attempt < 20) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      // Do not clear the cart or allow another payment automatically.
      alert(
        `Your payment was successful, but order confirmation is taking longer than expected.\n\n` +
        `Order ID: ${orderId}\n\n` +
        `Please DO NOT make another payment. Contact support with this Order ID.`
      );
    },

    prefill: {
      name: this.checkoutData.name,
      email: this.checkoutData.email,
      contact: this.checkoutData.phone
    },

    modal: {
      ondismiss: () => {
        console.log('Razorpay payment window closed.');

        // Allow retry only when the payment window is closed.
        this.isCreatingOrder = false;
      }
    },

    theme: {
      color: '#3399cc'
    }
  };

  const rzp = new Razorpay(options);

  rzp.open();
}





  validCoupons = [
    { code: 'MYHA20', discountType: 'percentage', value: 20 },  // 10% off
    //  { code: 'myhadiwali10', discountType: 'percentage', value: 10 },
    // { code: 'WELCOME100', discountType: 'flat', value: 100 }    // ₹100 off
  ];

  // applyCoupon() {
  //   const enteredCode = this.couponCode.trim().toUpperCase();
  //   const coupon = this.validCoupons.find(c => c.code === enteredCode);

  //   if (!coupon) {
  //     this.couponSuccess = false;
  //     this.couponError = true;
  //     this.discountAmount = 0;
  //     this.updateGrandTotal();
  //     return;
  //   }

  //   // Calculate discount
  //   if (coupon.discountType === 'percentage') {
  //     this.discountAmount = (this.totalAmount * coupon.value) / 100;
  //   } else if (coupon.discountType === 'flat') {
  //     this.discountAmount = coupon.value;
  //   }

  //   // Apply discount
  //   this.couponSuccess = true;
  //   this.couponError = false;
  //   this.updateGrandTotal();
  // }


  // updateGrandTotal() {
  //   const discount = this.discountAmount || 0;

  //   const totalQty = this.cartItems.reduce(
  //     (sum, item) => sum + (item.quantity || 1),
  //     0
  //   );

  //   // 🚀 TEMPORARY FREE SHIPPING
  //   this.shippingCost = 0;

  //   this.grandTotal = this.totalAmount + this.shippingCost - discount;

  //   console.log(
  //     `🚚 Delivery: ₹${this.shippingCost} (FREE SHIPPING ACTIVE), Grand Total: ₹${this.grandTotal}`
  //   );
  // }

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

  tac() {
    this.router.navigate(['/terms-and-conditions'])
  }


  getTotalQuantity(): number {
    return this.cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }



}

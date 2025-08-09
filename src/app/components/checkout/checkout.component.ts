import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  objectKeys = Object.keys;

  ngOnInit(): void {
    this.cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
    console.log('Cart items on checkout:', this.cartItems);
  }

  /** Calculate total price for one item */
  getItemTotal(item: any): number {
    const basePrice = Number(item.price?.toString().replace(/[^0-9]/g, '') || 0);
    const sleevePrice = Number(item.sleevePrice || 0);
    const heightPrice = Number(item.extraHeightPrice || 0);
    const qty = item.quantity || 1;

    return (basePrice + sleevePrice + heightPrice) * qty;
  }

  /** Calculate grand total */
  get totalAmount(): number {
    return this.cartItems.reduce((total: number, item: any) => total + this.getItemTotal(item), 0);
  }

  /** Place order action */
placeOrder(): void {
  if (!this.checkoutData.name || !this.checkoutData.phone || !this.checkoutData.addressLine1) {
    alert('⚠️ Please fill all required fields before placing your order.');
    return;
  }

  const orderDetails = {
    customer: { ...this.checkoutData },
    items: this.cartItems,
    total: this.totalAmount,
    timestamp: new Date()
  };

  console.table(orderDetails);
  alert('✅ Your order has been placed successfully!');

  localStorage.removeItem('cart');
  this.cartItems = [];
}

}

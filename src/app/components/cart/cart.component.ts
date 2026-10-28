import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; 

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  cartItems: any[] = [];
  objectKeys = Object.keys;

  baseTotal: number = 0;
  sleeveTotal: number = 0;
  heightTotal: number = 0;
  handlingCharge: number = 0;
  total: number = 0;
  totalQty: number = 0;
  builtInPadsTotal: number = 0;

  constructor(private cartService: CartService, private router: Router) {}

  ngOnInit(): void {
    this.cartItems = this.cartService.getCart() || [];

    // ✅ Ensure quantity defaults
    this.cartItems.forEach(item => {
      if (!item.quantity || item.quantity < 1) item.quantity = 1;
    });

    this.updateTotal();
  }

  updateQuantity(index: number, quantity: number): void {
    if (quantity < 1) return; // prevent 0 or negative qty

    this.cartItems[index].quantity = quantity;
    this.cartService.updateCart(this.cartItems);

    this.updateTotal(); // refresh totals immediately
  }

  removeItem(index: number): void {
    this.cartItems.splice(index, 1);
    this.cartService.updateCart(this.cartItems);
    this.updateTotal();
  }

  clearCart(): void {
    this.cartItems = [];
    this.cartService.updateCart(this.cartItems);
    this.updateTotal();
  }

  hasMeasurements(measurements: any): boolean {
    if (!measurements) return false;
    return Object.values(measurements).some(
      (value: any) => typeof value === 'string' && value.trim() !== ''
    );
  }


updateTotal(): void {
  this.baseTotal = 0;
  this.sleeveTotal = 0;
  this.heightTotal = 0;
  this.builtInPadsTotal = 0;
  this.totalQty = 0;

  this.cartItems.forEach(item => {
    const basePrice = Number(
      item.price?.toString().replace(/[^0-9.]/g, '') || 0
    );

    const sleevePrice = Number(item.sleevePrice || 0);
    const heightPrice = Number(item.extraHeightPrice || 0);

    // Charge pads only when selected
    const builtInPadsPrice = item.hasBuiltInPads
      ? Number(item.builtInPadsPrice || 200)
      : 0;

    const qty = Number(item.quantity) || 1;

    this.baseTotal += basePrice * qty;
    this.sleeveTotal += sleevePrice * qty;
    this.heightTotal += heightPrice * qty;
    this.builtInPadsTotal += builtInPadsPrice * qty;
    this.totalQty += qty;
  });

  // Existing handling charge
  this.handlingCharge = this.totalQty >= 3 ? 20 : 0;

  this.total =
    this.baseTotal +
    this.sleeveTotal +
    this.heightTotal +
    this.builtInPadsTotal +
    this.handlingCharge;
}


getItemTotal(item: any): number {
  const base = Number(
    item.price?.toString().replace(/[^0-9.]/g, '') || 0
  );

  const sleeve = Number(item.sleevePrice || 0);
  const height = Number(item.extraHeightPrice || 0);
  const pads = item.hasBuiltInPads
    ? Number(item.builtInPadsPrice || 200)
    : 0;

  return (base + sleeve + height + pads) * (Number(item.quantity) || 1);
}


  goToCheckout(): void {
    this.cartItems = this.cartItems.map(item => ({
      ...item,
      measurements: item.measurements || {},
      customizationNotes: item.customizationNotes || ''
    }));

    localStorage.setItem('cart', JSON.stringify(this.cartItems));
    this.router.navigate(['/checkout']);
  }
}

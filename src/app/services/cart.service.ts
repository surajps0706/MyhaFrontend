// src/app/services/cart.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root', // 👈 makes this service available app-wide
})
export class CartService {
  private cartKey = 'cart';  // localStorage key

getCart(): any[] {
  try {
    const cart = JSON.parse(localStorage.getItem(this.cartKey) || '[]');
    return Array.isArray(cart) ? cart : [];
  } catch (err) {
    console.error('❌ Failed to parse cart:', err);
    return [];
  }
}


  addToCart(product: any) {
    const cart = this.getCart();
    cart.push(product);
    localStorage.setItem(this.cartKey, JSON.stringify(cart));
  }

  updateCart(cart: any[]) {
  localStorage.setItem(this.cartKey, JSON.stringify(cart));
}


  clearCart() {
    localStorage.removeItem(this.cartKey);
  }

  removeItem(index: number) {
    const cart = this.getCart();
    cart.splice(index, 1);
    localStorage.setItem(this.cartKey, JSON.stringify(cart));
  }
}

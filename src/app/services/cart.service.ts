// src/app/services/cart.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root', // 👈 makes this service available app-wide
})
export class CartService {
  private cartKey = 'cart';  // localStorage key

  // Observable for cart count
  private cartCountSource = new BehaviorSubject<number>(0);
  cartCount$ = this.cartCountSource.asObservable();

  constructor() {
    // Initialize cart count from storage on service load
    this.cartCountSource.next(this.getCart().length);
  }

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
    this.saveCart(cart);
  }

  updateCart(cart: any[]) {
    this.saveCart(cart);
  }

  clearCart() {
    localStorage.removeItem(this.cartKey);
    this.cartCountSource.next(0);
  }

  removeItem(index: number) {
    const cart = this.getCart();
    cart.splice(index, 1);
    this.saveCart(cart);
  }

  private saveCart(cart: any[]) {
    localStorage.setItem(this.cartKey, JSON.stringify(cart));
    this.cartCountSource.next(cart.length); // Update live count
  }
}

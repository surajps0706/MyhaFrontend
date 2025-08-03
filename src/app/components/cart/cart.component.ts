import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { FormsModule } from '@angular/forms';

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

  constructor(private cartService: CartService) {}

  ngOnInit(): void {
    this.cartItems = this.cartService.getCart();
    // If quantity is missing, set it to 1
    this.cartItems.forEach(item => {
      if (!item.quantity) item.quantity = 1;
    });
    this.updateTotal();
  }

  updateQuantity(index: number, quantity: number) {
    this.cartItems[index].quantity = quantity;
    this.cartService.updateCart(this.cartItems);
    this.updateTotal();
  }

  removeItem(index: number) {
    this.cartItems.splice(index, 1);
    this.cartService.updateCart(this.cartItems);
    this.updateTotal();
  }

  total: number = 0;

  updateTotal() {
    this.total = this.cartItems.reduce((sum, item) => {
      const price = Number(item.price.replace(/[^0-9]/g, ''));
      return sum + price * item.quantity;
    }, 0);
  }
}

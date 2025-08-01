import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  styleUrls: ['./cart.component.css'],
  templateUrl: './cart.component.html'
})
export class CartComponent {
  cartItems = [
    {
      id: 1,
      name: 'Brindha Dress',
      price: 2499,
      quantity: 1,
      image: 'https://res.cloudinary.com/dw35epojg/image/upload/v1753624789/temp-image_m0qua0.jpg'
    },
    {
      id: 2,
      name: 'Sita Anarkali',
      price: 2199,
      quantity: 2,
      image: 'https://res.cloudinary.com/dw35epojg/image/upload/v1753624789/temp-image_m0qua0.jpg'
    }
  ];

  getTotal() {
    return this.cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  removeItem(id: number) {
    this.cartItems = this.cartItems.filter(item => item.id !== id);
  }
}

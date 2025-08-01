import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent {
  checkoutData = {
    name: '',
    email: '',
    phone: '',
    address: '',
    pincode: '',
    city: '',
    state: ''
  };

  placeOrder() {
    // In real app: Send data to backend here
    alert('Order placed successfully!');
    // Navigate to order success
  }
}

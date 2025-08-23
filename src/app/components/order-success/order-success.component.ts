import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CartService } from '../../services/cart.service'; // 👈 import service
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-success.component.html',
  styleUrls: ['./order-success.component.css']
})
export class OrderSuccessComponent implements OnInit {
  orderId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private cartService: CartService // 👈 inject service
  ) {}

  ngOnInit(): void {
 this.route.queryParams.subscribe(params => {
      this.orderId = params['orderId'] || null;
    });
    // ✅ Clear cart once order success page is reached
    this.cartService.clearCart();
  }
}

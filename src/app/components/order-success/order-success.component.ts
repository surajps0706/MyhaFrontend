
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CartService } from '../../services/cart.service';
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

  exchangeRequestId: string | null = null;

  isExchange = false;

  estimatedStart: Date | null = null;

  estimatedEnd: Date | null = null;

  constructor(
    private route: ActivatedRoute,
    private cartService: CartService
  ) {}

  ngOnInit(): void {

    this.route.queryParams.subscribe(params => {

      // Original order ID
      const id = params['orderId'];

      this.orderId = id
        ? String(id)
        : null;

      // Check whether this is an exchange confirmation
      this.isExchange =
        params['type'] === 'exchange';

      // Exchange request ID
      const exchangeId = params['requestId'];

      this.exchangeRequestId =
        exchangeId
          ? String(exchangeId)
          : null;

    });

    // Clear cart only for normal orders
    if (!this.isExchange) {
      this.cartService.clearCart();
    }

    // Calculate estimated delivery only for normal orders
    if (!this.isExchange) {

      const today = new Date();

      const startDate =
        this.addDaysSkippingSundays(today, 12);

      const endDate =
        this.addDaysSkippingSundays(startDate, 12);

      this.estimatedStart = startDate;

      this.estimatedEnd = endDate;

    }

  }

  private addDaysSkippingSundays(
    start: Date,
    daysToAdd: number
  ): Date {

    const date = new Date(start);

    let added = 0;

    while (added < daysToAdd) {

      date.setDate(date.getDate() + 1);

      if (date.getDay() !== 0) {

        added++;

      }

    }

    return date;

  }

}

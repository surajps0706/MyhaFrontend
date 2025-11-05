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
  estimatedStart: Date | null = null;
  estimatedEnd: Date | null = null;

  constructor(
    private route: ActivatedRoute,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const id = params['orderId'];
      this.orderId = id ? String(id) : null;
    });

    // ✅ Clear cart
    this.cartService.clearCart();

    // ✅ Calculate estimated delivery window
    const today = new Date();
    const startDate = this.addDaysSkippingSundays(today, 12); // skip 12 days
    const endDate = this.addDaysSkippingSundays(startDate, 12); // next 12 (excluding Sundays)

    this.estimatedStart = startDate;
    this.estimatedEnd = endDate;
  }

  private addDaysSkippingSundays(start: Date, daysToAdd: number): Date {
    const date = new Date(start);
    let added = 0;

    while (added < daysToAdd) {
      date.setDate(date.getDate() + 1);
      if (date.getDay() !== 0) { // 0 = Sunday
        added++;
      }
    }
    return date;
  }
}

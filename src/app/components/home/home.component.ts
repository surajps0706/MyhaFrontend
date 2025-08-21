import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  styleUrls: ['./home.component.css'],
  templateUrl: './home.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomeComponent implements OnInit {
  products: any[] = [];
  newArrivals: any[] = [];

  constructor(private productService: ProductService) {}

  ngOnInit() {
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data;

        // ✅ Sort by createdAt → latest 3
        this.newArrivals = [...this.products]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 3);

        console.log("✅ New Arrivals:", this.newArrivals);

        // ✅ Re-init Swiper once DOM is ready
        setTimeout(() => {
          const swiperEl: any = document.querySelector('swiper-container');
          if (swiperEl) {
            swiperEl.initialize?.();
            swiperEl.swiper?.update();
          }
        }, 300);
      },
      error: (err) => console.error('Error fetching products:', err)
    });
  }
}

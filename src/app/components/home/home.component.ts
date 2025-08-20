import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  styleUrls: ['./home.component.css'],
  templateUrl: './home.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomeComponent implements OnInit {
  products: any[] = [];
  newArrivals: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<any[]>('http://localhost:8000/products').subscribe({
      next: (data) => {
        this.products = data;

        this.newArrivals = [...this.products]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 3);

        console.log("✅ New Arrivals:", this.newArrivals);

        // ✅ Force re-init once slides are in DOM
        setTimeout(() => {
          const swiperEl: any = document.querySelector('swiper-container');
          if (swiperEl) {
            swiperEl.initialize();
            swiperEl.swiper.update(); // 👈 make sure Swiper counts slides
          }
        }, 300);
      },
      error: (err) => console.error('Error fetching products:', err)
    });
  }
}

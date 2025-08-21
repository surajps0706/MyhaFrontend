import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule]
})
// ...
export class ProductListComponent implements OnInit {
  products: any[] = [];
  filteredProducts: any[] = [];

  selectedCategory: string = 'all';
  priceRange: number = 3000;  

  collapsed = { category: false, price: false };
  mobileFiltersOpen: boolean = false;

  // ✅ Pagination
  currentPage: number = 1;
  pageSize: number = 8; // default (desktop)

  private baseUrl: string = environment.apiUrl;

  constructor(private http: HttpClient) {}

ngOnInit(): void {
  // ✅ Set page size dynamically
  if (window.innerWidth <= 768) {
    this.pageSize = 6; // mobile
  } else {
    this.pageSize = 12; // desktop/laptop
  }

  this.fetchProducts();
}


  fetchProducts() {
    this.http.get<any[]>(`${this.baseUrl}/products`).subscribe({
      next: (data) => {
        this.products = data;
        this.applyFilters();
      },
      error: (err) => {
        console.error('❌ Error fetching products:', err);
      }
    });
  }

  toggleCollapse(filter: 'category' | 'price') {
    this.collapsed[filter] = !this.collapsed[filter];
  }

  toggleMobileFilters() {
    this.mobileFiltersOpen = !this.mobileFiltersOpen;
  }

  applyCategory(category: string) {
    this.selectedCategory = category;
    this.applyFilters();

    if (window.innerWidth <= 992) {
      this.mobileFiltersOpen = false;
    }
  }

  applyPrice() {
    this.applyFilters();
  }

  applyFilters() {
    const filtered = this.products.filter((p) => {
      const matchCategory =
        this.selectedCategory === 'all' ||
        p.category?.toLowerCase() === this.selectedCategory;

      const priceValue =
        typeof p.price === 'number'
          ? p.price
          : parseInt(p.price.toString().replace(/\D/g, ''), 10);

      const matchPrice = priceValue <= this.priceRange;

      return matchCategory && matchPrice;
    });

    this.filteredProducts = filtered;
    this.currentPage = 1;
  }

  // ✅ Pagination
  get paginatedProducts() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredProducts.slice(start, start + this.pageSize);
  }

  get totalPages() {
    return Math.ceil(this.filteredProducts.length / this.pageSize);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  prevPage() {
    if (this.currentPage > 1) this.currentPage--;
  }
}

import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { LoaderComponent } from '../../loader/loader/loader.component';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LoaderComponent]
})
export class ProductListComponent implements OnInit {
  products: any[] = [];
  filteredProducts: any[] = [];
  selectedCategory: string = 'all';
  priceRange: number = 3000;

  collapsed = { category: false, price: false };
  mobileFiltersOpen: boolean = false;

    isLoading: boolean = false;


  // ✅ Pagination
  currentPage: number = 1;
  pageSize: number = 8;

  private baseUrl: string = environment.apiUrl;

  // ✅ Wishlist (store product IDs)
  wishlist: number[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // ✅ Set page size dynamically
    if (window.innerWidth <= 768) {
      this.pageSize = 6; // mobile
    } else {
      this.pageSize = 12; // desktop/laptop
    }
    this.loadWishlist();
    this.fetchProducts();
  }

 fetchProducts() {
  this.isLoading = true;
  this.http.get<any[]>(`${this.baseUrl}/products`).subscribe({
    next: (data) => {
      this.products = data.map(p => ({
        ...p,

        // ✅ normalize images here (CRITICAL)
        images: Array.isArray(p.images)
          ? p.images
          : typeof p.images === 'string'
            ? p.images.split(',').map((i: string) => i.trim())
            : []
      }));

      this.applyFilters();
      this.isLoading = false;
    },
    error: (err) => {
      console.error('❌ Error fetching products:', err);
      this.isLoading = false;
    }
  });
}


getOptimizedImage(url: string, width: number = 600): string {
  if (!url || !url.includes('/image/upload/')) {
    return url; // safety fallback
  }

  return url.replace(
    '/image/upload/',
    `/image/upload/w_${width},q_auto,f_auto/`
  );
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

  // ==========================
  // ✅ WISHLIST LOGIC
  // ==========================
  loadWishlist() {
    const saved = localStorage.getItem('wishlist');
    this.wishlist = saved ? JSON.parse(saved) : [];
  }

  saveWishlist() {
    localStorage.setItem('wishlist', JSON.stringify(this.wishlist));

    // ✅ Notify header instantly
    window.dispatchEvent(new Event('wishlistUpdated'));
  }

  isInWishlist(productId: number): boolean {
    return this.wishlist.includes(productId);
  }

  toggleWishlist(product: any) {
    if (this.isInWishlist(product.id)) {
      // remove
      this.wishlist = this.wishlist.filter((id) => id !== product.id);
    } else {
      // add
      this.wishlist.push(product.id);
    }
    this.saveWishlist();
  }
}

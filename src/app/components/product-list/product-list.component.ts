import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { LoaderComponent } from '../../loader/loader/loader.component';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    LoaderComponent
  ]
})
export class ProductListComponent implements OnInit {

  // ==========================================
  // PRODUCTS
  // ==========================================

  products: any[] = [];
  filteredProducts: any[] = [];

  // ==========================================
  // DYNAMIC CATEGORIES
  // ==========================================

  categories: string[] = [];

  selectedCategory: string = 'all';

  // ==========================================
  // PRICE FILTER
  // ==========================================

  priceRange: number = 3000;

  // ==========================================
  // FILTER UI
  // ==========================================

  collapsed = {
    category: false,
    price: false
  };

  mobileFiltersOpen: boolean = false;

  // ==========================================
  // LOADING
  // ==========================================

  isLoading: boolean = false;

  // ==========================================
  // PAGINATION
  // ==========================================

  currentPage: number = 1;
  pageSize: number = 8;

  // ==========================================
  // API
  // ==========================================

  private baseUrl: string = environment.apiUrl;

  // ==========================================
  // WISHLIST
  // ==========================================

  wishlist: number[] = [];

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute
  ) {}

  // ==========================================
  // INIT
  // ==========================================

  ngOnInit(): void {

    // ==========================
    // PAGE SIZE
    // ==========================

    if (window.innerWidth <= 768) {
      this.pageSize = 6;
    } else {
      this.pageSize = 12;
    }

    // ==========================
    // WISHLIST
    // ==========================

    this.loadWishlist();

    // ==========================
    // CATEGORY FROM URL
    // ==========================

    this.route.queryParams.subscribe(params => {

      const category = params['category'];

      if (category) {

        this.selectedCategory =
          this.normalizeCategory(category);

      } else {

        this.selectedCategory = 'all';

      }

      // If products already loaded,
      // immediately apply the filter.

      if (this.products.length > 0) {
        this.applyFilters();
      }

    });

    // ==========================
    // LOAD PRODUCTS
    // ==========================

    this.fetchProducts();
  }


  // ==========================================
  // FETCH PRODUCTS
  // ==========================================

  fetchProducts(): void {

    this.isLoading = true;

    this.http.get<any[]>(
      `${this.baseUrl}/products`
    ).subscribe({

      next: (data) => {

        this.products = Array.isArray(data)

          ? data
              .map(p => ({

                ...p,

                images: Array.isArray(p.images)

                  ? p.images

                  : typeof p.images === 'string'

                    ? p.images
                        .split(',')
                        .map((i: string) => i.trim())
                        .filter((i: string) => i.length > 0)

                    : []

              }))

              .sort((a, b) =>
                new Date(b.createdAt || 0).getTime() -
                new Date(a.createdAt || 0).getTime()
              )

          : [];


        // ==========================
        // BUILD DYNAMIC CATEGORIES
        // ==========================

        this.buildCategories();


        // ==========================
        // APPLY FILTER
        // ==========================

        this.applyFilters();


        this.isLoading = false;

      },

      error: (err) => {

        console.error(
          '❌ Error fetching products:',
          err
        );

        this.isLoading = false;

      }

    });
  }


  // ==========================================
  // BUILD CATEGORIES DYNAMICALLY
  // ==========================================

  private buildCategories(): void {

    const categoryMap = new Map<string, string>();

    this.products.forEach(product => {

      if (!product.category) {
        return;
      }

      const originalCategory =
        String(product.category).trim();

      if (!originalCategory) {
        return;
      }

      const normalized =
        this.normalizeCategory(originalCategory);

      // Keep one display version for each
      // normalized category.

      if (!categoryMap.has(normalized)) {

        categoryMap.set(
          normalized,
          originalCategory
        );

      }

    });


    this.categories =
      Array.from(categoryMap.values());

  }


  // ==========================================
  // CATEGORY FILTER
  // ==========================================

  applyCategory(category: string): void {

    this.selectedCategory =
      category === 'all'
        ? 'all'
        : this.normalizeCategory(category);

    this.applyFilters();


    // Close mobile filter panel

    if (window.innerWidth <= 992) {
      this.mobileFiltersOpen = false;
    }

  }


  // ==========================================
  // PRICE FILTER
  // ==========================================

  applyPrice(): void {

    this.applyFilters();

  }


  // ==========================================
  // APPLY ALL FILTERS
  // ==========================================

  applyFilters(): void {

    console.log(
      'Selected Category:',
      this.selectedCategory
    );

    console.log(
      'Price Range:',
      this.priceRange
    );


    const filtered =
      this.products.filter((p) => {

        // ==========================
        // CATEGORY
        // ==========================

        const matchCategory =

          this.selectedCategory === 'all'

            ? true

            : this.normalizeCategory(
                p.category
              ) ===
              this.normalizeCategory(
                this.selectedCategory
              );


        // ==========================
        // PRICE
        // ==========================

        const priceValue =

          typeof p.price === 'number'

            ? p.price

            : parseInt(
                p.price
                  ?.toString()
                  .replace(/\D/g, '') || '0',
                10
              );


        const matchPrice =
          priceValue <= this.priceRange;


        return (
          matchCategory &&
          matchPrice
        );

      });


    console.log(
      'Filtered Count:',
      filtered.length
    );


    this.filteredProducts =
      filtered;

    this.currentPage = 1;

  }


  // ==========================================
  // NORMALIZE CATEGORY
  // ==========================================

   normalizeCategory(
    category: string
  ): string {

    return String(category || '')
      .trim()
      .toLowerCase()
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ');

  }


  // ==========================================
  // IMAGE OPTIMIZATION
  // ==========================================

  getOptimizedImage(
    url: string,
    width: number = 600
  ): string {

    if (
      !url ||
      !url.includes('/image/upload/')
    ) {

      return url;

    }


    return url.replace(
      '/image/upload/',
      `/image/upload/w_${width},q_auto,f_auto/`
    );

  }


  // ==========================================
  // FILTER UI
  // ==========================================

  toggleCollapse(
    filter: 'category' | 'price'
  ): void {

    this.collapsed[filter] =
      !this.collapsed[filter];

  }


  toggleMobileFilters(): void {

    this.mobileFiltersOpen =
      !this.mobileFiltersOpen;

  }


  // ==========================================
  // PAGINATION
  // ==========================================

  get paginatedProducts(): any[] {

    const start =
      (this.currentPage - 1) *
      this.pageSize;

    return this.filteredProducts.slice(
      start,
      start + this.pageSize
    );

  }


  get totalPages(): number {

    return Math.ceil(
      this.filteredProducts.length /
      this.pageSize
    );

  }


  nextPage(): void {

    if (
      this.currentPage <
      this.totalPages
    ) {

      this.currentPage++;

    }

  }


  prevPage(): void {

    if (
      this.currentPage > 1
    ) {

      this.currentPage--;

    }

  }


  // ==========================================
  // WISHLIST
  // ==========================================

  loadWishlist(): void {

    const saved =
      localStorage.getItem('wishlist');

    this.wishlist =
      saved
        ? JSON.parse(saved)
        : [];

  }


  saveWishlist(): void {

    localStorage.setItem(
      'wishlist',
      JSON.stringify(this.wishlist)
    );


    // Notify header instantly

    window.dispatchEvent(
      new Event('wishlistUpdated')
    );

  }


  isInWishlist(
    productId: number
  ): boolean {

    return this.wishlist.includes(
      productId
    );

  }


  toggleWishlist(
    product: any
  ): void {

    if (
      this.isInWishlist(product.id)
    ) {

      this.wishlist =
        this.wishlist.filter(
          id => id !== product.id
        );

    } else {

      this.wishlist.push(
        product.id
      );

    }


    this.saveWishlist();

  }

}
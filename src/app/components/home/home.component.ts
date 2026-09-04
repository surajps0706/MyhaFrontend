import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

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

  heroCategories: any[] = [];

  activeCategory = '';
  activeCategoryData: any = null;

  private baseUrl = environment.apiUrl;

  constructor(
    private productService: ProductService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {

    this.productService.getProducts().subscribe({
      next: (data) => {

        this.products = Array.isArray(data)
          ? data.map(product => ({
              ...product,

              images: this.normalizeImages(product.images)
            }))
          : [];

        // ============================
        // NEW ARRIVALS
        // ============================

        this.newArrivals = [...this.products]
          .sort(
            (a, b) =>
              new Date(b.createdAt || 0).getTime() -
              new Date(a.createdAt || 0).getTime()
          )
          .slice(0, 5);

        // ============================
        // BUILD CATEGORY LIST
        // ============================

        this.buildHeroCategories();

        // ============================
        // LOAD ADMIN SELECTED IMAGES
        // ============================

        this.loadHomepageSettings();
      },

      error: (err) => {
        console.error(
          'Error fetching products:',
          err
        );
      }
    });
  }


  // ==========================================
  // LOAD SAVED HOMEPAGE SETTINGS
  // ==========================================

  private loadHomepageSettings(): void {

    this.http.get<any[]>(
      `${this.baseUrl}/homepage/categories`
    ).subscribe({

      next: (settings) => {

        if (!Array.isArray(settings)) {
          return;
        }

        settings.forEach(setting => {

          const category = this.heroCategories.find(
            item =>
              this.normalizeCategory(item.name) ===
              this.normalizeCategory(setting.category)
          );

          if (!category) {
            return;
          }

          // Admin-selected image
          if (setting.heroImage) {
            category.image = setting.heroImage;
          }

          category.productId =
            setting.productId;

          category.imageIndex =
            setting.imageIndex;
        });


        // Keep first category active
        if (this.heroCategories.length > 0) {

          const current =
            this.heroCategories.find(
              category =>
                category.name ===
                this.activeCategory
            );

          this.activeCategoryData =
            current || this.heroCategories[0];

          this.activeCategory =
            this.activeCategoryData.name;
        }
      },

      error: (err) => {

        console.error(
          'Failed to load homepage settings:',
          err
        );

        // IMPORTANT:
        // Homepage still works even if no
        // admin setting exists yet.
      }
    });
  }


  // ==========================================
  // BUILD CATEGORIES
  // ==========================================

  private buildHeroCategories(): void {

    const categoryMap: {
      [key: string]: {
        displayName: string;
        count: number;
        image: string;
      }
    } = {};


    this.products.forEach(product => {

      if (!product.category) {
        return;
      }

      const originalCategory =
        String(product.category).trim();

      if (!originalCategory) {
        return;
      }

      const normalizedCategory =
        this.normalizeCategory(originalCategory);

      let categoryKey =
        normalizedCategory;

      let displayName =
        originalCategory;


      // ============================
      // STANDARD CATEGORY NAMES
      // ============================

      if (
        normalizedCategory === 'co ord set' ||
        normalizedCategory === 'co ord sets'
      ) {

        categoryKey = 'co ord set';
        displayName = 'co-ord set';

      } else if (
        normalizedCategory === 'kurta'
      ) {

        categoryKey = 'kurta';
        displayName = 'Kurta';

      } else if (
        normalizedCategory === 'kurti'
      ) {

        categoryKey = 'kurti';
        displayName = 'Kurti';
      }


      // ============================
      // CREATE CATEGORY
      // ============================

      if (!categoryMap[categoryKey]) {

        categoryMap[categoryKey] = {

          displayName,

          count: 0,

          // Temporary fallback image.
          // Admin setting will replace this.
          image: this.getProductImage(product)
        };
      }


      categoryMap[categoryKey].count++;

    });


    // ============================
    // PREFERRED ORDER
    // ============================

    const preferredOrder = [
      'co ord set',
      'kurta',
      'kurti'
    ];


    this.heroCategories =
      preferredOrder
        .filter(category =>
          categoryMap[category]
        )
        .map(category => ({
          name:
            categoryMap[category].displayName,

          count:
            categoryMap[category].count,

          image:
            categoryMap[category].image
        }));


    // ============================
    // ADD OTHER CATEGORIES
    // ============================

    Object.keys(categoryMap)
      .filter(
        category =>
          !preferredOrder.includes(category)
      )
      .forEach(category => {

        this.heroCategories.push({

          name:
            categoryMap[category].displayName,

          count:
            categoryMap[category].count,

          image:
            categoryMap[category].image
        });

      });


    // ============================
    // INITIAL ACTIVE CATEGORY
    // ============================

    if (this.heroCategories.length > 0) {

      this.activeCategory =
        this.heroCategories[0].name;

      this.activeCategoryData =
        this.heroCategories[0];
    }
  }


  // ==========================================
  // HOVER / CLICK CATEGORY
  // ==========================================

  setActiveCategory(category: any): void {

    if (!category) {
      return;
    }

    this.activeCategory =
      category.name;

    this.activeCategoryData =
      category;
  }


  // ==========================================
  // NORMALIZE CATEGORY
  // ==========================================

  private normalizeCategory(
    category: string
  ): string {

    return String(category)
      .trim()
      .toLowerCase()
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ');
  }


  // ==========================================
  // NORMALIZE PRODUCT IMAGES
  // ==========================================

  private normalizeImages(images: any): string[] {

    if (Array.isArray(images)) {

      return images.filter(
        (image: any) =>
          typeof image === 'string' &&
          image.trim().length > 0
      );
    }


    if (typeof images === 'string') {

      return images
        .split(',')
        .map(image => image.trim())
        .filter(image => image.length > 0);
    }


    return [];
  }


  // ==========================================
  // FALLBACK IMAGE
  // ==========================================

  private getProductImage(
    product: any
  ): string {

    const images =
      this.normalizeImages(product.images);

    return images.length > 0
      ? images[0]
      : '';
  }
}
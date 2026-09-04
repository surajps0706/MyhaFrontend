import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-homepage-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './homepage-admin.component.html',
  styleUrls: ['./homepage-admin.component.css']
})
export class HomepageAdminComponent implements OnInit {

  private baseUrl = environment.apiUrl;

  products: any[] = [];
  categories: string[] = [];
  savedSettings: any[] = [];

  selectedCategory = '';

  categoryProducts: any[] = [];

  selectedProductId = '';
  selectedImageIndex = 0;

  selectedImage = '';

  loading = true;
  saving = false;

  successMessage = '';
  errorMessage = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadData();
  }

  // ==========================================
  // LOAD PRODUCTS + SAVED HOMEPAGE SETTINGS
  // ==========================================

  loadData(): void {
    this.loading = true;

    this.http.get<any[]>(`${this.baseUrl}/products`).subscribe({
      next: (products) => {

        this.products = Array.isArray(products)
          ? products.map(product => ({
              ...product,

              images: Array.isArray(product.images)
                ? product.images.filter(
                    (image: any) =>
                      typeof image === 'string' &&
                      image.trim().length > 0
                  )
                : typeof product.images === 'string'
                  ? product.images
                      .split(',')
                      .map((image: string) => image.trim())
                      .filter((image: string) => image.length > 0)
                  : []
            }))
          : [];

        this.buildCategories();

        this.loadSavedSettings();

      },
      error: (err) => {
        console.error('Failed to load products:', err);

        this.errorMessage = 'Failed to load products.';
        this.loading = false;
      }
    });
  }

  // ==========================================
  // LOAD SAVED CATEGORY IMAGE SETTINGS
  // ==========================================

  loadSavedSettings(): void {

    this.http.get<any[]>(
      `${this.baseUrl}/homepage/categories`
    ).subscribe({
      next: (settings) => {

        this.savedSettings = Array.isArray(settings)
          ? settings
          : [];

        this.loading = false;

        if (this.categories.length > 0) {
          this.selectedCategory = this.categories[0];
          this.onCategoryChange();
        }

      },
      error: (err) => {

        console.error(
          'Failed to load homepage settings:',
          err
        );

        this.savedSettings = [];

        this.loading = false;

        if (this.categories.length > 0) {
          this.selectedCategory = this.categories[0];
          this.onCategoryChange();
        }
      }
    });
  }

  // ==========================================
  // BUILD CATEGORY LIST
  // ==========================================

  buildCategories(): void {

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
        originalCategory
          .toLowerCase()
          .replace(/[-_]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

      let displayName = originalCategory;

      if (
        normalized === 'co ord set' ||
        normalized === 'co ord sets' ||
        normalized === 'co-ord set' ||
        normalized === 'co-ord sets'
      ) {
        displayName = 'co-ord set';
      }
      else if (normalized === 'kurta') {
        displayName = 'Kurta';
      }
      else if (normalized === 'kurti') {
        displayName = 'Kurti';
      }

      categoryMap.set(normalized, displayName);
    });

    const preferredOrder = [
      'co-ord set',
      'kurta',
      'kurti'
    ];

    const orderedCategories: string[] = [];

    preferredOrder.forEach(preferred => {

      const match = Array.from(categoryMap.entries())
        .find(([key, value]) =>
          value.toLowerCase() === preferred.toLowerCase()
        );

      if (match) {
        orderedCategories.push(match[1]);
        categoryMap.delete(match[0]);
      }
    });

    categoryMap.forEach(value => {
      orderedCategories.push(value);
    });

    this.categories = orderedCategories;
  }

  // ==========================================
  // CATEGORY CHANGE
  // ==========================================

  onCategoryChange(): void {

    this.clearMessages();

    this.categoryProducts = this.products.filter(product => {

      if (!product.category) {
        return false;
      }

      const productCategory =
        String(product.category)
          .trim()
          .toLowerCase()
          .replace(/[-_]/g, ' ')
          .replace(/\s+/g, ' ');

      const selectedCategory =
        this.selectedCategory
          .trim()
          .toLowerCase()
          .replace(/[-_]/g, ' ')
          .replace(/\s+/g, ' ');

      return productCategory === selectedCategory;
    });

    this.selectedProductId = '';
    this.selectedImageIndex = 0;
    this.selectedImage = '';

    // ------------------------------------------
    // Check if this category already has a
    // saved homepage image
    // ------------------------------------------

    const saved = this.savedSettings.find(
      setting =>
        String(setting.category).trim().toLowerCase() ===
        this.selectedCategory.trim().toLowerCase()
    );

    if (saved) {

      const product = this.categoryProducts.find(
        product =>
          String(product.id) === String(saved.productId)
      );

      if (
        product &&
        Array.isArray(product.images) &&
        saved.imageIndex >= 1 &&
        saved.imageIndex <= product.images.length
      ) {

        this.selectedProductId = product.id;

        this.selectedImageIndex =
          Number(saved.imageIndex);

        this.selectedImage =
          product.images[this.selectedImageIndex - 1];

        return;
      }
    }

    // ------------------------------------------
    // Nothing saved yet
    // ------------------------------------------

    if (this.categoryProducts.length > 0) {

      const firstProduct =
        this.categoryProducts.find(
          product =>
            Array.isArray(product.images) &&
            product.images.length > 0
        );

      if (firstProduct) {

        this.selectedProductId =
          firstProduct.id;

        this.selectedImageIndex = 1;

        this.selectedImage =
          firstProduct.images[0];
      }
    }
  }

  // ==========================================
  // SELECT IMAGE
  // ==========================================

  selectImage(
    product: any,
    imageIndex: number
  ): void {

    this.selectedProductId = product.id;

    this.selectedImageIndex = imageIndex;

    this.selectedImage =
      product.images[imageIndex - 1];

    this.clearMessages();
  }

  // ==========================================
  // CHECK SELECTED IMAGE
  // ==========================================

  isSelected(
    product: any,
    imageIndex: number
  ): boolean {

    return (
      String(this.selectedProductId) ===
        String(product.id) &&
      this.selectedImageIndex === imageIndex
    );
  }

  // ==========================================
  // SAVE
  // ==========================================

  saveHomepageImage(): void {

    this.clearMessages();

    if (!this.selectedCategory) {
      this.errorMessage =
        'Please select a category.';
      return;
    }

    if (!this.selectedProductId) {
      this.errorMessage =
        'Please select an image.';
      return;
    }

    if (!this.selectedImageIndex) {
      this.errorMessage =
        'Please select an image.';
      return;
    }

    const token =
      localStorage.getItem('admin_token');

    if (!token) {
      this.errorMessage =
        'Admin session expired. Please login again.';
      return;
    }

    this.saving = true;

    const headers =
      new HttpHeaders().set(
        'Authorization',
        `Bearer ${token}`
      );

    const body = {
      productId: this.selectedProductId,
      imageIndex: this.selectedImageIndex
    };

    const encodedCategory =
      encodeURIComponent(this.selectedCategory);

    this.http.put(
      `${this.baseUrl}/homepage/categories/${encodedCategory}`,
      body,
      { headers }
    ).subscribe({

      next: (response: any) => {

        this.saving = false;

        this.successMessage =
          `${this.selectedCategory} homepage image saved successfully.`;

        // Update local saved settings
        const existingIndex =
          this.savedSettings.findIndex(
            setting =>
              String(setting.category).trim().toLowerCase() ===
              this.selectedCategory.trim().toLowerCase()
          );

        const newSetting = {
          category: this.selectedCategory,
          productId: this.selectedProductId,
          imageIndex: this.selectedImageIndex,
          heroImage: response?.heroImage || this.selectedImage
        };

        if (existingIndex >= 0) {
          this.savedSettings[existingIndex] =
            newSetting;
        } else {
          this.savedSettings.push(newSetting);
        }

      },

      error: (err) => {

        console.error(
          'Failed to save homepage image:',
          err
        );

        this.saving = false;

        this.errorMessage =
          err?.error?.detail ||
          'Failed to save homepage image.';
      }
    });
  }

  // ==========================================
  // IMAGE TRACKING
  // ==========================================

  trackByProduct(
    index: number,
    product: any
  ): string {

    return product.id || index.toString();
  }

  trackByImage(
    index: number
  ): number {

    return index;
  }

  // ==========================================
  // HELPERS
  // ==========================================

  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  getSelectedProduct(): any {
    return this.categoryProducts.find(
      product =>
        String(product.id) ===
        String(this.selectedProductId)
    );
  }

  getImageNumber(
    product: any,
    index: number
  ): number {

    return index + 1;
  }
}
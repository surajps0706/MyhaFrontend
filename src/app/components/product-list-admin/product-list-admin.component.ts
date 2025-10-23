import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-product-list-admin',
  standalone: true,
  templateUrl: './product-list-admin.component.html',
  styleUrls: ['./product-list-admin.component.css'],
  imports: [CommonModule, FormsModule]
})
export class ProductListAdminComponent implements OnInit {
  products: any[] = [];
  editingProduct: any = null;


  

  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadProducts();
  }

  // 🟩 Load all products from backend
  loadProducts() {
    this.http.get<any[]>(`${this.baseUrl}/products`).subscribe({
      next: (res) => {
        this.products = res;
      },
      error: (err) => {
        console.error('❌ Failed to load products:', err);
        alert('Failed to load products');
      }
    });
  }

  // ✏️ Start editing a product
  editProduct(product: any) {
    // Convert image array -> comma separated string for textarea
    this.editingProduct = {
      ...product,
      images: Array.isArray(product.images) ? product.images.join(', ') : product.images || ''
    };
  }

  // 💾 Save product changes
 saveProduct() {
  const token = localStorage.getItem('admin_token');
  if (!token) {
    alert('⚠️ Unauthorized: Please login again.');
    return;
  }

  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

  // Convert comma-separated strings → arrays
  if (typeof this.editingProduct.images === 'string') {
    this.editingProduct.images = this.editingProduct.images
      .split(',')
      .map((url: string) => url.trim())
      .filter((url: string) => url.length > 0);
  }

  if (typeof this.editingProduct.colors === 'string') {
    this.editingProduct.colors = this.editingProduct.colors
      .split(',')
      .map((color: string) => color.trim())
      .filter((color: string) => color.length > 0);
  }

  // ✅ Ensure boolean for Sold Out flag
  this.editingProduct.isSoldOut = !!this.editingProduct.isSoldOut;

  // Create payload explicitly (cleaner, avoids any unwanted keys)
 const updatedProduct = {
  name: this.editingProduct.name,
  price: this.editingProduct.price,
  description: this.editingProduct.description,
  sizes: this.editingProduct.sizes,
  colors: this.editingProduct.colors,
  selectedSize: this.editingProduct.selectedSize,
  selectedColor: this.editingProduct.selectedColor,
  images: this.editingProduct.images,
  category: this.editingProduct.category,
  isSoldOut: this.editingProduct.isSoldOut,
  enableFabricPrice: !!this.editingProduct.enableFabricPrice,
  fabricBasePrice: this.editingProduct.fabricBasePrice || null
};


  this.http.put(`${this.baseUrl}/products/${this.editingProduct.id}`, updatedProduct, { headers })
    .subscribe({
      next: () => {
        alert('✅ Product updated successfully');
        this.editingProduct = null;
        this.loadProducts();
      },
      error: (err) => {
        console.error('❌ Update failed:', err);
        alert('Update failed: ' + err.message);
      }
    });
}

  // ❌ Cancel edit mode
  cancelEdit() {
    this.editingProduct = null;
  }

  // 🗑️ Delete a product
  deleteProduct(id: string) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    const token = localStorage.getItem('admin_token');
    if (!token) {
      alert('⚠️ Unauthorized: Please login again.');
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.delete(`${this.baseUrl}/products/${id}`, { headers })
      .subscribe({
        next: () => {
          alert('🗑️ Product deleted successfully');
          this.loadProducts();
        },
        error: (err) => {
          console.error('❌ Delete failed:', err);
          alert('Delete failed: ' + err.message);
        }
      });
  }
}

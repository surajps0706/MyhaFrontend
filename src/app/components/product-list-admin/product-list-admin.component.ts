import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-product-list-admin',
  standalone: true,
  templateUrl: './product-list-admin.component.html',
  styleUrls: ['./product-list-admin.component.css'],
  imports: [CommonModule, FormsModule, DragDropModule]   // ✅ Added DragDropModule
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
      // ✅ Ensure every product has at least a default stock of 10
      this.products = res
        .map(p => ({
          ...p,
          stock: p.stock ?? 10   // if undefined or null, set 10
        }))
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    },
    error: (err) => {
      console.error('❌ Failed to load products:', err);
      alert('Failed to load products');
    }
  });
}


  // 🖱️ Handle drag-and-drop reorder
  drop(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.products, event.previousIndex, event.currentIndex);

    // update displayOrder values locally
    this.products.forEach((p, i) => (p.displayOrder = i + 1));

    const orderData = this.products.map((p) => ({
      _id: p._id,
      displayOrder: p.displayOrder
    }));

    this.http.post(`${this.baseUrl}/update-order`, orderData).subscribe({
      next: () => console.log('✅ Product order updated successfully'),
      error: (err) => console.error('❌ Error updating product order:', err)
    });
  }

  // ✏️ Start editing a product
  editProduct(product: any) {
    this.editingProduct = {
      ...product,
      images: Array.isArray(product.images)
        ? product.images.join(', ')
        : product.images || ''
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

    // Clean payload
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
      fabricBasePrice: this.editingProduct.fabricBasePrice || null,
      displayOrder: this.editingProduct.displayOrder || 0,
      stock: Number(this.editingProduct.stock) || 0 
    };

    this.http
      .put(`${this.baseUrl}/products/${this.editingProduct.id}`, updatedProduct, { headers })
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

    this.http.delete(`${this.baseUrl}/products/${id}`, { headers }).subscribe({
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


  increaseStock() {
  if (!this.editingProduct) return;
  this.editingProduct.stock = (this.editingProduct.stock || 0) + 1;
}

decreaseStock() {
  if (!this.editingProduct) return;
  const current = this.editingProduct.stock || 0;
  this.editingProduct.stock = current > 0 ? current - 1 : 0;
}

}

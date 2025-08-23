import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment'; // ✅ import environment

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

  private baseUrl = environment.apiUrl; // ✅ backend url from env

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadProducts();
  }

  // Load all products
  loadProducts() {
    this.http.get<any[]>(`${this.baseUrl}/products`).subscribe(res => {
      this.products = res;
    });
  }

  // Start editing a product
  editProduct(product: any) {
    this.editingProduct = { ...product };
  }

  // Save product changes
  saveProduct() {
    const token = localStorage.getItem('admin_token'); // ✅ dynamic token
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.put(`${this.baseUrl}/products/${this.editingProduct.id}`, this.editingProduct, { headers })
      .subscribe({
        next: () => {
          alert('✅ Product updated');
          this.editingProduct = null;
          this.loadProducts();
        },
        error: (err) => alert('❌ Update failed: ' + err.message)
      });
  }

  // Cancel edit
  cancelEdit() {
    this.editingProduct = null;
  }

  // Delete product
  deleteProduct(id: string) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    const token = localStorage.getItem('admin_token'); // ✅ dynamic token
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.delete(`${this.baseUrl}/products/${id}`, { headers })
      .subscribe({
        next: () => {
          alert('🗑️ Product deleted');
          this.loadProducts();
        },
        error: (err) => alert('❌ Delete failed: ' + err.message)
      });
  }
}

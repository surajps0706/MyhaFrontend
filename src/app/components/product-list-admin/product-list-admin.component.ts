import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.http.get<any[]>('http://localhost:8000/products').subscribe(res => {
      this.products = res;
    });
  }

  editProduct(product: any) {
    this.editingProduct = { ...product }; // copy to avoid mutating list directly
  }

  saveProduct() {
    const headers = new HttpHeaders().set('Authorization', 'Bearer myha-secret');
    this.http.put(`http://localhost:8000/products/${this.editingProduct.id}`, this.editingProduct, { headers })
      .subscribe({
        next: () => {
          alert('✅ Product updated');
          this.editingProduct = null;
          this.loadProducts();
        },
        error: (err) => alert('❌ Update failed: ' + err.message)
      });
  }

  cancelEdit() {
    this.editingProduct = null;
  }

  deleteProduct(id: string) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    const headers = new HttpHeaders().set('Authorization', 'Bearer myha-secret');
    this.http.delete(`http://localhost:8000/products/${id}`, { headers })
      .subscribe({
        next: () => {
          alert('🗑️ Product deleted');
          this.loadProducts();
        },
        error: (err) => alert('❌ Delete failed: ' + err.message)
      });
  }
}

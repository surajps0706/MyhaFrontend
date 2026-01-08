import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-product-upload',
  standalone: true,
  templateUrl: './product-upload.component.html',
  styleUrls: ['./product-upload.component.css'],
  imports: [CommonModule, FormsModule]
})
export class ProductUploadComponent {
  product = {
    name: '',
    price: '',
    description: '',
    category: '',
    colors: '',
    image_count: 1,
    enableFabricPrice: false,
    fabricBasePrice: '',
    stock: 10  // ✅ added stock
  };

  uploading = false;
  fabricPriceOptions = [100, 200, 300];

  constructor(private http: HttpClient) {}

  increaseStock() {
    this.product.stock++;
  }

  decreaseStock() {
    if (this.product.stock > 0) this.product.stock--;
  }

  uploadProduct() {
    if (this.uploading) return;
    this.uploading = true;

 const payload = {
  name: this.product.name.trim(),
  price: Number(this.product.price),
  description: this.product.description.trim(),
  category: this.product.category.trim(),
  sizes: ["Customizable"],
  colors: this.product.colors
    ? this.product.colors.split(',').map(c => c.trim())
    : ["Default"],
  image_count: Number(this.product.image_count),
  enableFabricPrice: this.product.enableFabricPrice,
  fabricBasePrice: this.product.enableFabricPrice
    ? Number(this.product.fabricBasePrice)
    : null,
  stock: this.product.stock
};


    const token = localStorage.getItem('admin_token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

  this.http.post(`${environment.apiUrl}/add-product`, payload, { headers })
  .subscribe({
    next: (res) => {
      console.log('✅ Uploaded:', res);
      alert('✅ Product Uploaded Successfully!');

      // ✅ RESET FORM (image_count REQUIRED)
      this.product = {
        name: '',
        price: '',
        description: '',
        category: '',
        colors: '',
        image_count: 1,          // 🔴 REQUIRED
        enableFabricPrice: false,
        fabricBasePrice: '',
        stock: 10
      };

      this.uploading = false;
    },
    error: (err) => {
      console.error('❌ Upload failed:', err);
      alert('❌ Upload failed');
      this.uploading = false;
    }
  });

  }
}

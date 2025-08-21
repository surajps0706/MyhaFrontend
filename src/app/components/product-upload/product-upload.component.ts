import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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
    images: ''
  };

  uploading = false; // ✅ prevents double click

  constructor(private http: HttpClient) {}

  uploadProduct() {
    if (this.uploading) return; // ✅ block double submit
    this.uploading = true;

    const payload = {
      name: this.product.name.trim(),
      price: Number(this.product.price), // ensure number
      description: this.product.description.trim(),
      category: this.product.category.trim(),
      sizes: ["Customizable"],   
      colors: this.product.colors
        ? this.product.colors.split(',').map(c => c.trim())
        : ["Default"],
      selectedSize: "Free Size",
      selectedColor: this.product.colors.split(',')[0]?.trim() || "",
      images: this.product.images
        ? this.product.images.split(',').map(i => i.trim())
        : []
    };

    const headers = new HttpHeaders().set('Authorization', 'Bearer myha-secret');

    this.http.post('http://localhost:8000/add-product-url', payload, { headers })
      .subscribe({
        next: (res) => {
          console.log('✅ Uploaded:', res);
          alert('✅ Product Uploaded Successfully!');
          this.product = { name: '', price: '', description: '', category: '', colors: '', images: '' };
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

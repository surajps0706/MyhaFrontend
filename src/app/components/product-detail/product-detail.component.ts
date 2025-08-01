import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./product-detail.component.css'],
  templateUrl: './product-detail.component.html'
})
export class ProductDetailComponent {
  productId: string | null = null;

  product = {
    id: 1,
    name: 'Brindha Dress',
    price: '₹2,499',
    description: 'Elegant traditional wear with premium fabric. Perfect for occasions.',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Red', 'Green', 'Blue'],
    selectedSize: 'M',
    selectedColor: 'Red',
    images: [
      'https://res.cloudinary.com/dw35epojg/image/upload/v1753624789/temp-image_m0qua0.jpg',
      'https://res.cloudinary.com/dw35epojg/image/upload/v1753624789/temp-image_m0qua0.jpg',
      'https://res.cloudinary.com/dw35epojg/image/upload/v1753624789/temp-image_m0qua0.jpg'
    ]
  };

  constructor(private route: ActivatedRoute) {
    this.productId = this.route.snapshot.paramMap.get('id');
    // You can use productId to fetch product from backend later
  }

  addToCart() {
    alert(`${this.product.name} added to cart!`);
  }
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  styleUrls: ['./product-list.component.css'],
  templateUrl: './product-list.component.html'
})
export class ProductListComponent {
  products = [
    {
      id: 1,
      name: 'Brindha Dress',
      price: '₹2,499',
      images: [
        'https://res.cloudinary.com/dw35epojg/image/upload/v1753624789/temp-image_m0qua0.jpg',
        'https://res.cloudinary.com/dw35epojg/image/upload/v1753624789/temp-image_m0qua0.jpg',
        'https://res.cloudinary.com/dw35epojg/image/upload/v1753624789/temp-image_m0qua0.jpg'
      ]
    },
    {
      id: 2,
      name: 'Sita Anarkali',
      price: '₹2,199',
      images: [
        'https://res.cloudinary.com/dw35epojg/image/upload/v1753624789/temp-image_m0qua0.jpg',
        'https://res.cloudinary.com/dw35epojg/image/upload/v1753624789/temp-image_m0qua0.jpg',
        'https://res.cloudinary.com/dw35epojg/image/upload/v1753624789/temp-image_m0qua0.jpg'
      ]
    },
    {
      id: 3,
      name: 'Divya Gown',
      price: '₹2,799',
      images: [
        'https://res.cloudinary.com/dw35epojg/image/upload/v1753624789/temp-image_m0qua0.jpg',
        'https://res.cloudinary.com/dw35epojg/image/upload/v1753624789/temp-image_m0qua0.jpg',
        'https://res.cloudinary.com/dw35epojg/image/upload/v1753624789/temp-image_m0qua0.jpg'
      ]
    },
       {
      id: 4,
      name: 'Divya Gown',
      price: '₹2,799',
      images: [
        'https://res.cloudinary.com/dw35epojg/image/upload/v1753624789/temp-image_m0qua0.jpg',
        'https://res.cloudinary.com/dw35epojg/image/upload/v1753624789/temp-image_m0qua0.jpg',
        'https://res.cloudinary.com/dw35epojg/image/upload/v1753624789/temp-image_m0qua0.jpg'
      ]
    }
  ];
}

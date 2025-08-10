import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {
  productId: string | null = null;
  product: any = null;
  selectedImage: string = '';
  showSizeChart = false;
  customizationNotes: string = '';
  selectedSleeve: any = null;
  showDescription: boolean = false;
  isKurti: boolean = false;
  preferredHeight: string = '';
  extraHeightPrice = 150; // Price if height > 35

  standardSizes = ['XXS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

  measurementFields = [
    { key: 'bust', label: 'Bust' },
    { key: 'waist', label: 'Waist' },
    { key: 'hips', label: 'Hips' },
    { key: 'shoulders', label: 'Shoulders' },
    { key: 'upperArm', label: 'Upper Arm' },
    { key: 'biceps', label: 'Biceps' },
    { key: 'wrist', label: 'Wrist' },
    { key: 'sleeveLength', label: 'Sleeve Length' }
  ];

  measurements: any = {
    bust: '',
    waist: '',
    hips: '',
    shoulders: '',
    upperArm: '',
    biceps: '',
    wrist: '',
    sleeveLength: '',
  };

  sleeveOptions = [
    { name: 'Small Sleeves', price: 0 },
    { name: 'Elbow Sleeves', price: 50 },
    { name: '3/4 Sleeves', price: 70 },
    { name: 'Full Sleeve', price: 100 }
  ];

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id');
    if (this.productId) {
      this.http.get<any>(`http://localhost:8000/product/${this.productId}`).subscribe({
        next: (data) => {
          this.product = data;
          this.selectedImage = this.product.images?.[0] || '';
          this.selectedSleeve = this.sleeveOptions[0];
          this.isKurti = this.product.category?.toLowerCase() === 'kurti';
        },
        error: (err) => {
          console.error('Error fetching product:', err);
        }
      });
    }
  }

  selectImage(img: string): void {
    this.selectedImage = img;
  }

  isFormValid(): boolean {
    const requiredFields = ['bust', 'waist', 'biceps', 'upperArm'];
    return requiredFields.every(field => this.measurements[field]?.trim() !== '');
  }

  isRequired(fieldKey: string): boolean {
    return ['bust', 'waist', 'biceps', 'upperArm'].includes(fieldKey);
  }

  onHeightChange(height: string | number) {
    // No direct assignment, price updates automatically
  }

  get basePrice(): number {
    return parseFloat(this.product?.price?.toString().replace(/[^0-9.]/g, '')) || 0;
  }

  get sleeveExtra(): number {
    return this.selectedSleeve?.price || 0;
  }

  get heightExtra(): number {
    const h = Number(this.preferredHeight);
    return this.isKurti && !isNaN(h) && h > 35 ? this.extraHeightPrice : 0;
  }

  get totalPrice(): number {
    return this.basePrice + this.sleeveExtra + this.heightExtra;
  }

  toggleDescription(): void {
    this.showDescription = !this.showDescription;
  }

  get formattedDescription() {
    return this.product?.description
      ? this.product.description.replace(/\n/g, '<br>')
      : '';
  }

  getWhatsappLink(): string {
    const phoneNumber = '9710759208'; // Add country code if needed
    const message = `Hello, I'm interested in the following product:

Product: ${this.product?.name}
Price: ₹${this.totalPrice}
Size: ${this.product?.selectedSize || 'Not selected'}
Link: ${window.location.href}`;

    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  }

  addToCart(): void {
    if (!this.product.selectedSize) {
      alert('Please select a size before adding to cart!');
      return;
    }

    const cartItem = {
      ...this.product,
      selectedSize: this.product.selectedSize,
      measurements: this.measurements,
      sleevePrice: this.selectedSleeve.price,
      sleeveType: this.selectedSleeve?.name || 'None',
      customizationNotes: this.customizationNotes,
      preferredHeight: this.preferredHeight,
      extraHeightPrice: this.extraHeightPrice
    };

    this.cartService.addToCart(cartItem);
    alert(`${this.product.name} added to cart!`);
  }
}

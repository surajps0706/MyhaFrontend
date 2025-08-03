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
  selectedSleeve:any=null;

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
    sleeveLength: ''
  };

  sleeveOptions = [
    { name: 'Sleeveless', price: 0 },
    { name: 'Short Sleeve', price: 100 },
    { name: 'Elbow Sleeve', price: 150 },
    { name: 'Full Sleeve', price: 200 }
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
          this.selectedImage = this.product.images[0];
          this.selectedSleeve = this.sleeveOptions[0];
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

get totalPrice(): number {
  if (!this.product) return 0;

  const basePrice = parseFloat(this.product.price) || 0;
  const sleevePrice = this.selectedSleeve?.price || 0;

  return basePrice + sleevePrice;
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
      sleeveType: this.selectedSleeve.name,
      sleevePrice: this.selectedSleeve.price,
      customizationNotes: this.customizationNotes
    };

    this.cartService.addToCart(cartItem);
    alert(`${this.product.name} added to cart!`);
  }
}

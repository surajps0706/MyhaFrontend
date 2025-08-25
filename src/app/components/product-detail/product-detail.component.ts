import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';

type SizingMode = 'size' | 'measurements';

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
  showDescription = false;
  isKurti = false;
  preferredHeight: string = '';
  extraHeightPrice = 150;

  // sizing mode
  sizingMode: SizingMode = 'size';

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

  // =========================
  // Reviews
  // =========================
  reviews: any[] = [];
  newReview: any = { name: '', rating: 5, comment: '' };
  selectedImageFile: File | null = null;
  previewImage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService,
  ) {}

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id');

    if (this.productId) {
      this.productService.getProductById(this.productId).subscribe({
        next: (data) => {
          this.product = data;
          this.selectedImage = this.product.images?.[0] || '';
          this.selectedSleeve = this.sleeveOptions[0];
          this.isKurti = this.product.category?.toLowerCase() === 'kurti';

          // init
          this.product.selectedSize = '';

          // load reviews once product is ready
          this.loadReviews();
        },
        error: (err) => console.error('Error fetching product:', err)
      });
    }
  }

  // =========================
  // Mode helpers
  // =========================
  setSizingMode(mode: SizingMode): void {
    this.sizingMode = mode;
  }
  get sizeDisabled(): boolean { return this.sizingMode === 'measurements'; }
  get measurementsDisabled(): boolean { return this.sizingMode === 'size'; }

  // =========================
  // UI events
  // =========================
  selectImage(img: string): void {
    this.selectedImage = img;
  }

  onSizeChange(_size: string): void {
    if (this.sizingMode !== 'size') this.sizingMode = 'size';
  }

  onMeasurementChanged(_key: string, value: string): void {
    if (this.sizingMode !== 'measurements' && String(value ?? '').trim() !== '') {
      this.sizingMode = 'measurements';
    }
  }

  isRequired(fieldKey: string): boolean {
    return ['bust', 'waist', 'biceps', 'upperArm'].includes(fieldKey);
  }

  isFormValid(): boolean {
    if (this.sizingMode === 'size') {
      return !!this.product?.selectedSize;
    }
    const requiredFields = ['bust', 'waist', 'biceps', 'upperArm'];
    return requiredFields.every(
      (field) => String(this.measurements[field] ?? '').trim() !== ''
    );
  }

  // =========================
  // Pricing
  // =========================
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

  // =========================
  // Description + WhatsApp
  // =========================
  toggleDescription(): void {
    this.showDescription = !this.showDescription;
  }

  get formattedDescription() {
    return this.product?.description
      ? this.product.description.replace(/\n/g, '<br>')
      : '';
  }

  getWhatsappLink(): string {
    const phoneNumber = '9344539530'; // add +91 if needed
    const message = `Hello, I'm interested in the following product:

Product: ${this.product?.name}
Price: ₹${this.totalPrice}
Size: ${this.product?.selectedSize || 'Not selected'}
Link: ${window.location.href}`;
    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  }

  // =========================
  // Cart
  // =========================
showToast = false;

addToCart(): void {
  if (!this.isFormValid()) {
    alert('Please select a size OR provide the required measurements before adding to cart!');
    return;
  }

  const cartItem = {
    ...this.product,
    selectedSize: this.sizingMode === 'size' ? (this.product?.selectedSize || null) : null,
    measurements: this.sizingMode === 'measurements' ? this.measurements : {},
    sleevePrice: this.selectedSleeve?.price || 0,
    sleeveType: this.selectedSleeve?.name || 'None',
    customizationNotes: this.customizationNotes || null,
    preferredHeight: this.preferredHeight,
    extraHeightPrice: this.heightExtra
  };

  this.cartService.addToCart(cartItem);

  // ✅ Show toast instead of alert
  this.showToast = true;
  setTimeout(() => (this.showToast = false), 3000);
}


  // =========================
  // Notes
  // =========================
  get sizeModeNote(): string | null {
    return this.sizeDisabled ? 'Disabled because Custom Measurements mode is active.' : null;
  }

  get measModeNote(): string | null {
    return this.measurementsDisabled ? 'Disabled because Size mode is active.' : null;
  }

  onHeightChange(_height: string | number) {
    // trigger Angular change detection
  }

  // =========================
  // Reviews Logic
  // =========================
  loadReviews(): void {
    if (!this.productId) return;
    this.productService.getReviews(this.productId).subscribe({
      next: (res) => {
        this.reviews = [...res]; // overwrite instead of pushing
      },
      error: (err) => console.error('Error loading reviews:', err)
    });
  }

  // Handle image select + preview
  onImageSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files[0]) {
      this.selectedImageFile = fileInput.files[0];

      // Preview in UI
      const reader = new FileReader();
      reader.onload = e => {
        this.previewImage = e.target?.result as string;
      };
      reader.readAsDataURL(this.selectedImageFile);
    }
  }

submitReview(): void {
  if (!this.productId) return;

  if (!this.newReview.name.trim() || !this.newReview.comment.trim()) {
    alert('Please fill in all fields');
    return;
  }

  // ✅ pass review object + file, NOT FormData
  this.productService.addReview(this.productId, this.newReview, this.selectedImageFile ?? undefined).subscribe({
    next: () => {
      alert('✅ Review submitted');
      this.newReview = { name: '', rating: 5, comment: '' };
      this.selectedImageFile = null;
      this.previewImage = null;
      this.loadReviews();
    },
    error: (err) => alert('❌ Failed to submit: ' + err.message)
  });
}


}

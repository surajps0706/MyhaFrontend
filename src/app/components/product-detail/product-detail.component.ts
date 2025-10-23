import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { RouterModule } from '@angular/router';

type SizingMode = 'size' | 'measurements';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
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
  enableSleeveCustomization = false; // toggle state
  enableHeightCustomization = false; // default OFF
  enableNeckCustomization = false;
neckCustomizationText: string = '';



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

  // =========================
  // Recommendations
  // =========================
  recommendedProducts: any[] = [];

  // Toast
  showToast = false;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService,
    private router: Router
  ) {}

ngOnInit(): void {
  this.route.paramMap.subscribe(params => {
    const id = params.get('id');
    if (id) {
      this.loadProduct(id);
      this.productId=id;
    }
  });
}



private loadProduct(id: string): void {
  this.productService.getProductById(id).subscribe({
    next: (data) => {
      this.product = data;
      this.selectedImage = this.product.images?.[0] || '';
      this.selectedSleeve = this.sleeveOptions[0];
      this.isKurti = this.product.category?.toLowerCase() === 'kurti';
      this.product.selectedSize = '';

      // 👇 Add this part: apply fabric-based sleeve logic
      if (this.product.enableFabricPrice && this.product.fabricBasePrice) {
        const base = Number(this.product.fabricBasePrice);
        this.sleeveOptions = [
          { name: 'Half Sleeve', price: Math.round(base / 2) },
          { name: '3/4 Sleeve', price: Math.round((base * 3) / 4) },
          { name: 'Full Sleeve', price: base }
        ];
      } else {
        this.sleeveOptions = [
          { name: 'Small Sleeves', price: 0 },
          { name: 'Elbow Sleeves', price: 50 },
          { name: '3/4 Sleeves', price: 70 },
          { name: 'Full Sleeve', price: 100 }
        ];
      }

      // continue existing logic
      this.loadReviews();
      this.loadRecommendedProducts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    error: (err) => console.error('Error fetching product:', err)
  });
}


  // =========================
  // Recommendations
  // =========================
loadRecommendedProducts(): void {
  this.productService.getProducts().subscribe({
    next: (all: any[]) => {
      // Normalize id for all products (fallback to _id if id is missing)
      const normalized = all.map(p => ({
        ...p,
        id: p.id || p._id
      }));

      // filter by category, exclude current product
      const filtered = normalized.filter(
        (p) => p.id !== this.productId && p.category === this.product?.category
      );

      // fallback: if not enough, show from all
      const pool = filtered.length >= 6
        ? filtered
        : normalized.filter(p => p.id !== this.productId);

      // pick max 6–7 products
      this.recommendedProducts = pool.slice(0, 7);
    },
    error: (err) => console.error('Error loading recommended products:', err)
  });
}


  // =========================
  // Back Button Logic
  // =========================
  goBack(): void {
    sessionStorage.setItem('lastViewedProductId', this.productId || '');
    this.router.navigate(['/products']).then(() => {
      setTimeout(() => {
        const el = document.getElementById(this.productId || '');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    });
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



get heightExtra(): number {
  if (!this.enableHeightCustomization) return 0; // ✅ no charge if toggle off

  const h = Number(this.preferredHeight);
  return this.isKurti && !isNaN(h) && h > 35 ? this.extraHeightPrice : 0;
}


get totalPrice(): number {
  return this.basePrice + this.sleeveExtra + this.heightExtra + this.bustExtra;
}

get sleeveExtra(): number {
  // ✅ Only add sleeve price if customization toggle is ON
  if (!this.enableSleeveCustomization) return 0;
  return this.selectedSleeve?.price || 0;
}


  get bustExtra(): number {
  const bust = Number(this.measurements?.bust);
  return !isNaN(bust) && bust >= 45 ? 150 : 0;
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
    const phoneNumber = '9344539530';
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
 addToCart(): void {
  if (!this.isFormValid()) {
    alert('Please select a size OR provide the required measurements before adding to cart!');
    return;
  }

  const cartItem: any = {
    ...this.product,
    selectedSize: this.sizingMode === 'size' ? (this.product?.selectedSize || null) : null,
    measurements: this.sizingMode === 'measurements' ? this.measurements : {},
    customizationNotes: this.customizationNotes || null,
    bustExtra: this.bustExtra || 0,
  };

  // ✅ Sleeve
  if (this.enableSleeveCustomization && this.selectedSleeve) {
    cartItem.sleeveType = this.selectedSleeve.name;
    cartItem.sleevePrice = this.selectedSleeve.price;
  } else {
    cartItem.sleeveType = null;
    cartItem.sleevePrice = 0;
  }

  // ✅ Height
  if (this.enableHeightCustomization && this.preferredHeight) {
    cartItem.preferredHeight = this.preferredHeight;
    cartItem.extraHeightPrice = this.heightExtra || 0;
    cartItem.hasHeightCustomization = true;
  } else {
    cartItem.preferredHeight = null;
    cartItem.extraHeightPrice = 0;
    cartItem.hasHeightCustomization = false;
  }

  // ✅ Neck
  if (this.enableNeckCustomization && this.neckCustomizationText?.trim()) {
    cartItem.neckCustomization = this.neckCustomizationText.trim();
    cartItem.hasNeckCustomization = true;
  } else {
    cartItem.neckCustomization = null;
    cartItem.hasNeckCustomization = false;
  }

  this.cartService.addToCart(cartItem);

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

  onHeightChange(_height: string | number) {}

  // =========================
  // Reviews Logic
  // =========================
  loadReviews(): void {
    if (!this.productId) return;
    this.productService.getReviews(this.productId).subscribe({
      next: (res) => {
        this.reviews = [...res];
      },
      error: (err) => console.error('Error loading reviews:', err)
    });
  }

onImageSelected(event: Event): void {
  const fileInput = event.target as HTMLInputElement;
  if (fileInput.files && fileInput.files[0]) {
    this.selectedImageFile = fileInput.files[0];

    // ✅ For preview in UI
    const reader = new FileReader();
    reader.onload = e => {
      this.previewImage = e.target?.result as string;
    };
    reader.readAsDataURL(this.selectedImageFile);
  }
}


// enableSleeveCustomization = false; // default OFF

onSleeveToggle(): void {
  if (!this.enableSleeveCustomization) {
    // 🔹 When toggle OFF → clear sleeve selection
    this.selectedSleeve = null;
  } else {
    // 🔹 When toggle ON → show options but don’t preselect any
    this.selectedSleeve = null;
  }

  // 🔹 Recalculate total price (base + bust + height + sleeve)
  this.updateTotalPrice();
}




onNeckToggle(): void {
  if (!this.enableNeckCustomization) {
    this.neckCustomizationText = ''; // reset when turned off
  }
}

// setHeightCustomization(enable: boolean): void {
//   this.enableHeightCustomization = enable;
//   if (!enable) {
//     this.preferredHeight = '';
//   }
// }

onHeightToggle(): void {
  if (!this.enableHeightCustomization) {
    this.preferredHeight = ''; // reset when toggled off
  }
}


updateTotalPrice(): void {
  // This forces Angular to recalc total using getters (reactive display)
  const _ = this.totalPrice;
}




  submitReview(): void {
    if (!this.productId) return;
    if (!this.newReview.name.trim() || !this.newReview.comment.trim()) {
      alert('Please fill in all fields');
      return;
    }

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

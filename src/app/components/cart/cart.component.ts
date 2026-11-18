import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; 
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  cartItems: any[] = [];
  objectKeys = Object.keys;

  baseTotal: number = 0;
  sleeveTotal: number = 0;
  heightTotal: number = 0;
  handlingCharge: number = 0;
  total: number = 0;
  totalQty: number = 0;
  builtInPadsTotal: number = 0;
  pricesRefreshing = true;
  priceRefreshFailed = false;

  constructor(private cartService: CartService, private router: Router, private productService: ProductService,) {}

 ngOnInit(): void {
  this.pricesRefreshing = true;
  this.priceRefreshFailed = false;

  this.cartItems = this.cartService.getCart() || [];

  this.cartItems.forEach(item => {
    if (!item.quantity || item.quantity < 1) {
      item.quantity = 1;
    }
  });

  this.productService.getProducts().subscribe({

    next: (products: any[]) => {

      this.cartItems = this.cartItems.map(item => {

        const latestProduct = products.find(p =>
          String(p.id || p._id) === String(item.id || item._id)
        );

        if (!latestProduct) {
          return { ...item, isUnavailable: true };
        }

        const updatedItem = {
          ...item,
          ...latestProduct,

          selectedSize: item.selectedSize,
          measurements: item.measurements,
          customizationNotes: item.customizationNotes,
          sleeveType: item.sleeveType,
          preferredHeight: item.preferredHeight,
          hasHeightCustomization: item.hasHeightCustomization,
          hasNeckCustomization: item.hasNeckCustomization,
          neckCustomization: item.neckCustomization,

          hasBuiltInPads:
            item.hasBuiltInPads &&
            latestProduct.enableBuiltInPads === true,

          isSoldOut:
            latestProduct.isSoldOut === true ||
            (
              latestProduct.stock !== undefined &&
              latestProduct.stock !== null &&
              Number(latestProduct.stock) <= 0
            ),

          isUnavailable: false
        };

        const isFabricPricing =
          latestProduct.enableFabricPrice === true &&
          Number(latestProduct.fabricBasePrice) > 0;

        const fabricPrice = Number(latestProduct.fabricBasePrice || 0);

        const sleevePrices: any = isFabricPricing
          ? {
              'Small Sleeve': 0,
              'Small Sleeves': 0,
              'Half Sleeve': Math.round(fabricPrice / 2),
              '3/4 Sleeve': Math.round(fabricPrice * 0.75),
              'Full Sleeve': fabricPrice
            }
          : {
              'Small Sleeve': 0,
              'Small Sleeves': 0,
              'Elbow Sleeves': 50,
              '3/4 Sleeves': 70,
              '3/4 Sleeve': 70,
              'Full Sleeve': 100
            };

        updatedItem.sleevePrice =
          sleevePrices[item.sleeveType] ?? 0;

        updatedItem.extraHeightPrice =
          item.hasHeightCustomization &&
          latestProduct.enableHeightCustomization === true &&
          latestProduct.category?.toLowerCase() === 'kurti' &&
          Number(item.preferredHeight) > 35
            ? 150 : 0;

        updatedItem.bustExtra =
          Number(item.measurements?.bust) >= 45 ? 150 : 0;

        updatedItem.builtInPadsPrice =
          updatedItem.hasBuiltInPads ? 200 : 0;

        return updatedItem;
      });

      this.cartService.updateCart(this.cartItems);

      this.updateTotal();

      // Prices successfully verified
      this.pricesRefreshing = false;
    },

    error: err => {
      console.error('Error refreshing cart:', err);

      // Keep checkout blocked if verification fails
      this.pricesRefreshing = false;
        this.priceRefreshFailed = true;


      alert('Unable to verify current product prices. Please try again.');
    }

  });

  this.updateTotal();
}

get hasSoldOutItems(): boolean {
  return this.cartItems.some(
    item => item.isSoldOut === true || item.isUnavailable === true
  );
}

  updateQuantity(index: number, quantity: number): void {
    if (quantity < 1) return; // prevent 0 or negative qty

    this.cartItems[index].quantity = quantity;
    this.cartService.updateCart(this.cartItems);

    this.updateTotal(); // refresh totals immediately
  }

  removeItem(index: number): void {
    this.cartItems.splice(index, 1);
    this.cartService.updateCart(this.cartItems);
    this.updateTotal();
  }

  clearCart(): void {
    this.cartItems = [];
    this.cartService.updateCart(this.cartItems);
    this.updateTotal();
  }

  hasMeasurements(measurements: any): boolean {
    if (!measurements) return false;
    return Object.values(measurements).some(
      (value: any) => typeof value === 'string' && value.trim() !== ''
    );
  }


updateTotal(): void {
  this.baseTotal = 0;
  this.sleeveTotal = 0;
  this.heightTotal = 0;
  this.builtInPadsTotal = 0;
  this.totalQty = 0;

  let bustTotal = 0;

  this.cartItems.forEach(item => {
    const qty = Number(item.quantity) || 1;

    const basePrice = Number(
      item.price?.toString().replace(/[^0-9.]/g, '') || 0
    );

    const sleevePrice = Number(item.sleevePrice || 0);
    const heightPrice = Number(item.extraHeightPrice || 0);
    const bustPrice = Number(item.bustExtra || 0);
    const padsPrice = item.hasBuiltInPads
      ? Number(item.builtInPadsPrice ?? 200)
      : 0;

    this.baseTotal += basePrice * qty;
    this.sleeveTotal += sleevePrice * qty;
    this.heightTotal += heightPrice * qty;
    this.builtInPadsTotal += padsPrice * qty;
    bustTotal += bustPrice * qty;

    this.totalQty += qty;
  });

  this.handlingCharge = this.totalQty >= 3 ? 20 : 0;

  this.total =
    this.baseTotal +
    this.sleeveTotal +
    this.heightTotal +
    this.builtInPadsTotal +
    bustTotal +
    this.handlingCharge;
}


getItemTotal(item: any): number {
  const base = Number(
    item.price?.toString().replace(/[^0-9.]/g, '') || 0
  );

  const sleeve = Number(item.sleevePrice || 0);
  const height = Number(item.extraHeightPrice || 0);
  const bust = Number(item.bustExtra || 0);

  const pads = item.hasBuiltInPads
    ? Number(item.builtInPadsPrice ?? 200)
    : 0;

  const qty = Number(item.quantity) || 1;

  return (base + sleeve + height + bust + pads) * qty;
}


goToCheckout(): void {

  if (this.priceRefreshFailed) {
  alert('Prices could not be verified. Please refresh the page and try again.');
  return;
}
  if (this.pricesRefreshing) {
    alert('Please wait while we verify the latest prices.');
    return;
  }

  if (this.hasSoldOutItems) {
    alert('Your cart contains unavailable products. Please remove them first.');
    return;
  }

  this.cartItems = this.cartItems.map(item => ({
    ...item,
    measurements: item.measurements || {},
    customizationNotes: item.customizationNotes || ''
  }));

  this.cartService.updateCart(this.cartItems);
  localStorage.setItem('cart', JSON.stringify(this.cartItems));

  this.router.navigate(['/checkout']);
}
}

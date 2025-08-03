import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { ProductListComponent } from './components/product-list/product-list.component';
import { CheckoutComponent } from './components/checkout/checkout.component';
import { OrderSuccessComponent } from './components/order-success/order-success.component';
import { TrackOrderComponent } from './components/track-order/track-order.component';
import { ProductUploadComponent } from './components/product-upload/product-upload.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'products', component: ProductListComponent },

  // 🛍️ Lazy load Product Detail
  {
    path: 'product/:id',
    loadComponent: () =>
      import('./components/product-detail/product-detail.component').then(
        (m) => m.ProductDetailComponent
      ),
  },

  // 🛒 Lazy load Cart
  {
    path: 'cart',
    loadComponent: () =>
      import('./components/cart/cart.component').then(
        (m) => m.CartComponent
      ),
  },

  { path: 'checkout', component: CheckoutComponent },
  { path: 'order-success', component: OrderSuccessComponent },
  { path: 'track', component: TrackOrderComponent },
  { path: 'admin/upload', component: ProductUploadComponent },

  // fallback
  { path: '**', redirectTo: '', pathMatch: 'full' },
];

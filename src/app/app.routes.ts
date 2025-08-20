import { Routes, Router  } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { ProductListComponent } from './components/product-list/product-list.component';
import { OrderSuccessComponent } from './components/order-success/order-success.component';
import { TrackOrderComponent } from './components/track-order/track-order.component';
import { ProductUploadComponent } from './components/product-upload/product-upload.component';
import { LoginComponent } from './admin/login/login.component';
import { inject } from '@angular/core';


// ✅ Simple inline guard for admin routes
function adminGuard() {
  const token = localStorage.getItem('admin_token');
  const router = inject(Router);

  if (!token) {
    router.navigate(['/admin/login']);
    return false;
  }
  return true;
}

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
      import('./components/cart/cart.component').then((m) => m.CartComponent),
  },

  // ✅ Checkout → lazy load only once
  {
    path: 'checkout',
    loadComponent: () =>
      import('./components/checkout/checkout.component').then(
        (m) => m.CheckoutComponent
      ),
  },

  { path: 'order-success', component: OrderSuccessComponent },
  { path: 'track', component: TrackOrderComponent },

  // =========================
  // 🔐 ADMIN ROUTES
  // =========================
  {
    path: 'admin/orders',
    loadComponent: () =>
      import('./admin/orders/orders.component').then((m) => m.OrdersComponent),
    canMatch: [adminGuard],
  },
  {
    path: 'admin/upload',
    component: ProductUploadComponent,
    canMatch: [adminGuard],
  },

  { path: 'admin/login', component: LoginComponent },


  // fallback
  { path: '**', redirectTo: '', pathMatch: 'full' },
];

import { Routes, Router } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { ProductListComponent } from './components/product-list/product-list.component';
import { OrderSuccessComponent } from './components/order-success/order-success.component';
import { TrackOrderComponent } from './components/track-order/track-order.component';
import { inject } from '@angular/core';

// ✅ Inline guard for admin routes
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
  // =========================
  // 🏠 PUBLIC ROUTES
  // =========================
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

  // ✅ Checkout
  {
    path: 'checkout',
    loadComponent: () =>
      import('./components/checkout/checkout.component').then(
        (m) => m.CheckoutComponent
      ),
  },

  // ✅ Order Success + Tracking
  { path: 'order-success', component: OrderSuccessComponent },
  { path: 'track', component: TrackOrderComponent },

  // =========================
  // 🔐 ADMIN ROUTES
  // =========================

  // ✅ Admin Login (no guard here)
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./admin/login/login.component').then((m) => m.LoginComponent),
  },

  // ✅ Admin Dashboard Wrapper (guarded)
  {
    path: 'admin',
    loadComponent: () =>
      import('./components/admin-dashboard/admin-dashboard.component').then(
        (m) => m.AdminDashboardComponent
      ),
    canMatch: [adminGuard],
    children: [
      {
        path: 'orders',
        loadComponent: () =>
          import('./admin/orders/orders.component').then(
            (m) => m.OrdersComponent
          ),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./components/product-list-admin/product-list-admin.component').then(
            (m) => m.ProductListAdminComponent
          ),
      },
      {
        path: 'upload',
        loadComponent: () =>
          import('./components/product-upload/product-upload.component').then(
            (m) => m.ProductUploadComponent
          ),
      },
      { path: '', redirectTo: 'orders', pathMatch: 'full' }, // default
    ],
  },

  // ✅ Fallback → Home
  { path: '**', redirectTo: '', pathMatch: 'full' },
];

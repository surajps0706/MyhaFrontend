import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { ProductListComponent } from './components/product-list/product-list.component';
import { OrderSuccessComponent } from './components/order-success/order-success.component';
import { TrackOrderComponent } from './components/track-order/track-order.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [

  // =========================
  // 🏠 PUBLIC ROUTES
  // =========================
  { path: '', component: HomeComponent },
  { path: 'products', component: ProductListComponent },

  {
    path: 'product/:id',
    loadComponent: () =>
      import('./components/product-detail/product-detail.component')
        .then(m => m.ProductDetailComponent),
    runGuardsAndResolvers: 'paramsOrQueryParamsChange'
  },

  {
    path: 'terms-and-conditions',
    loadComponent: () =>
      import('./pages/terms-and-conditions/terms-and-conditions.component')
        .then(m => m.TermsAndConditionsComponent),
  },

  {
    path: 'cart',
    loadComponent: () =>
      import('./components/cart/cart.component')
        .then(m => m.CartComponent),
  },

  {
    path: 'wishlist',
    loadComponent: () =>
      import('./components/wishlist.component')
        .then(m => m.WishlistComponent),
  },

  {
    path: 'checkout',
    loadComponent: () =>
      import('./components/checkout/checkout.component')
        .then(m => m.CheckoutComponent),
  },

  { path: 'order-success', component: OrderSuccessComponent },
  { path: 'track', component: TrackOrderComponent },

  // =========================
  // 👤 CUSTOMER AUTH ROUTES
  // =========================
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/user-login/user-login.component')
        .then(m => m.UserLoginComponent),
  },

  {
    path: 'signup',
    loadComponent: () =>
      import('./pages/signup/signup.component')
        .then(m => m.SignupComponent),
  },

  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./pages/forgot-password/forgot-password.component')
        .then(m => m.ForgotPasswordComponent),
  },

  {
    path: 'reset-password',
    loadComponent: () =>
      import('./pages/reset-password/reset-password.component')
        .then(m => m.ResetPasswordComponent),
  },

  {
    path: 'my-orders',
    loadComponent: () =>
      import('./pages/my-orders/my-orders.component')
        .then(m => m.MyOrdersComponent)
  },

  // =========================
  // 🔐 ADMIN ROUTES
  // =========================

  // ADMIN LOGIN — must NOT be guarded
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./admin/login/login.component')
        .then(m => m.LoginComponent),
  },

  // ADMIN DASHBOARD + PROTECTED ROUTES
  {
    path: 'admin',
    children: [
      {
        path: '',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./components/admin-dashboard/admin-dashboard.component')
            .then(m => m.AdminDashboardComponent),
        children: [
          {
            path: 'orders',
            loadComponent: () =>
              import('./admin/orders/orders.component')
                .then(m => m.OrdersComponent),
          },
          {
            path: 'orders/:orderId',
            loadComponent: () =>
              import('./admin/order-detail/order-detail.component')
                .then(m => m.OrderDetailComponent),
          },
          {
            path: 'products',
            loadComponent: () =>
              import('./components/product-list-admin/product-list-admin.component')
                .then(m => m.ProductListAdminComponent),
          },
          {
            path: 'upload',
            loadComponent: () =>
              import('./components/product-upload/product-upload.component')
                .then(m => m.ProductUploadComponent),
          },

          // default admin redirect
          { path: '', redirectTo: 'orders', pathMatch: 'full' },
        ],
      }
    ]
  },

  // =========================
  // 🚨 FALLBACK — ALWAYS LAST
  // =========================
  { path: '**', redirectTo: '', pathMatch: 'full' },
];

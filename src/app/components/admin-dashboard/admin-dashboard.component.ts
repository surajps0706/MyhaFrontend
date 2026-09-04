import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent {
  constructor(private router: Router) {}

  // ✅ Sidebar links
adminLinks = [
  { label: 'Orders', icon: '📦', path: 'orders' },
  { label: 'Products', icon: '🛍️', path: 'products' },
  { label: 'Upload', icon: '➕', path: 'upload' },
  { label: 'Homepage', icon: '🏠', path: 'homepage' },
  { label: 'Reviews', icon: '💬', path: 'reviews' }
];

  // ✅ Logout function
  logout() {
    localStorage.removeItem('adminToken');
    this.router.navigate(['/admin/login']);
  }
}

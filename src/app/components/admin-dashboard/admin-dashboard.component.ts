
import {
  Component,
  OnInit,
  OnDestroy
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';

import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {

  // API URL
  private readonly apiUrl = environment.apiUrl;

  // Exchange count subscription
  private exchangeCountSubscription?: Subscription;

  // Active exchange count
  activeExchangeCount = 0;

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  // Sidebar links
  adminLinks = [
    { label: 'Orders', icon: '📦', path: 'orders' },
    { label: 'Products', icon: '🛍️', path: 'products' },
    { label: 'Upload', icon: '➕', path: 'upload' },
    { label: 'Homepage', icon: '🏠', path: 'homepage' },
    { label: 'Reviews', icon: '💬', path: 'reviews' },
    // { label: 'Exchange', icon: '🔄', path: 'exchange' },
    {
  label: 'Exchanges',
  path: '/admin/exchanges',
  icon: '🔄'
},
  ];

  // Initialize dashboard
  ngOnInit(): void {
    this.loadExchangeCount();
  }

  // Load active exchange count from backend
  loadExchangeCount(): void {

    const token = localStorage.getItem('admin_token');

    if (!token) {
      this.activeExchangeCount = 0;
      return;
    }

    // Cancel previous request subscription
    this.exchangeCountSubscription?.unsubscribe();

    this.exchangeCountSubscription = this.http.get<{ count: number }>(
      `${this.apiUrl}/admin/exchanges/count`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    ).subscribe({

      next: (response) => {

        this.activeExchangeCount = response.count ?? 0;

      },

      error: (error) => {

        console.error(
          'Failed to load exchange count:',
          error
        );

      }

    });

  }

  // Logout
  logout(): void {

    localStorage.removeItem('adminToken');

    this.router.navigate(['/admin/login']);

  }

  // Cleanup subscription
  ngOnDestroy(): void {

    this.exchangeCountSubscription?.unsubscribe();

  }

}

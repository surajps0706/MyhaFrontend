import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { SearchService } from '../../services/search.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  styleUrls: ['./header.component.css'],
  templateUrl: './header.component.html'
})
export class HeaderComponent {
  isMobileMenuOpen = false;
  cartCount = 0;
  wishlistCount = 0; // ✅ NEW
  searchQuery = '';
  suggestions: any[] = [];
  showSearchBar = false;

  private apiUrl = environment.apiUrl;

  constructor(
    private cartService: CartService,
    private searchService: SearchService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    // ✅ Cart count
    this.cartService.cartCount$.subscribe(count => {
      this.cartCount = count;
    });

    // ✅ Wishlist count (load on init + when route changes)
    this.loadWishlistCount();

    this.router.events.subscribe(() => {
      this.showSearchBar = this.router.url.includes('/products');
      this.loadWishlistCount(); // refresh count on navigation
    });

    // ✅ Optional: Listen for custom "wishlistUpdated" events
    window.addEventListener('wishlistUpdated', () => this.loadWishlistCount());
  }

  toggleMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

onSearch(event: any) {
  const query = event.target.value.trim();
  this.searchQuery = query;
  this.searchService.updateSearch(query);

  if (query.length > 1) {
    this.http.get<any[]>(`${this.apiUrl}/products`).subscribe(data => {
      this.suggestions = data
        .filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5);
    });
  } else {
    this.suggestions = [];
  }
}


  clearSuggestions() {
    this.suggestions = [];
  }

  // =======================
  // ✅ Wishlist helpers
  // =======================
  loadWishlistCount() {
    const saved = localStorage.getItem('wishlist');
    this.wishlistCount = saved ? JSON.parse(saved).length : 0;
  }
}

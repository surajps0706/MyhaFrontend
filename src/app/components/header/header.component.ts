import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { SearchService } from '../../services/search.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';

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
  wishlistCount = 0;
  searchQuery = '';
  suggestions: any[] = [];
  showSearchBar = false;

  isLoggedIn = false;
  userName: string | null = null;   // ✅ SHOW NAME

  private apiUrl = environment.apiUrl;

  constructor(
    private cartService: CartService,
    private searchService: SearchService,
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {

    // LOAD LOGIN INFO
    this.updateLoginState();

    // Update on route change
    this.router.events.subscribe(() => {
      this.updateLoginState();
      this.showSearchBar = this.router.url.includes('/products');
      this.loadWishlistCount();
    });

    // CART COUNT
    this.cartService.cartCount$.subscribe(count => {
      this.cartCount = count;
    });

    // WISHLIST COUNT
    this.loadWishlistCount();
    window.addEventListener('wishlistUpdated', () => this.loadWishlistCount());
  }

  // ============================
  // LOGIN + USER NAME
  // ============================
  updateLoginState() {
    this.isLoggedIn = this.authService.isLoggedIn();
    this.userName = this.authService.getUserName();   // ✅ LOAD NAME
  }

  logout() {
    this.authService.logout();
    this.updateLoginState();
    this.toggleMenu();
  }

  // ============================
  // MENU
  // ============================
  toggleMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  // ============================
  // SEARCH
  // ============================
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

  // ============================
  // WISHLIST
  // ============================
  loadWishlistCount() {
    const saved = localStorage.getItem('wishlist');
    this.wishlistCount = saved ? JSON.parse(saved).length : 0;
  }
}

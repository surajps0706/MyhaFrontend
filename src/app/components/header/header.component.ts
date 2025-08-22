import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { SearchService } from '../../services/search.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment'; // ✅ import env

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
  searchQuery = '';
  suggestions: any[] = [];
  showSearchBar = false;

  // ✅ Use API URL from environment
  private apiUrl = environment.apiUrl;

  constructor(
    private cartService: CartService,
    private searchService: SearchService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    this.cartService.cartCount$.subscribe(count => {
      this.cartCount = count;
    });

    // detect route changes
    this.router.events.subscribe(() => {
      this.showSearchBar = this.router.url.includes('/products');
    });
  }

  toggleMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  onSearch(event: any) {
    const query = event.target.value;
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
}

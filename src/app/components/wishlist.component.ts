import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.css']
})
export class WishlistComponent implements OnInit {
  wishlist: any[] = [];
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadWishlist();

    window.addEventListener('wishlistUpdated', () => this.loadWishlist());
  }

  loadWishlist() {
    const saved = localStorage.getItem('wishlist');
    const wishlistIds: number[] = saved ? JSON.parse(saved) : [];

    this.http.get<any[]>(`${this.apiUrl}/products`).subscribe((products) => {
      this.wishlist = products.filter((p) => wishlistIds.includes(p.id));
    });
  }

  removeFromWishlist(productId: number) {
    let saved = localStorage.getItem('wishlist');
    let wishlistIds: number[] = saved ? JSON.parse(saved) : [];
    wishlistIds = wishlistIds.filter(id => id !== productId);
    localStorage.setItem('wishlist', JSON.stringify(wishlistIds));

    this.wishlist = this.wishlist.filter(p => p.id !== productId);

    window.dispatchEvent(new Event('wishlistUpdated'));
  }
}

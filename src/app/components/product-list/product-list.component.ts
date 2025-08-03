import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  imports: [CommonModule, RouterModule],
  styleUrls: ['./product-list.component.css'],
  standalone: true,
})
export class ProductListComponent implements OnInit {
  products: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<any[]>('http://localhost:8000/products').subscribe({
      next: (data) => {
        this.products = data;
        console.log('✅ Products fetched:', this.products);
      },
      error: (err) => {
        console.error('❌ Error fetching products:', err);
      }
    });
  }
}

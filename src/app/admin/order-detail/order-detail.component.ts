import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.css']
})
export class OrderDetailComponent implements OnInit {
  orderId: string | null = null;
  order: any = null;
  token: string | null = null;
  baseUrl: string = environment.apiUrl;

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit(): void {
    this.token = localStorage.getItem('admin_token');
    this.orderId = this.route.snapshot.paramMap.get('orderId');

    if (this.token && this.orderId) {
      this.loadOrder();
    }
  }

  private authHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: 'Bearer ' + this.token });
  }

  loadOrder() {
    this.http.get(`${this.baseUrl}/orders/${this.orderId}`, {
      headers: this.authHeaders()
    }).subscribe({
      next: (res: any) => this.order = res,
      error: (err) => console.error('❌ Failed to load order details', err)
    });
  }
}

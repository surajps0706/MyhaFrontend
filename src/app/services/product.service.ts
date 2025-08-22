import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private baseurl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // =========================
  // Products
  // =========================
  getProducts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseurl}/products`);
  }

  getProductById(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseurl}/product/${id}`);
  }

// =========================
// Reviews
// =========================
getReviews(productId: string): Observable<any[]> {
  return this.http.get<any[]>(`${this.baseurl}/products/${productId}/reviews`);
}

addReview(productId: string, review: any, imageFile?: File): Observable<any> {
  const formData = new FormData();

  // append fields
  formData.append('name', review.name);
  formData.append('rating', review.rating.toString());
  formData.append('comment', review.comment);

  // append file only if user selected one
  if (imageFile) {
    formData.append('image', imageFile);
  }

  return this.http.post(`${this.baseurl}/products/${productId}/reviews`, formData);
}



}

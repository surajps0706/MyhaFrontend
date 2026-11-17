
import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpParams
} from '@angular/common/http';

import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ExchangeService {

private readonly apiUrl = 'https://myhabackend-production.up.railway.app';
  constructor(
    private http: HttpClient
  ) {}


private getHeaders(): HttpHeaders {

  const token = localStorage.getItem('admin_token');

  return new HttpHeaders({
    Authorization: `Bearer ${token}`
  });

}


completeExchange(requestId: string): Observable<any> {
  return this.http.patch(
    `${this.apiUrl}/admin/exchanges/${encodeURIComponent(requestId)}/complete`,
    {},
    {
      headers: this.getHeaders()
    }
  );
}


  // =========================
  // GET ALL EXCHANGE REQUESTS
  // =========================

  getExchanges(
    status?: string,
    search?: string
  ): Observable<any> {

    let params = new HttpParams();

    if (status && status !== 'All') {

      params = params.set('status', status);

    }

    if (search) {

      params = params.set('search', search);

    }

    return this.http.get(
      `${this.apiUrl}/admin/exchanges`,
      {
        headers: this.getHeaders(),
        params
      }
    );

  }

}

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CheckoutItem {
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface CheckoutSessionResponse {
  url: string;
  sessionId: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('gym_token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  createCheckoutSession(
    items: CheckoutItem[],
    userId: number
  ): Observable<CheckoutSessionResponse> {
    return this.http.post<CheckoutSessionResponse>(
      `${this.apiUrl}/payments/stripe/checkout-session`,
      { items, userId },
      { headers: this.getHeaders() }
    );
  }

  simulatePayment(
    items: CheckoutItem[],
    userId: number
  ): Observable<{ success: boolean; paymentId: number }> {
    return this.http.post<{ success: boolean; paymentId: number }>(
      `${this.apiUrl}/payments/simulate`,
      { items, userId },
      { headers: this.getHeaders() }
    );
  }

  verifyCheckoutSession(sessionId: string): Observable<{ success: boolean; status: string; orderId?: number }> {
    return this.http.get<{ success: boolean; status: string; orderId?: number }>(
      `${this.apiUrl}/payments/stripe/verify-session/${sessionId}`,
      { headers: this.getHeaders() }
    );
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  // Token injected globally by authInterceptor — no manual headers needed
  getPayments(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl + '/payments');
  }

  createCheckoutSession(
    items: CheckoutItem[],
    userId: number
  ): Observable<CheckoutSessionResponse> {
    return this.http.post<CheckoutSessionResponse>(
      `${this.apiUrl}/payments/stripe/checkout-session`,
      { items, userId }
    );
  }

  createMembershipCheckoutSession(
    membershipId: number,
    userId: number,
    successUrl?: string,
    cancelUrl?: string
  ): Observable<CheckoutSessionResponse> {
    return this.http.post<CheckoutSessionResponse>(
      `${this.apiUrl}/payments/stripe/checkout-session/membership`,
      { membershipId, userId, successUrl, cancelUrl }
    );
  }

  simulatePayment(
    items: CheckoutItem[],
    userId: number
  ): Observable<{ success: boolean; paymentId: number }> {
    return this.http.post<{ success: boolean; paymentId: number }>(
      `${this.apiUrl}/payments/simulate`,
      { items, userId }
    );
  }

  verifyCheckoutSession(sessionId: string): Observable<{ success: boolean; status: string; orderId?: number }> {
    return this.http.get<{ success: boolean; status: string; orderId?: number }>(
      `${this.apiUrl}/payments/stripe/verify-session/${sessionId}`
    );
  }
}

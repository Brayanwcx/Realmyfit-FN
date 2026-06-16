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

export interface PaymentIntentResponse {
  clientSecret: string;
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

  createPaymentIntent(
    items: CheckoutItem[],
    userId: number
  ): Observable<PaymentIntentResponse> {
    return this.http.post<PaymentIntentResponse>(
      `${this.apiUrl}/payments/stripe/payment-intent`,
      { items, userId }
    );
  }

  createMembershipPaymentIntent(
    membershipId: number,
    userId: number
  ): Observable<PaymentIntentResponse> {
    return this.http.post<PaymentIntentResponse>(
      `${this.apiUrl}/payments/stripe/payment-intent/membership`,
      { membershipId, userId }
    );
  }

  createEventPaymentIntent(
    eventId: number,
    userId: number
  ): Observable<PaymentIntentResponse> {
    return this.http.post<PaymentIntentResponse>(
      `${this.apiUrl}/payments/stripe/payment-intent/event`,
      { eventId, userId }
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

  simulateEventPayment(
    eventId: number,
    userId: number
  ): Observable<{ success: boolean; paymentId: number; registrationId: number; eventTitle: string; amount: number }> {
    return this.http.post<{ success: boolean; paymentId: number; registrationId: number; eventTitle: string; amount: number }>(
      `${this.apiUrl}/payments/simulate/event`,
      { eventId, userId }
    );
  }

  verifyPaymentIntent(clientSecret: string): Observable<{ success: boolean; status: string; orderId?: number; type?: string; eventId?: number }> {
    return this.http.get<{ success: boolean; status: string; orderId?: number; type?: string; eventId?: number }>(
      `${this.apiUrl}/payments/stripe/verify/${clientSecret}`
    );
  }

  cancelPaymentIntent(clientSecret: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(
      `${this.apiUrl}/payments/stripe/intent/${clientSecret}`
    );
  }

  failPaymentIntent(clientSecret: string): Observable<{ success: boolean }> {
    return this.http.patch<{ success: boolean }>(
      `${this.apiUrl}/payments/stripe/fail/${clientSecret}`,
      {}
    );
  }
}

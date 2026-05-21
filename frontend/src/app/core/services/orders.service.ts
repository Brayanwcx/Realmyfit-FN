import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/orders`;

  private getHeaders() {
    const token = localStorage.getItem('gym_token');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  getOrders(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  getOrder(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  updateOrder(id: number, data: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, data, { headers: this.getHeaders() });
  }

  deleteOrder(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}

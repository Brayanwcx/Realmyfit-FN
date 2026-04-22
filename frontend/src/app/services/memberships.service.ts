import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Membership {
  id?: number;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  benefits: string;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MembershipsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/memberships`;

  private getHeaders() {
    const token = localStorage.getItem('gym_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getMemberships(): Observable<Membership[]> {
    return this.http.get<Membership[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  getMembership(id: number): Observable<Membership> {
    return this.http.get<Membership>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  createMembership(data: Partial<Membership>): Observable<Membership> {
    return this.http.post<Membership>(this.apiUrl, data, { headers: this.getHeaders() });
  }

  updateMembership(id: number, data: Partial<Membership>): Observable<Membership> {
    return this.http.patch<Membership>(`${this.apiUrl}/${id}`, data, { headers: this.getHeaders() });
  }

  deleteMembership(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}

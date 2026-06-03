import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Membership {
  id?: number;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  benefits: string;
  isActive: boolean;
}

export interface UserMembership {
  id: number;
  startDate: string;
  endDate: string;
  status: string;
  membership: Membership;
}

@Injectable({
  providedIn: 'root'
})
export class MembershipsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/memberships`;

  // --- Public (no auth required) ---
  getPublicMemberships(): Observable<Membership[]> {
    return this.http.get<Membership[]>(`${environment.apiUrl}/public/memberships`);
  }

  subscribeToPlan(membershipId: number): Observable<UserMembership> {
    return this.http.post<UserMembership>(
      `${environment.apiUrl}/public/memberships/subscribe`,
      { membershipId }
    );
  }

  // --- Admin CRUD (auth required — token injected by authInterceptor) ---
  getMemberships(): Observable<Membership[]> {
    return this.http.get<Membership[]>(this.apiUrl);
  }

  getMembership(id: number): Observable<Membership> {
    return this.http.get<Membership>(`${this.apiUrl}/${id}`);
  }

  createMembership(data: Partial<Membership>): Observable<Membership> {
    return this.http.post<Membership>(this.apiUrl, data);
  }

  updateMembership(id: number, data: Partial<Membership>): Observable<Membership> {
    return this.http.patch<Membership>(`${this.apiUrl}/${id}`, data);
  }

  deleteMembership(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

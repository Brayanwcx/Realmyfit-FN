import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Review {
  id: number;
  rating: number;
  comment: string;
  isActive: boolean;
  createdAt: string;
  user: {
    id: number;
    name: string;
    lastName: string;
    email: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ReviewsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/reviews`;

  private getHeaders() {
    const token = localStorage.getItem('gym_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getReviews(): Observable<Review[]> {
    return this.http.get<Review[]>(this.apiUrl);
  }

  getReview(id: number): Observable<Review> {
    return this.http.get<Review>(`${this.apiUrl}/${id}`);
  }

  createReview(rating: number, comment: string, user_id: number): Observable<Review> {
    return this.http.post<Review>(this.apiUrl, { rating, comment, user_id }, { headers: this.getHeaders() });
  }

  updateReviewStatus(id: number, isActive: boolean): Observable<Review> {
    return this.http.patch<Review>(`${this.apiUrl}/${id}`, { isActive }, { headers: this.getHeaders() });
  }

  deleteReview(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}

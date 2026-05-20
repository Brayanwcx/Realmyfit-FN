import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReviewsService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getReviews(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/reviews`);
  }

  createReview(review: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reviews`, review);
  }

  updateReview(id: number, review: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/reviews/${id}`, review);
  }

  deleteReview(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/reviews/${id}`);
  }
}

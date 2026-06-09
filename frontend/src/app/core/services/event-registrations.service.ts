import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EventRegistrationsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/event-registrations`;

  create(data: { user_id: number; event_id: number; status?: string }): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getOne(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  update(id: number, data: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, data);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  cancel(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/cancel/${id}`);
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class EventRegistrationsService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/event-registrations`;

  findAll(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, { headers: this.authService.getHeaders() });
  }

  findOne(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, { headers: this.authService.getHeaders() });
  }

  create(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data, { headers: this.authService.getHeaders() });
  }

  update(id: number, data: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, data, { headers: this.authService.getHeaders() });
  }

  remove(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers: this.authService.getHeaders() });
  }

  cancel(id: number): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/cancel`, {}, { headers: this.authService.getHeaders() });
  }
}

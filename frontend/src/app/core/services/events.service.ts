import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class EventsService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/events`;

  getEvents(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, { headers: this.authService.getHeaders() });
  }

  getEvent(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, { headers: this.authService.getHeaders() });
  }

  createEvent(event: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, event, { headers: this.authService.getHeaders() });
  }

  updateEvent(id: number, event: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, event, { headers: this.authService.getHeaders() });
  }

  deleteEvent(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers: this.authService.getHeaders() });
  }

  uploadImage(file: File): Observable<{imageUrl: string}> {
    const formData = new FormData();
    formData.append('file', file);
    const token = this.authService.getHeaders().get('Authorization');
    const headers = token ? new HttpHeaders({ Authorization: token }) : new HttpHeaders();
    return this.http.post<{imageUrl: string}>(`${this.apiUrl}/upload-image`, formData, { headers });
  }

  getEventsPublic(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}

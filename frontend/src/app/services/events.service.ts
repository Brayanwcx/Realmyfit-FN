import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/events`;

  getEvents(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getEvent(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createEvent(event: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, event);
  }

  updateEvent(id: number, event: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, event);
  }

  deleteEvent(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  uploadImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${environment.apiUrl}/files/upload`, formData, { headers: this.getHeaders() });
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('gym_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }
}

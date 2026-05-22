import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ContactsService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/contacts`;

  /** Public: any visitor can send a message */
  send(data: { name: string; email: string; phone?: string; subject: string; message: string }): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  /** Admin only */
  findAll(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, { headers: this.authService.getHeaders() });
  }

  remove(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers: this.authService.getHeaders() });
  }

  markRead(id: number): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, { isRead: true }, { headers: this.authService.getHeaders() });
  }
}

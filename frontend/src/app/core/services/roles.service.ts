import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RolesService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  private getHeaders() {
    const token = localStorage.getItem('gym_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getRoles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/roles`, { headers: this.getHeaders() });
  }
}

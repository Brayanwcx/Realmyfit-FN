import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  private getHeaders() {
    const token = localStorage.getItem('gym_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users`, { headers: this.getHeaders() });
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${id}`, { headers: this.getHeaders() });
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      tap(response => {
        if (response.access_token) {
          localStorage.setItem('gym_token', response.access_token);
          if (response.user) {
            localStorage.setItem('gym_user', JSON.stringify(response.user));
          }
        }
      }),
      catchError(error => {
        console.error('Error en el login', error);
        return throwError(() => new Error('Credenciales inválidas o error de red'));
      })
    );
  }

  logout(): void {
    localStorage.removeItem('gym_token');
    localStorage.removeItem('gym_user');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('gym_token');
  }

  getUser() {
    const userStr = localStorage.getItem('gym_user');
    return userStr ? JSON.parse(userStr) : null;
  }
}

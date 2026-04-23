import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  private userSubject = new BehaviorSubject<any>(this.getUser());
  public currentUser = this.userSubject.asObservable();

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('gym_token');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      tap(response => {
        if (response.access_token) {
          localStorage.setItem('gym_token', response.access_token);
          if (response.user) {
            localStorage.setItem('gym_user', JSON.stringify(response.user));
            this.userSubject.next(response.user);
          }
        }
      }),
      catchError(error => {
        console.error('Error en el login', error);
        return throwError(() => new Error('Credenciales inválidas o error de red'));
      })
    );
  }

  register(data: {
    name: string;
    lastName: string;
    docType: string;
    docNumber: string;
    email: string;
    password: string;
    isActive: boolean;
    roleIds: number[];
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/register`, data).pipe(
      catchError(error => {
        console.error('Error en el registro', error);
        const message = error.error?.message || 'Error al registrar usuario';
        return throwError(() => new Error(Array.isArray(message) ? message.join(', ') : message));
      })
    );
  }

  getUserProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/auth/profile`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(user => {
        this.userSubject.next(user);
      }),
      catchError(error => {
        console.error('Error al obtener perfil', error);
        return throwError(() => new Error('Error al cargar el perfil'));
      })
    );
  }

  logout(): void {
    localStorage.removeItem('gym_token');
    localStorage.removeItem('gym_user');
    this.userSubject.next(null);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('gym_token');
  }

  isAdmin(): boolean {
    const user = this.getUser();
    if (!user?.roles) return false;
    return user.roles.some((r: any) => r.name === 'ADMIN' || r === 'ADMIN');
  }

  getUser() {
    const userStr = localStorage.getItem('gym_user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  getUserRoles(): string[] {
    const user = this.getUser();
    return user && user.roles ? user.roles : [];
  }
}

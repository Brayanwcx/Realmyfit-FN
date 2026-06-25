import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, tap, timeout } from 'rxjs/operators';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

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

  /** Método público para que otros servicios puedan obtener los headers JWT */
  getHeaders(): HttpHeaders {
    return this.getAuthHeaders();
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      timeout(5000),
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
        // Timeout o sin conexión al servidor
        if (error?.name === 'TimeoutError' || error?.status === 0) {
          return throwError(() => new Error('No se pudo conectar al servidor. Verifica tu conexión.'));
        }
        // Credenciales incorrectas (401)
        if (error?.status === 401) {
          if (error?.error?.message === 'Su cuenta ha sido inhabilitada. Contacte a soporte.') {
              return throwError(() => new Error('ACCOUNT_INACTIVE'));
          }
          return throwError(() => new Error('INVALID_CREDENTIALS'));
        }
        return throwError(() => new Error('Error inesperado. Intenta de nuevo.'));
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

  uploadAvatar(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<any>(`${this.apiUrl}/auth/profile/avatar`, formData, {
      headers: this.getAuthHeaders() // HttpClient handles multipart/form-data boundary automatically when sending FormData
    }).pipe(
      tap(response => {
        // Update user locally with a NEW object reference so Angular CD fires everywhere
        const currentUser = this.getUser();
        if (currentUser) {
          const updatedUser = { ...currentUser, profilePicture: response.profilePicture };
          localStorage.setItem('gym_user', JSON.stringify(updatedUser));
          this.userSubject.next(updatedUser);
        }
      }),
      catchError(error => {
        console.error('Error uploading avatar:', error);
        return throwError(() => new Error('Error al subir la imagen'));
      })
    );
  }

  logout(): void {
    localStorage.removeItem('gym_token');
    localStorage.removeItem('gym_user');
    this.userSubject.next(null);
  }

  setSession(token: string, user: any): void {
    localStorage.setItem('gym_token', token);
    if (user) {
      localStorage.setItem('gym_user', JSON.stringify(user));
      this.userSubject.next(user);
    } else {
      this.userSubject.next(null);
    }
  }

  /** Bug #9 fix: método público para actualizar el usuario localmente sin acceder a userSubject desde fuera */
  updateUserLocally(user: any): void {
    if (user) {
      localStorage.setItem('gym_user', JSON.stringify(user));
      this.userSubject.next(user);
    }
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('gym_token');
    if (!token) return false;

    // Bug #8 fix: verificar expiración del JWT decodificando el payload
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        // Token expirado: limpiar sesión silenciosamente
        localStorage.removeItem('gym_token');
        localStorage.removeItem('gym_user');
        this.userSubject.next(null);
        return false;
      }
    } catch {
      // Si el token no se puede decodificar, es inválido
      localStorage.removeItem('gym_token');
      localStorage.removeItem('gym_user');
      this.userSubject.next(null);
      return false;
    }

    return true;
  }

  isAdmin(): boolean {
    const user = this.getUser();
    if (!user?.roles) return false;
    // Bug #14 fix: soportar tanto { name: 'ADMIN' } como string 'ADMIN'
    return user.roles.some((r: any) => r.name === 'ADMIN' || r === 'ADMIN' || r.name === 'SUPERADMIN' || r === 'SUPERADMIN');
  }

  isSuperAdmin(): boolean {
    const user = this.getUser();
    if (!user?.roles) return false;
    return user.roles.some((r: any) => r.name === 'SUPERADMIN' || r === 'SUPERADMIN');
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

  forgotPassword(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/forgot-password`, { email }).pipe(
      catchError(error => {
        const message = error.error?.message || 'Error al solicitar el restablecimiento';
        return throwError(() => new Error(Array.isArray(message) ? message.join(', ') : message));
      })
    );
  }

  resetPassword(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/reset-password`, data).pipe(
      catchError(error => {
        const message = error.error?.message || 'Error al restablecer la contraseña';
        return throwError(() => new Error(Array.isArray(message) ? message.join(', ') : message));
      })
    );
  }
}

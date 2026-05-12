import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private apiUrl = environment.apiUrl;

  private wishlistSubject = new BehaviorSubject<any[]>([]);
  public wishlist$ = this.wishlistSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    // Cargar wishlist si ya hay sesión activa al iniciar
    if (this.authService.isAuthenticated()) {
      this.loadWishlist();
    }

    // Reaccionar a cambios de sesión (login / logout)
    this.authService.currentUser.subscribe(user => {
      if (user) {
        this.loadWishlist();
      } else {
        this.wishlistSubject.next([]);
      }
    });
  }

  loadWishlist() {
    this.http.get<any[]>(`${this.apiUrl}/auth/profile/wishlist`, {
      headers: this.authService.getHeaders()
    }).pipe(
      catchError(err => {
        console.error('Wishlist load error', err);
        return of([]);
      })
    ).subscribe(items => this.wishlistSubject.next(items || []));
  }

  isInWishlist(productId: number): boolean {
    return this.wishlistSubject.value.some(p => p.id === productId);
  }

  addToWishlist(productId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/profile/wishlist/${productId}`, {}, {
      headers: this.authService.getHeaders()
    }).pipe(
      tap(() => this.loadWishlist()),
      catchError(err => {
        console.error('Error adding to wishlist', err);
        return of(null);
      })
    );
  }

  removeFromWishlist(productId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/auth/profile/wishlist/${productId}`, {
      headers: this.authService.getHeaders()
    }).pipe(
      tap(() => {
        const updated = this.wishlistSubject.value.filter(p => p.id !== productId);
        this.wishlistSubject.next(updated);
      }),
      catchError(err => {
        console.error('Error removing from wishlist', err);
        return of(null);
      })
    );
  }

  toggleWishlist(productId: number): Observable<any> {
    if (this.isInWishlist(productId)) {
      return this.removeFromWishlist(productId);
    } else {
      return this.addToWishlist(productId);
    }
  }
}

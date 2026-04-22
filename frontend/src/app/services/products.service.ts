import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  private getHeaders() {
    const token = localStorage.getItem('gym_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getProducts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/products`, { headers: this.getHeaders() });
  }

  createProduct(product: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/products`, product, { headers: this.getHeaders() });
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/products/${id}`, { headers: this.getHeaders() });
  }

  updateProduct(id: number, product: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/products/${id}`, product, { headers: this.getHeaders() });
  }

  uploadImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    // Don't set Content-Type, browser will set it with boundary
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('gym_token')}`
    });
    return this.http.post<any>(`${this.apiUrl}/files/upload`, formData, { headers });
  }
}

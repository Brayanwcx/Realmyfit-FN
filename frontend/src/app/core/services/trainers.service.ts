import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class TrainersService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/trainers`;

  private getHeaders(): HttpHeaders {
    return this.authService.getHeaders();
  }

  getTrainers(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  getTrainersPublic(): Observable<any[]> {
    // GET público — sin token (para la página de usuarios)
    return this.http.get<any[]>(this.apiUrl);
  }

  getTrainer(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  uploadImage(file: File): Observable<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    // No ponemos Content-Type: el browser lo pone automáticamente con boundary
    const token = this.authService.getHeaders().get('Authorization');
    const headers = token ? new HttpHeaders({ Authorization: token }) : new HttpHeaders();
    return this.http.post<{ imageUrl: string }>(`${this.apiUrl}/upload-image`, formData, { headers });
  }

  createTrainer(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data, { headers: this.getHeaders() });
  }

  updateTrainer(id: number, data: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, data, { headers: this.getHeaders() });
  }

  deleteTrainer(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}

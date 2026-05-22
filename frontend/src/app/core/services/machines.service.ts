import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Machine {
  id?: number;
  name: string;
  description?: string;
  brand?: string;
  status: string;
  imageUrl?: string;
  acquisitionDate?: string;
  category?: string;
  videoUrl?: string;
  maxLoad?: string;
  muscleFocus?: string;
  recommendedLevel?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MachinesService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  private getHeaders() {
    const token = localStorage.getItem('gym_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getMachines(): Observable<Machine[]> {
    return this.http.get<Machine[]>(`${this.apiUrl}/machines`, { headers: this.getHeaders() });
  }

  getMachinesPublic(): Observable<Machine[]> {
    return this.http.get<Machine[]>(`${this.apiUrl}/machines`);
  }

  getMachinePublic(id: number): Observable<Machine> {
    return this.http.get<Machine>(`${this.apiUrl}/machines/${id}`);
  }

  createMachine(machine: Partial<Machine>): Observable<Machine> {
    return this.http.post<Machine>(`${this.apiUrl}/machines`, machine, { headers: this.getHeaders() });
  }

  updateMachine(id: number, machine: Partial<Machine>): Observable<Machine> {
    return this.http.patch<Machine>(`${this.apiUrl}/machines/${id}`, machine, { headers: this.getHeaders() });
  }

  deleteMachine(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/machines/${id}`, { headers: this.getHeaders() });
  }

  uploadImage(file: File): Observable<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ imageUrl: string }>(
      `${this.apiUrl}/machines/upload-image`,
      formData,
      { headers: new HttpHeaders({ 'Authorization': `Bearer ${localStorage.getItem('gym_token')}` }) }
    );
  }

  /**
   * Returns the full URL for a machine image.
   * If imageUrl is a relative path (e.g. /uploads/...) stored by the backend,
   * it prepends the backend host so the browser loads from the correct server.
   */
  getImageUrl(imageUrl: string | undefined): string {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    return `${this.apiUrl}${imageUrl}`;
  }
}

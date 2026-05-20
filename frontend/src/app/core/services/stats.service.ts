import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getMonthlyRevenue() {
    return this.http.get<{ labels: string[]; data: number[] }>(`${this.apiUrl}/payments/stats/monthly-revenue`);
  }
}

import { Component, OnInit, inject, DestroyRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
  destroyRef = inject(DestroyRef);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  settings: any = {
    contactEmail: 'contacto@realmyfit.com',
    whatsappNumber: '+57 321-769-0981'
  };

  ngOnInit() {
    this.http.get<any>(`${environment.apiUrl}/settings`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          if (data) {
            this.settings = Object.assign({}, this.settings, data);
            this.cdr.detectChanges();
          }
        },
        error: (err) => console.error('Error loading static footer payload', err)
      });
  }
}

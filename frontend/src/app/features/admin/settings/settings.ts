import { Component, OnInit, inject, DestroyRef, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../../core/services/settings.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import Swal from '../../../core/utils/app-swal';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrls: ['./settings.scss']
})
export class AdminSettingsComponent implements OnInit {
  destroyRef = inject(DestroyRef);
  private settingsService = inject(SettingsService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  settings: any = {
    contactEmail: '',
    whatsappNumber: '',
    locationAddress: '',
    googleMapsUrl: ''
  };

  loading = true;
  saving = false;

  ngOnInit() {
    this.settingsService.getSettings()
      .pipe(
        finalize(() => { this.loading = false; this.cdr.detectChanges(); }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (data) => {
          if (data) this.settings = { ...this.settings, ...data };
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error loading settings', err)
      });
  }

  saveSettings() {
    this.saving = true;
    this.cdr.detectChanges();

    // Smart Google Maps URL Parsing
    let rawUrl = this.settings.googleMapsUrl || '';
    if (rawUrl) {
      if (rawUrl.includes('src="')) {
        const match = rawUrl.match(/src="([^"]+)"/);
        if (match && match[1]) rawUrl = match[1];
      } else if (rawUrl.includes("src='")) {
        const match = rawUrl.match(/src='([^']+)'/);
        if (match && match[1]) rawUrl = match[1];
      }
      this.settings.googleMapsUrl = rawUrl.trim();
    }

    // Strip the auto-generated 'id' field so the DTO doesn't choke
    const { id, ...payload } = this.settings;

    this.settingsService.updateSettings(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.ngZone.run(() => {
            this.saving = false;
            this.settings = { ...this.settings, ...res };
            Swal.fire({
              toast: true,
              position: 'bottom-end',
              showConfirmButton: false,
              timer: 3000,
              timerProgressBar: true,
              icon: 'success',
              title: '¡Ajustes guardados correctamente!',
              background: '#22c55e',
              color: '#fff'
            });
            this.cdr.detectChanges();
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            this.saving = false;
            let msg = 'Error al guardar los ajustes.';
            if (err.status === 403) {
              msg = 'No tienes permisos para cambiar los ajustes.';
            } else if (err.error?.message) {
              msg = Array.isArray(err.error.message)
                ? err.error.message.join(', ')
                : String(err.error.message);
            }
            Swal.fire('Error', msg, 'error');
            this.cdr.detectChanges();
          });
        }
      });
  }
}

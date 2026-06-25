import { Component, inject, NgZone, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ContactsService } from '../../core/services/contacts.service';
import { SettingsService } from '../../core/services/settings.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import Swal from '../../core/utils/app-swal';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { finalize } from 'rxjs';

@Component({
  selector: 'app-contacto',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './contacto.html',
  styleUrls: ['./contacto.scss'],
})
export class Contacto {
    destroyRef = inject(DestroyRef);
  private contactsService = inject(ContactsService);
  private settingsService = inject(SettingsService);
  private sanitizer = inject(DomSanitizer);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  form = { name: '', phone: '', email: '', subject: '', message: '' };
  isSubmitting = false;

  settings: any = null;
  safeMapsUrl: SafeResourceUrl | null = null;
  settingsLoading = true;

  ngOnInit() {
    this.settingsService.getSettings()
      .pipe(
        finalize(() => { this.settingsLoading = false; this.cdr.detectChanges(); }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (data) => {
          if (data) {
            this.settings = data;
            // Smart Parsing: bypass security restrictions for the iframe source
            let rawUrl = data.googleMapsUrl || '';
            if (rawUrl.includes('src="')) {
              const match = rawUrl.match(/src="([^"]+)"/);
              if (match && match[1]) rawUrl = match[1];
            } else if (rawUrl.startsWith('src=')) {
              rawUrl = rawUrl.replace('src=', '').replace(/"/g, '');
            }

            if (rawUrl) {
              this.safeMapsUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl);
            }
          }
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Failed to parse settings', err)
      });
  }

  submitForm(e: Event) {
    e.preventDefault();
    this.isSubmitting = true;

    this.contactsService.send(this.form).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isSubmitting = false;
            this.form = { name: '', phone: '', email: '', subject: '', message: '' };
            this.cdr.detectChanges();
            Swal.fire({
                        icon: 'success',
                        title: '¡Mensaje enviado!',
                        text: 'Nuestro equipo se pondrá en contacto pronto.',
                        background: '#1a1a2e',
                        color: '#fff',
                        confirmButtonColor: '#4ade80',
                        confirmButtonText: 'Aceptar',
                        timer: 3000
                      });
      },
      error: (err) => {
        this.isSubmitting = false;
          this.cdr.detectChanges();
          const msg = err?.error?.message || 'Error al enviar el mensaje. Intenta de nuevo.';
          Swal.fire({
                      icon: 'error',
                      title: 'Error al enviar',
                      text: msg,
                      background: '#1a1a2e',
                      color: '#fff',
                      confirmButtonColor: '#4ade80'
                    });
      }
    });
  }
}

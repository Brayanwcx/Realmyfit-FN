import { Component, inject, NgZone, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ContactsService } from '../../core/services/contacts.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-contacto',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './contacto.html',
  styleUrls: ['./contacto.scss'],
})
export class Contacto {
  private contactsService = inject(ContactsService);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  form = { name: '', phone: '', email: '', subject: '', message: '' };
  isSubmitting = false;

  submitForm(e: Event) {
    e.preventDefault();
    this.isSubmitting = true;

    this.contactsService.send(this.form).subscribe({
      next: () => {
        this.ngZone.run(() => {
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
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
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
        });
      }
    });
  }
}

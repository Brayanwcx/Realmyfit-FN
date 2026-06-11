import { Component, OnInit, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactsService } from '../../core/services/contacts.service';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-contacts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contacts.html',
  styleUrls: ['./contacts.scss']})
export class AdminContactsComponent implements OnInit {
  private contactsService = inject(ContactsService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  messages: any[] = [];
  loading = true;
  errorMessage = '';
  page = 1;
  pageSize = 10;

  get totalPages() { return Math.ceil(this.messages.length / this.pageSize); }
  get pagedMessages() { return this.messages.slice((this.page-1)*this.pageSize, this.page*this.pageSize); }
  get pageNumbers() { return Array.from({length: this.totalPages}, (_, i) => i + 1); }
  min(a: number, b: number) { return Math.min(a, b); }

  ngOnInit() { this.fetchMessages(); }

  fetchMessages() {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.contactsService.findAll()
      .pipe(finalize(() => { this.loading = false; this.cdr.detectChanges(); }))
      .subscribe({
        next: (data: any[]) => { this.messages = data.sort((a: any, b: any) => +new Date(b.createdAt) - +new Date(a.createdAt)); this.page = 1; },
        error: () => { this.errorMessage = 'No se pudieron cargar los mensajes.'; }
      });
  }

  markRead(msg: any) {
    this.contactsService.markRead(msg.id).subscribe({
      next: () => {
        this.ngZone.run(() => {
          msg.isRead = true;
          this.cdr.detectChanges();
        });
      },
      error: () => console.error('Error al marcar como leído.')
    });
  }

  readMessage(msg: any) {
    if (!msg.isRead) {
      this.markRead(msg);
    }
    this.ngZone.run(() => {
      Swal.fire({
        title: `Mensaje de <br><span style="color: #7c3aed; font-size: 1.4rem;">${msg.name}</span>`,
        html:
          '<div style="text-align: left; padding: 1.5rem; background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">' +
            '<p style="margin-bottom: 0.75rem; font-size: 0.95rem; color: rgba(255,255,255,0.6);"><strong>Correo:</strong> <span style="color: #fff;">' + msg.email + '</span></p>' +
            (msg.phone ? '<p style="margin-bottom: 0.75rem; font-size: 0.95rem; color: rgba(255,255,255,0.6);"><strong>Teléfono:</strong> <span style="color: #fff;">' + msg.phone + '</span></p>' : '') +
            '<p style="margin-bottom: 0.5rem; font-size: 0.95rem; color: rgba(255,255,255,0.6);"><strong>Asunto:</strong> <span style="color: #fff;">' + msg.subject + '</span></p>' +
            '<hr style="border-color: rgba(255,255,255,0.05); margin: 1.5rem 0;">' +
            '<div style="white-space: pre-wrap; font-size: 1.05rem; line-height: 1.6; color: rgba(255,255,255,0.9);">' + msg.message + '</div>' +
          '</div>',
        background: '#1a1a2e',
        color: '#f5f5f5',
        confirmButtonText: 'Cerrar Mensaje',
        confirmButtonColor: '#7c3aed',
        width: '600px'
      });
    });
  }

  deleteMessage(id: number) {
    this.ngZone.run(() => {
      Swal.fire({
        title: '¿Eliminar mensaje?',
        text: 'Esta acción no se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#22c55e',
        cancelButtonColor: '#ef4444',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          this.contactsService.remove(id).subscribe({
            next: () => {
              this.fetchMessages();
              this.ngZone.run(() => {
                Swal.fire('¡Eliminado!', 'El mensaje ha sido eliminado.', 'success');
              });
            },
            error: () => {
              this.ngZone.run(() => {
                Swal.fire('Error', 'No se pudo eliminar el mensaje.', 'error');
              });
            }
          });
        }
      });
    });
  }
}

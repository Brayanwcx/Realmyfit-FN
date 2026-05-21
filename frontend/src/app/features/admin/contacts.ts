import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactsService } from '../../core/services/contacts.service';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-contacts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="view-header">
      <h2>Mensajes de Contacto</h2>
      <p class="subtitle">Mensajes recibidos desde el formulario público</p>
    </div>

    <div class="table-container glass">
      @if (loading) { <div class="state-msg">Cargando mensajes...</div> }
      @if (errorMessage) {
        <div class="state-msg error">
          {{ errorMessage }}
          <button class="btn-primary" (click)="fetchMessages()">Reintentar</button>
        </div>
      }
      @if (!loading && !errorMessage && messages.length === 0) {
        <div class="state-msg">No hay mensajes de contacto aún.</div>
      }
      @if (!loading && !errorMessage && messages.length > 0) {
        <table>
          <thead>
            <tr>
              <th>Estado</th>
              <th>Nombre</th>
              <th>Correo / Teléfono</th>
              <th>Asunto</th>
              <th>Mensaje</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (msg of messages; track msg.id) {
              <tr [class.unread]="!msg.isRead">
                <td>
                  <span class="dot" [class.unread-dot]="!msg.isRead" [class.read-dot]="msg.isRead"
                    title="{{ msg.isRead ? 'Leído' : 'No leído' }}"></span>
                </td>
                <td class="fw-bold">{{ msg.name }}</td>
                <td>
                  <div>{{ msg.email }}</div>
                  @if (msg.phone) { <div class="text-sm op-7">{{ msg.phone }}</div> }
                </td>
                <td>{{ msg.subject }}</td>
                <td class="msg-cell">{{ msg.message.length > 60 ? (msg.message.substring(0, 60)) + '...' : msg.message }}</td>
                <td class="text-sm op-7">{{ msg.createdAt | date:'short' }}</td>
                <td class="actions-cell">
                  <button class="btn-icon" style="border-color: rgba(14,165,233,0.5); color: #38bdf8;" (click)="readMessage(msg)">Leer</button>
                  @if (!msg.isRead) {
                    <button class="btn-icon" (click)="markRead(msg)">✓ Leído</button>
                  }
                  <button class="btn-icon delete" (click)="deleteMessage(msg.id)">Eliminar</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `,
  styles: [`
    .view-header { margin-bottom: 2rem; }
    .view-header h2 { margin: 0; }
    .subtitle { color: rgba(255,255,255,0.6); margin: 0.25rem 0 0; font-size: 0.9rem; }
    .table-container { padding: 1.25rem; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; color: #fff; }
    th { padding: 0.75rem 1rem; color: rgba(255,255,255,0.6); font-weight: 600; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid rgba(255,255,255,0.08); }
    td { padding: 0.75rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); vertical-align: top; }
    tr.unread td { background: rgba(99,102,241,0.05); }
    .fw-bold { font-weight: 600; }
    .text-sm { font-size: 0.8rem; }
    .op-7 { opacity: 0.7; }
    .msg-cell { max-width: 240px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.88rem; opacity: 0.85; }
    .state-msg { padding: 3rem; text-align: center; color: rgba(255,255,255,0.55); }
    .state-msg.error { color: #ff6b6b; }
    .dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; }
    .read-dot { background: rgba(255,255,255,0.2); }
    .unread-dot { background: #6366f1; box-shadow: 0 0 6px #6366f1; }
    .actions-cell { display: flex; gap: 0.4rem; flex-wrap: wrap; }
    .btn-icon { background: none; border: 1px solid rgba(255,255,255,0.12); color: #fff; padding: 0.35rem 0.7rem; border-radius: 8px; cursor: pointer; font-size: 0.78rem; transition: 0.2s; }
    .btn-icon:hover { background: rgba(255,255,255,0.06); }
    .btn-icon.delete { border-color: rgba(255,77,77,0.35); color: #ff9090; }
    .btn-icon.delete:hover { background: rgba(255,77,77,0.1); }
  `]
})
export class AdminContactsComponent implements OnInit {
  private contactsService = inject(ContactsService);
  private cdr = inject(ChangeDetectorRef);

  messages: any[] = [];
  loading = true;
  errorMessage = '';

  ngOnInit() { this.fetchMessages(); }

  fetchMessages() {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.contactsService.findAll()
      .pipe(finalize(() => { this.loading = false; this.cdr.detectChanges(); }))
      .subscribe({
        next: (data) => { this.messages = data.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)); },
        error: () => { this.errorMessage = 'No se pudieron cargar los mensajes.'; }
      });
  }

  markRead(msg: any) {
    this.contactsService.markRead(msg.id).subscribe({
      next: () => { msg.isRead = true; this.cdr.detectChanges(); },
      error: () => console.error('Error al marcar como leído.')
    });
  }

  readMessage(msg: any) {
    if (!msg.isRead) {
      this.markRead(msg);
    }
    Swal.fire({
      title: `Mensaje de ${msg.name}`,
      html: `
        <div style="text-align: left; padding: 1rem; background: rgba(0,0,0,0.05); border-radius: 8px; border: 1px solid #e2e8f0;">
          <p style="margin-bottom: 0.5rem; color: #0ea5e9; font-size: 0.9rem;"><strong>Asunto:</strong> ${msg.subject}</p>
          <hr style="border-color: #e2e8f0; margin: 1rem 0;">
          <p style="white-space: pre-wrap; font-size: 0.95rem; line-height: 1.5; color: #1e293b;">${msg.message}</p>
        </div>
      `,
      background: '#fff',
      color: '#1a1a2e',
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#0ea5e9'
    });
  }

  deleteMessage(id: number) {
    Swal.fire({
      title: '¿Eliminar mensaje?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      background: '#fff',
      color: '#1a1a2e',
      confirmButtonColor: '#ff4d4d',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.contactsService.remove(id).subscribe({
          next: () => {
            Swal.fire({ title: 'Eliminado', text: 'El mensaje ha sido eliminado.', icon: 'success', background: '#fff', color: '#1a1a2e', confirmButtonColor: '#0ea5e9', timer: 1500, showConfirmButton: false });
            this.fetchMessages();
          },
          error: () => Swal.fire({ title: 'Error', text: 'No se pudo eliminar', icon: 'error', background: '#fff', color: '#1a1a2e', confirmButtonColor: '#0ea5e9' })
        });
      }
    });
  }
}

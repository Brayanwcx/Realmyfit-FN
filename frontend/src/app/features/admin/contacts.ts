import { Component, OnInit, inject, ChangeDetectorRef, NgZone } from '@angular/core';
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
      @if (loading) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando mensajes...</p>
        </div>
      }

      @if (errorMessage) {
        <div class="error-state">
          <p>Error: {{ errorMessage }}</p>
          <button class="btn-primary" (click)="fetchMessages()">Reintentar</button>
        </div>
      }

      @if (!loading && !errorMessage && messages.length > 0) {
        <table class="desktop-table">
          <thead>
            <tr>
              <th width="40px">Est</th>
              <th>Contacto</th>
              <th>Asunto</th>
              <th>Mensaje</th>
              <th width="120px">Fecha</th>
              <th width="260px">Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (msg of messages; track msg.id) {
              <tr [class.unread]="!msg.isRead">
                <td style="text-align: center;">
                  <span class="dot" [class.unread-dot]="!msg.isRead" [class.read-dot]="msg.isRead"
                    title="{{ msg.isRead ? 'Leído' : 'No leído' }}"></span>
                </td>
                <td>
                  <div class="product-name">{{ msg.name }}</div>
                  <div class="product-desc">{{ msg.email }}</div>
                  @if (msg.phone) { <div class="product-desc">{{ msg.phone }}</div> }
                </td>
                <td class="fw-bold">{{ msg.subject }}</td>
                <td class="msg-cell">{{ msg.message.length > 50 ? (msg.message.substring(0, 50)) + '...' : msg.message }}</td>
                <td class="product-desc">{{ msg.createdAt | date:'short' }}</td>
                <td>
                  <div class="actions-cell">
                    <button class="btn-icon" style="border-color: rgba(14,165,233,0.35); color: #38bdf8;" (click)="readMessage(msg)" title="Leer Mensaje">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                      Leer
                    </button>
                    @if (!msg.isRead) {
                      <button class="btn-icon confirm" (click)="markRead(msg)" title="Marcar como Leído">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </button>
                    }
                    <button class="btn-icon delete" (click)="deleteMessage(msg.id)" title="Eliminar">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>

        <!-- Mobile cards -->
        <div class="mobile-cards">
          @for (msg of messages; track msg.id) {
            <div class="mobile-card glass" [class.unread-card]="!msg.isRead">
              <div class="card-row">
                <span class="card-label">Estado</span>
                <span class="card-value">
                  <span class="dot" [class.unread-dot]="!msg.isRead" [class.read-dot]="msg.isRead"></span>
                  {{ msg.isRead ? 'Leído' : 'Nuevo' }}
                </span>
              </div>
              <div class="card-row">
                <span class="card-label">Contacto</span>
                <span class="card-value fw-bold">{{ msg.name }} <br><span class="text-sm op-7">{{ msg.email }}</span></span>
              </div>
              <div class="card-row">
                <span class="card-label">Asunto</span>
                <span class="card-value fw-bold">{{ msg.subject }}</span>
              </div>
              <div class="card-actions">
                <button class="btn-icon" style="flex: 1; border-color: rgba(14,165,233,0.35); color: #38bdf8;" (click)="readMessage(msg)">Leer</button>
                @if (!msg.isRead) {
                  <button class="btn-icon confirm" (click)="markRead(msg)">✓ Leído</button>
                }
                <button class="btn-icon delete" (click)="deleteMessage(msg.id)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </div>
          }
        </div>
      }

      @if (!loading && !errorMessage && messages.length === 0) {
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
          <p>Bandeja de entrada vacía.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .view-header { margin-bottom: 2rem; }
    .view-header h2 { margin: 0; font-size: 1.8rem; font-weight: 700; background: linear-gradient(to right, #fff, rgba(255,255,255,0.7)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .subtitle { color: rgba(255,255,255,0.6); margin: 0.25rem 0 0; font-size: 0.9rem; }
    
    .table-container { padding: 1.5rem; overflow-x: auto; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); }
    .desktop-table { width: 100%; min-width: 750px; border-collapse: separate; border-spacing: 0; text-align: left; }
    .desktop-table th { padding: 1rem; color: rgba(255,255,255,0.6); font-weight: 600; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .desktop-table td { padding: 1.2rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); vertical-align: middle; color: #fff; }
    
    tr.unread td { background: rgba(14, 165, 233, 0.05); }
    .unread-card { border-left: 3px solid rgba(14, 165, 233, 0.6) !important; background: rgba(14, 165, 233, 0.03) !important; }

    .product-name { font-weight: 600; color: #fff; margin-bottom: 0.15rem; }
    .product-desc { font-size: 0.82rem; color: rgba(255,255,255,0.5); }
    .msg-cell { max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.88rem; opacity: 0.85; }
    
    .loading-state, .empty-state, .error-state { padding: 4rem 2rem; text-align: center; color: rgba(255,255,255,0.55); display: flex; flex-direction: column; align-items: center; gap: 1rem; }
    .empty-state svg { color: rgba(255,255,255,0.2); }
    .error-state { color: #ff4d4d; }
    .spinner { width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.1); border-top-color: var(--color-primary, #0ea5e9); border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    
    .dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; }
    .read-dot { background: rgba(255,255,255,0.2); }
    .unread-dot { background: #0ea5e9; box-shadow: 0 0 8px #0ea5e9; }
    
    .actions-cell { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .btn-icon { display: inline-flex; align-items: center; gap: 0.4rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 0.5rem 0.8rem; border-radius: 8px; cursor: pointer; transition: 0.3s; font-size: 0.8rem; font-weight: 500; }
    .btn-icon:hover { background: rgba(255,255,255,0.1); }
    .btn-icon.confirm { border-color: rgba(34,197,94,0.35); color: #4ade80; }
    .btn-icon.confirm:hover { background: rgba(34,197,94,0.1); }
    .btn-icon.delete { border-color: rgba(239,68,68,0.35); color: #f87171; }
    .btn-icon.delete:hover { background: rgba(239,68,68,0.1); }
    .btn-primary { display: inline-flex; align-items: center; justify-content: center; background: var(--color-primary, #0ea5e9); color: #000; padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: 600; border: none; cursor: pointer; }

    .mobile-cards { display: none; }
    @media (max-width: 768px) {
      .desktop-table { display: none; }
      .mobile-cards { display: flex; flex-direction: column; gap: 1rem; }
      .mobile-card { padding: 1.25rem; background: rgba(255,255,255,0.02); border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); }
      .card-row { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
      .card-label { font-size: 0.85rem; color: rgba(255,255,255,0.6); }
      .card-value { color: white; font-weight: 500; font-size: 0.9rem; text-align: right; }
      .card-actions { display: flex; gap: 0.5rem; margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid rgba(255,255,255,0.05); }
      .card-actions .btn-icon { flex: 1; justify-content: center; text-align: center; }
    }
  `]
})
export class AdminContactsComponent implements OnInit {
  private contactsService = inject(ContactsService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

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
        next: (data: any[]) => { this.messages = data.sort((a: any, b: any) => +new Date(b.createdAt) - +new Date(a.createdAt)); },
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
        title: 'Mensaje de <br><span style="color: var(--color-primary); font-size: 1.4rem;">' + msg.name + '</span>',
        html: 
          '<div style="text-align: left; padding: 1.5rem; background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">' +
            '<p style="margin-bottom: 0.75rem; font-size: 0.95rem; color: rgba(255,255,255,0.6);"><strong>Correo:</strong> <span style="color: #fff;">' + msg.email + '</span></p>' +
            (msg.phone ? '<p style="margin-bottom: 0.75rem; font-size: 0.95rem; color: rgba(255,255,255,0.6);"><strong>Teléfono:</strong> <span style="color: #fff;">' + msg.phone + '</span></p>' : '') +
            '<p style="margin-bottom: 0.5rem; font-size: 0.95rem; color: rgba(255,255,255,0.6);"><strong>Asunto:</strong> <span style="color: #fff;">' + msg.subject + '</span></p>' +
            '<hr style="border-color: rgba(255,255,255,0.05); margin: 1.5rem 0;">' +
            '<div style="white-space: pre-wrap; font-size: 1.05rem; line-height: 1.6; color: rgba(255,255,255,0.9);">' + msg.message + '</div>' +
          '</div>',
        background: '#121212',
        color: '#fff',
        confirmButtonText: 'Cerrar Mensaje',
        confirmButtonColor: '#0ea5e9',
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
        background: '#121212',
        color: '#fff',
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

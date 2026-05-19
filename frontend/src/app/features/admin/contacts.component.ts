import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactsService } from '../../core/services/contacts.service';

@Component({
  selector: 'app-admin-contacts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="view-header">
      <h2>Mensajes de Contacto</h2>
    </div>
    <div class="table-container glass">
      <div *ngIf="loading" class="loading-state">Cargando mensajes...</div>
      <table *ngIf="!loading && contacts.length > 0">
        <thead>
          <tr><th>Nombre</th><th>Email</th><th>Mensaje</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let c of contacts">
            <td>{{ c.name }}</td>
            <td>{{ c.email }}</td>
            <td>{{ c.message }}</td>
          </tr>
        </tbody>
      </table>
      <div *ngIf="!loading && contacts.length === 0" class="empty-state">No hay mensajes.</div>
    </div>
  `,
  styles: [`
    .view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .table-container { padding: 1rem; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { padding: 1rem; color: rgba(255,255,255,0.6); font-weight: 500; border-bottom: 1px solid rgba(255,255,255,0.1); }
    td { padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .loading-state, .empty-state { padding: 3rem; text-align: center; color: rgba(255,255,255,0.5); }
  `]
})
export class AdminContactsComponent implements OnInit {
  private service = inject(ContactsService);
  contacts: any[] = [];
  loading = true;

  ngOnInit() {
    this.service.getContacts().subscribe({
      next: (data) => { this.contacts = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }
}

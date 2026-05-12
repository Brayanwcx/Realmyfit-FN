import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-placeholder',
  standalone: true,
  template: `
    <div class="view-header">
      <h2>Próximamente</h2>
    </div>
    <p>Este módulo de administración está en desarrollo.</p>
  `,
  styles: [`
    .view-header { margin-bottom: 2rem; }
  `]
})
export class AdminPlaceholderComponent {}

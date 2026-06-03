import { Component, OnInit, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReviewsService, Review } from '../../core/services/reviews.service';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="view-header">
      <h2>Gestión de Reseñas</h2>
    </div>
    
    <div class="table-container glass">
      @if (loading) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando reseñas...</p>
        </div>
      }
      
      @if (errorMessage) {
        <div class="error-state">
          <p>Error: {{ errorMessage }}</p>
          <button class="btn-primary" (click)="fetchReviews()">Reintentar</button>
        </div>
      }

      @if (!loading && !errorMessage && reviews.length > 0) {
        <!-- Vista Desktop -->
        <table class="desktop-table">
          <thead>
            <tr>
              <th width="200px">Usuario</th>
              <th width="120px">Puntaje</th>
              <th>Comentario</th>
              <th width="120px">Fecha</th>
              <th width="120px">Estado</th>
              <th width="200px">Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (review of pagedReviews; track review.id) {
              <tr>
                <td>
                  <div class="product-name">{{ review.user?.name || 'Anónimo' }} {{ review.user?.lastName || '' }}</div>
                </td>
                <td>
                  <div class="stars">
                    @for (star of [1,2,3,4,5]; track star) {
                      <span class="star" [class.filled]="star <= review.rating">★</span>
                    }
                  </div>
                </td>
                <td>
                  <div class="product-desc" [title]="review.comment">{{ review.comment || 'Sin comentario' }}</div>
                </td>
                <td class="font-bold">{{ review.createdAt | date:'shortDate' }}</td>
                <td>
                  <span class="badge" [class.badge-active]="review.isActive" [class.badge-inactive]="!review.isActive">
                    {{ review.isActive ? 'Activa' : 'Inactiva' }}
                  </span>
                </td>
                <td>
                  <div class="actions-cell">
                    <button class="btn-icon" (click)="toggleStatus(review)" title="Cambiar estado">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      {{ review.isActive ? 'Ocultar' : 'Publicar' }}
                    </button>
                    <button class="btn-icon delete" (click)="deleteReview(review)" title="Eliminar">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>

        <!-- Vista Mobile -->
        <div class="mobile-cards">
          @for (review of pagedReviews; track review.id) {
            <div class="mobile-card glass">
              <div class="card-header">
                <div class="card-title" style="margin-left: 0;">
                  <h4>{{ review.user?.name || 'Anónimo' }} {{ review.user?.lastName || '' }}</h4>
                  <div class="stars" style="margin-top: 4px;">
                    @for (star of [1,2,3,4,5]; track star) {
                      <span class="star" [class.filled]="star <= review.rating">★</span>
                    }
                  </div>
                </div>
              </div>
              <div class="card-row">
                <span class="card-label">Comentario</span>
                <div class="card-value product-desc" style="max-width: 60%; text-align: right;">{{ review.comment || 'Sin comentario' }}</div>
              </div>
              <div class="card-row">
                <span class="card-label">Fecha</span>
                <div class="card-value font-bold">{{ review.createdAt | date:'shortDate' }}</div>
              </div>
              <div class="card-row">
                <span class="card-label">Estado</span>
                <div class="card-value">
                  <span class="badge" [class.badge-active]="review.isActive" [class.badge-inactive]="!review.isActive">
                    {{ review.isActive ? 'Activa' : 'Inactiva' }}
                  </span>
                </div>
              </div>
              <div class="card-actions">
                <button class="btn-icon" (click)="toggleStatus(review)">
                  @if (review.isActive) {
                    Ocultar
                  } @else {
                    Publicar
                  }
                </button>
                <button class="btn-icon delete" (click)="deleteReview(review)">Eliminar</button>
              </div>
            </div>
          }
        </div>

        <!-- Paginación -->
        @if (totalPages > 1) {
          <div class="pagination">
            <button class="page-btn" (click)="page = 1" [disabled]="page === 1">«</button>
            <button class="page-btn" (click)="page = page - 1" [disabled]="page === 1">‹</button>
            @for (p of pageNumbers; track p) {
              <button class="page-btn" [class.active]="p === page" (click)="page = p">{{ p }}</button>
            }
            <button class="page-btn" (click)="page = page + 1" [disabled]="page === totalPages">›</button>
            <button class="page-btn" (click)="page = totalPages" [disabled]="page === totalPages">»</button>
            <span class="page-info">{{ (page-1)*pageSize+1 }}–{{ min(page*pageSize, reviews.length) }} de {{ reviews.length }}</span>
          </div>
        }
      }

      @if (!loading && !errorMessage && reviews.length === 0) {
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          <p>No se encontraron reseñas.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .view-header h2 { font-size: 1.8rem; margin: 0; font-weight: 700; background: linear-gradient(to right, #fff, rgba(255,255,255,0.7)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    
    .btn-primary { display: inline-flex; align-items: center; justify-content: center; background: var(--color-primary, #22c55e); color: #000; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; border: none; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3); }
    .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(34, 197, 94, 0.4); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }
    
    .table-container { padding: 1.5rem; overflow-x: auto; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); }
    .desktop-table { width: 100%; min-width: 800px; border-collapse: separate; border-spacing: 0; text-align: left; }
    .desktop-table th { padding: 1rem; color: rgba(255,255,255,0.6); font-weight: 600; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .desktop-table td { padding: 1.2rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); vertical-align: middle; }
    
    .loading-state, .empty-state, .error-state { padding: 4rem 2rem; text-align: center; color: rgba(255,255,255,0.5); display: flex; flex-direction: column; align-items: center; gap: 1rem; }
    .empty-state svg { color: rgba(255,255,255,0.2); }
    .error-state { color: #ff4d4d; }
    
    .product-name { font-weight: 600; font-size: 1.05rem; color: #fff; margin-bottom: 0.25rem; }
    .product-desc { font-size: 0.85rem; color: rgba(255,255,255,0.5); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .font-bold { font-weight: 700; color: #fff; }
    
    .badge { padding: 0.35rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.5px; display: inline-block; }
    .badge-active, .badge-good { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); }
    .badge-inactive, .badge-low { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
    
    .actions-cell { display: flex; gap: 0.5rem; }
    .btn-icon { display: inline-flex; align-items: center; gap: 0.4rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 0.5rem 0.8rem; border-radius: 8px; cursor: pointer; transition: 0.3s; font-size: 0.8rem; font-weight: 500; }
    .btn-icon:hover { background: rgba(255,255,255,0.1); }
    .btn-icon.delete:hover { background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3); color: #f87171; }

    .stars { color: rgba(255,255,255,0.2); }
    .star.filled { color: #ffd700; }
    
    .spinner { width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.1); border-top-color: var(--color-primary, #22c55e); border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .pagination { display: flex; align-items: center; gap: 0.4rem; justify-content: center; padding: 1.5rem 0 0.5rem; flex-wrap: wrap; }
    .page-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; width: 36px; height: 36px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; transition: 0.2s; display: inline-flex; align-items: center; justify-content: center; }
    .page-btn:hover:not(:disabled) { background: rgba(255,255,255,0.12); }
    .page-btn.active { background: var(--color-primary, #22c55e); color: #000; font-weight: 700; border-color: transparent; }
    .page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
    .page-info { font-size: 0.8rem; color: rgba(255,255,255,0.45); margin-left: 0.5rem; }

    .mobile-cards { display: none; }

    /* Mobile Responsive */
    @media (max-width: 768px) {
      .desktop-table { display: none; }
      .mobile-cards { display: flex; flex-direction: column; gap: 1rem; }
      
      .mobile-card { padding: 1.25rem; background: rgba(255,255,255,0.02); border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); }
      .card-header { display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
      .card-title h4 { margin: 0 0 0.5rem 0; font-size: 1.1rem; }
      .card-row { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; }
      .card-label { font-size: 0.85rem; color: rgba(255,255,255,0.6); }
      .card-value { color: white; font-weight: 500; }
      .card-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.05); }
      .card-actions .btn-icon { justify-content: center; margin: 0; padding: 0.75rem; }
    }
  `]
})
export class AdminReviewsComponent implements OnInit {
  private reviewsService = inject(ReviewsService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  
  reviews: Review[] = [];
  loading = true;
  errorMessage = '';
  page = 1;
  pageSize = 10;

  get totalPages() { return Math.ceil(this.reviews.length / this.pageSize); }
  get pagedReviews() { return this.reviews.slice((this.page-1)*this.pageSize, this.page*this.pageSize); }
  get pageNumbers() { return Array.from({length: this.totalPages}, (_, i) => i + 1); }
  min(a: number, b: number) { return Math.min(a, b); }

  ngOnInit() {
    this.fetchReviews();
  }

  fetchReviews() {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.reviewsService.getReviews()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (data) => {
          this.ngZone.run(() => {
            this.reviews = data || [];
            this.page = 1;
            this.cdr.detectChanges();
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            console.error('Error fetching reviews', err);
            this.errorMessage = err.status === 401 ? 'No autorizado.' : (err.message || 'Error de conexión');
            this.cdr.detectChanges();
          });
        }
      });
  }

  toggleStatus(review: Review) {
    const newStatus = !review.isActive;
    const actionText = newStatus ? 'publicar' : 'ocultar';

    Swal.fire({
      title: '¿Deseas ' + actionText + ' esta reseña?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#22c55e',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.reviewsService.updateReviewStatus(review.id, newStatus).subscribe({
          next: (updatedReview) => {
            this.ngZone.run(() => {
              review.isActive = updatedReview.isActive;
              Swal.fire('¡Éxito!', 'La reseña ha sido ' + (newStatus ? 'publicada' : 'ocultada') + ' correctamente.', 'success');
              this.cdr.detectChanges();
            });
          },
          error: (err) => {
            this.ngZone.run(() => {
              console.error('Error updating review', err);
              Swal.fire('Error', 'Error al actualizar el estado de la reseña', 'error');
            });
          }
        });
      }
    });
  }

  deleteReview(review: Review) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esto. Se eliminará la reseña permanentemente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#22c55e',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.reviewsService.deleteReview(review.id).subscribe({
          next: () => {
            this.ngZone.run(() => {
              this.reviews = this.reviews.filter(r => r.id !== review.id);
              Swal.fire('¡Eliminado!', 'La reseña ha sido eliminada.', 'success');
              this.cdr.detectChanges();
            });
          },
          error: (err) => {
            this.ngZone.run(() => {
              console.error('Error deleting review', err);
              Swal.fire('Error', 'No se pudo eliminar la reseña', 'error');
            });
          }
        });
      }
    });
  }
}

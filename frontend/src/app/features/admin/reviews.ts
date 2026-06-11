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
  templateUrl: './reviews.html',
  styleUrls: ['./reviews.scss']})
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

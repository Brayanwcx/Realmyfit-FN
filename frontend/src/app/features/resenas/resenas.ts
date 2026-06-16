import { Component, OnInit, inject, ChangeDetectorRef, NgZone, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReviewsService, Review } from '../../core/services/reviews.service';
import { AuthService } from '../../core/services/auth.service';
import Swal from '../../core/utils/app-swal';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: 'app-resenas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './resenas.html',
  styleUrls: ['./resenas.scss'],
})
export class Resenas implements OnInit {
    destroyRef = inject(DestroyRef);
  private reviewsService = inject(ReviewsService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  reviews: Review[] = [];
  globalRating = 0;
  totalReviews = 0;
  showForm = false;
  selectedRating: number | null = null;
  currentUser: any = null;

  // Form
  newRating: number = 5;
  newComment: string = '';
  isSubmitting = false;

  ngOnInit() {
    this.authService.currentUser.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(user => {
      this.currentUser = user;
        this.cdr.detectChanges();
    });
    this.fetchReviews();
  }

  fetchReviews() {
    this.reviewsService.getReviews().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.reviews = data.filter(r => r.isActive !== false);
            this.totalReviews = this.reviews.length;
            if (this.totalReviews > 0) {
                        const sum = this.reviews.reduce((acc, r) => acc + r.rating, 0);
                        this.globalRating = Number((sum / this.totalReviews).toFixed(1));
                      } else {
                        this.globalRating = 0;
                      }
            this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching reviews:', err);
      }
    });
  }

  toggleForm() {
    if (!this.currentUser) {
      Swal.fire({
        title: '¡Ups!',
        text: 'Debes iniciar sesión para publicar una reseña',
        icon: 'warning',
        confirmButtonColor: 'var(--color-primary)'
      });
      return;
    }
    this.showForm = !this.showForm;
    this.newRating = 5;
    this.newComment = '';
  }

  submitReview() {
    if (!this.currentUser) return;
    
    this.isSubmitting = true;
    const ratingValue = Number(this.newRating);
    const userId = Number(this.currentUser.id || this.currentUser.sub);
    
    this.reviewsService.createReview(ratingValue, this.newComment, userId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (review) => {
        this.reviews = [{...review, user: this.currentUser}, ...this.reviews];
            this.totalReviews = this.reviews.length;
            const sum = this.reviews.reduce((acc, r) => acc + r.rating, 0);
            this.globalRating = Number((sum / this.totalReviews).toFixed(1));
            this.isSubmitting = false;
            this.showForm = false;
            this.cdr.detectChanges();
            Swal.fire({
                        title: '¡Gracias!',
                        text: 'Reseña publicada con éxito',
                        icon: 'success',
                        confirmButtonColor: 'var(--color-primary)'
                      });
      },
      error: (err) => {
        console.error('Error creating review', err);
          this.isSubmitting = false;
          this.cdr.detectChanges();
          Swal.fire({
                      title: 'Error',
                      text: 'Ocurrió un error al publicar la reseña',
                      icon: 'error',
                      confirmButtonColor: 'var(--color-primary)'
                    });
      }
    });
  }

  get filteredReviews() {
    if (this.selectedRating === null) {
      return this.reviews;
    }
    return this.reviews.filter(review => review.rating === this.selectedRating);
  }

  setFilter(rating: number | null) {
    this.selectedRating = rating;
  }
}

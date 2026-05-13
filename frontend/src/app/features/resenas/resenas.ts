import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReviewsService, Review } from '../../core/services/reviews.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-resenas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './resenas.html',
  styleUrls: ['./resenas.scss'],
})
export class Resenas implements OnInit {
  private reviewsService = inject(ReviewsService);
  private authService = inject(AuthService);

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
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });
    this.fetchReviews();
  }

  fetchReviews() {
    this.reviewsService.getReviews().subscribe({
      next: (data) => {
        // Only show active reviews
        this.reviews = data.filter(r => r.isActive !== false);
        this.totalReviews = this.reviews.length;
        if (this.totalReviews > 0) {
          const sum = this.reviews.reduce((acc, r) => acc + r.rating, 0);
          this.globalRating = Number((sum / this.totalReviews).toFixed(1));
        } else {
          this.globalRating = 0;
        }
      },
      error: (err) => {
        console.error('Error fetching reviews:', err);
      }
    });
  }

  toggleForm() {
    if (!this.currentUser) {
      alert('Debes iniciar sesión para publicar una reseña');
      return;
    }
    this.showForm = !this.showForm;
    this.newRating = 5;
    this.newComment = '';
  }

  submitReview() {
    if (!this.currentUser) return;
    
    this.isSubmitting = true;
    this.reviewsService.createReview(this.newRating, this.newComment, this.currentUser.id || this.currentUser.sub).subscribe({
      next: (review) => {
        // Optimistically add it since it defaults to active: true
        this.reviews.unshift({...review, user: this.currentUser});
        this.totalReviews++;
        // Recalculate global rating
        const sum = this.reviews.reduce((acc, r) => acc + r.rating, 0);
        this.globalRating = Number((sum / this.totalReviews).toFixed(1));
        
        this.isSubmitting = false;
        this.showForm = false;
        alert('¡Reseña publicada con éxito!');
      },
      error: (err) => {
        console.error('Error creating review', err);
        this.isSubmitting = false;
        alert('Ocurrió un error al publicar la reseña');
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

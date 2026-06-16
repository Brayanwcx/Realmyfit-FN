import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReviewsService } from '../../core/services/reviews.service';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reviews.component.html',
  styleUrls: ['./reviews.component.scss']})
export class AdminReviewsComponent implements OnInit {
    destroyRef = inject(DestroyRef);
  private service = inject(ReviewsService);
  reviews: any[] = [];
  loading = true;

  ngOnInit() {
    this.service.getReviews().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => { this.reviews = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }
}

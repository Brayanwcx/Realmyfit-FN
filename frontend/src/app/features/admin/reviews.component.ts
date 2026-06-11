import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReviewsService } from '../../core/services/reviews.service';

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reviews.component.html',
  styleUrls: ['./reviews.component.scss']})
export class AdminReviewsComponent implements OnInit {
  private service = inject(ReviewsService);
  reviews: any[] = [];
  loading = true;

  ngOnInit() {
    this.service.getReviews().subscribe({
      next: (data) => { this.reviews = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }
}

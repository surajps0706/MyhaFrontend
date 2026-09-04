import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './reviews.component.html',
  styleUrls: ['./reviews.component.css']
})
export class ReviewsComponent implements OnInit {

  private baseUrl = environment.apiUrl;

  reviews: any[] = [];

  loading = true;

  errorMessage = '';

  successMessage = '';

  replyingTo: string | null = null;

  replyText = '';

  savingReply = false;


  constructor(
    private http: HttpClient
  ) {}


  ngOnInit(): void {

    this.loadReviews();

  }


  // ==========================================================
  // LOAD ALL REVIEWS
  // ==========================================================

  loadReviews(): void {

    this.loading = true;

    this.errorMessage = '';

    const token =
      localStorage.getItem('admin_token');


    if (!token) {

      this.errorMessage =
        'Admin session expired. Please login again.';

      this.loading = false;

      return;
    }


    const headers =
      new HttpHeaders().set(
        'Authorization',
        `Bearer ${token}`
      );


    this.http.get<any[]>(
      `${this.baseUrl}/admin/reviews`,
      { headers }
    ).subscribe({

      next: (data) => {

        this.reviews =
          Array.isArray(data)
            ? data
            : [];

        this.loading = false;

      },

      error: (err) => {

        console.error(
          'Failed to load reviews:',
          err
        );

        this.errorMessage =
          err?.error?.detail ||
          'Failed to load reviews.';

        this.loading = false;

      }

    });
  }


  // ==========================================================
  // OPEN REPLY BOX
  // ==========================================================

  openReply(review: any): void {

    this.successMessage = '';

    this.errorMessage = '';

    this.replyingTo = review.id;

    // If a reply already exists,
    // load it for editing.

    this.replyText =
      review.adminReply?.comment || '';

  }


  // ==========================================================
  // CANCEL REPLY
  // ==========================================================

  cancelReply(): void {

    this.replyingTo = null;

    this.replyText = '';

    this.savingReply = false;

  }


  // ==========================================================
  // SAVE REPLY
  // ==========================================================

  saveReply(review: any): void {

    this.successMessage = '';

    this.errorMessage = '';


    const reply =
      this.replyText.trim();


    if (!reply) {

      this.errorMessage =
        'Please write a reply.';

      return;
    }


    const token =
      localStorage.getItem('admin_token');


    if (!token) {

      this.errorMessage =
        'Admin session expired. Please login again.';

      return;
    }


    const headers =
      new HttpHeaders().set(
        'Authorization',
        `Bearer ${token}`
      );


    this.savingReply = true;


    this.http.put<any>(
      `${this.baseUrl}/reviews/${review.id}/reply`,
      {
        comment: reply
      },
      {
        headers
      }
    ).subscribe({

      next: (response) => {

        this.savingReply = false;


        // --------------------------------------------
        // Update review immediately in UI
        // --------------------------------------------

        if (response?.review) {

          review.adminReply =
            response.review.adminReply;

        } else {

          review.adminReply = {

            comment: reply,

            createdAt:
              new Date().toISOString()

          };

        }


        this.successMessage =
          'Reply saved successfully.';


        this.replyingTo = null;

        this.replyText = '';

      },

      error: (err) => {

        console.error(
          'Failed to save reply:',
          err
        );

        this.savingReply = false;

        this.errorMessage =
          err?.error?.detail ||
          'Failed to save reply.';

      }

    });

  }


  // ==========================================================
  // CHECK WHETHER REPLY BOX IS OPEN
  // ==========================================================

  isReplying(review: any): boolean {

    return this.replyingTo === review.id;

  }


  // ==========================================================
  // DATE FORMAT
  // ==========================================================

  formatDate(date: any): string {

    if (!date) {
      return '';
    }

    const parsedDate =
      new Date(date);

    if (isNaN(parsedDate.getTime())) {
      return '';
    }

    return parsedDate.toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }
    );

  }


  // ==========================================================
  // TRACK BY
  // ==========================================================

  trackByReview(
    index: number,
    review: any
  ): string {

    return review.id || index.toString();

  }

}
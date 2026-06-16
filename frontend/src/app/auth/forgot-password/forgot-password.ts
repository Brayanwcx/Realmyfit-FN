import { Component, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.html',
  styleUrls: ['../login/login.component.scss']
})
export class ForgotPasswordComponent {
    destroyRef = inject(DestroyRef);
  forgotPasswordForm: FormGroup;
  loading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.forgotPasswordForm.invalid) return;

    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const email = this.forgotPasswordForm.get('email')?.value;

    this.authService.forgotPassword(email).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.successMessage = response.message || 'Código enviado. Revisa tu correo electrónico.';
        this.loading = false;
        this.cdr.detectChanges();
        // Optionally redirect to reset-password page after a short delay
        setTimeout(() => {
          this.router.navigate(['/reset-password'], { queryParams: { email: email } });
        }, 3000);
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './reset-password.html',
  styleUrls: ['../login/login.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm: FormGroup;
  loading = false;
  successMessage = '';
  errorMessage = '';

  // Password strength
  passwordStrength = 0;
  passwordStrengthLabel = '';
  passwordStrengthColor = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.resetPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['email']) {
        this.resetPasswordForm.patchValue({ email: params['email'] });
      }
    });

    this.resetPasswordForm.get('newPassword')?.valueChanges.subscribe(val => {
      this.calculatePasswordStrength(val || '');
      this.cdr.detectChanges();
    });
  }

  calculatePasswordStrength(pw: string) {
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    this.passwordStrength = score;

    const labels = ['', 'Muy débil', 'Débil', 'Regular', 'Fuerte', 'Muy fuerte'];
    const colors = ['', '#ff4757', '#ff6b35', '#ffa502', '#2ed573', '#27ae60'];

    this.passwordStrengthLabel = labels[score] || '';
    this.passwordStrengthColor = colors[score] || '';
  }

  onSubmit() {
    if (this.resetPasswordForm.invalid) return;

    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const formData = this.resetPasswordForm.value;

    this.authService.resetPassword(formData).subscribe({
      next: (response) => {
        this.successMessage = response.message || 'Contraseña restablecida exitosamente.';
        this.loading = false;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.router.navigate(['/login']);
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

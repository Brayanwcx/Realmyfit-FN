import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  name = '';
  lastName = '';
  docType = 'CC';
  docNumber = '';
  email = '';
  password = '';
  confirmPassword = '';

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Las contrasenas no coinciden.';
      return;
    }

    this.isLoading = true;

    this.authService
      .register({
        name: this.name,
        lastName: this.lastName,
        docType: this.docType,
        docNumber: this.docNumber,
        email: this.email,
        password: this.password,
      })
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = 'Registro exitoso. Ya puedes iniciar sesion.';
          setTimeout(() => this.router.navigate(['/login']), 900);
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.message || 'No se pudo registrar la cuenta.';
        },
      });
  }
}

import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { FormsModule } from '@angular/forms'; // Ensure template-driven form capability
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit() {
    this.errorMessage = '';
    this.isLoading = true;

    this.authService.login(this.email, this.password).subscribe({
      next: (res) => {
        this.isLoading = false;
        // User successfully authenticated! Navigate wherever, maybe a dashboard or generic redirect
        this.router.navigate(['/']);
        // Might optionally trigger a toastr or navbar refresh
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.message || 'Error desconocido';
      }
    });
  }
}

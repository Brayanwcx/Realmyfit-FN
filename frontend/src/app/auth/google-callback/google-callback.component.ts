import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-google-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0a0a12;
      flex-direction: column;
      gap: 1rem;
    ">
      <div style="
        width: 48px;
        height: 48px;
        border: 3px solid rgba(39,174,96,0.2);
        border-top-color: #27ae60;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      "></div>
      <p style="color: #a0a0a0; font-family: sans-serif; font-size: 0.9rem;">
        Iniciando sesión con Google...
      </p>
      <style>
        @keyframes spin { to { transform: rotate(360deg); } }
      </style>
    </div>
  `,
})
export class GoogleCallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      const userStr = params['user'];

      if (token) {
        if (userStr) {
          try {
            const user = JSON.parse(decodeURIComponent(userStr));
            this.authService.setSession(token, user);

            // Determinar si es admin
            const isAdmin = user?.roles?.some((r: any) =>
              r.name === 'ADMIN' || r === 'ADMIN'
            );

            this.router.navigate([isAdmin ? '/admin' : '/']);
          } catch {
            this.authService.setSession(token, null);
            this.router.navigate(['/']);
          }
        } else {
          this.authService.setSession(token, null);
          this.router.navigate(['/']);
        }
      } else {
        // Sin token → error, volver al login
        this.router.navigate(['/auth/login'], {
          queryParams: { error: 'google_auth_failed' }
        });
      }
    });
  }
}

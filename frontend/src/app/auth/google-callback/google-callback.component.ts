import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-google-callback',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './google-callback.component.html',
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

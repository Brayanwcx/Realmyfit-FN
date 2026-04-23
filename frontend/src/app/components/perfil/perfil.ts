import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './perfil.html',
  styleUrls: ['./perfil.scss']
})
export class PerfilComponent implements OnInit {
  user: any = null;
  activeTab = 'info';
  isLoading = true;

  tabs = [
    { id: 'info', label: 'Mi Información', icon: 'user' },
    { id: 'memberships', label: 'Membresías', icon: 'card' },
    { id: 'orders', label: 'Mis Pedidos', icon: 'bag' },
    { id: 'events', label: 'Mis Eventos', icon: 'calendar' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    this.user = this.authService.getUser();
    this.isLoading = false;

    // Try to load full profile from backend
    this.authService.getUserProfile().subscribe({
      next: (profile) => {
        this.user = profile;
        // Update local storage with fresh data
        localStorage.setItem('gym_user', JSON.stringify(profile));
      },
      error: () => { /* Use cached data */ }
    });
  }

  get userInitials(): string {
    if (!this.user) return '?';
    const first = (this.user.name || '')[0] || '';
    const last = (this.user.lastName || '')[0] || '';
    return (first + last).toUpperCase() || '?';
  }

  get userRole(): string {
    if (!this.user?.roles) return 'Usuario';
    const roles = this.user.roles;
    if (roles.some((r: any) => r.name === 'ADMIN' || r === 'ADMIN')) return 'Administrador';
    return 'Miembro';
  }

  get memberSince(): string {
    // Fallback since we don't have createdAt in entity
    return 'Miembro activo';
  }

  setTab(tabId: string) {
    this.activeTab = tabId;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}

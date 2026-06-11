import { Component, inject, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '../../core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class AdminComponent implements OnInit {
  private sanitizer = inject(DomSanitizer);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  userName: string = 'Administrador';
  userInitials: string = 'A';
  userAvatar: string | null = null;
  isUploadingAvatar: boolean = false;
  isSidebarOpen: boolean = false;
  isDropdownOpen: boolean = false;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-profile')) {
      this.isDropdownOpen = false;
    }
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  logout() {
    this.authService.logout();
  }

  menuItems = [
    {
      label: 'Dashboard',
      icon: 'grid',
      route: '/admin/dashboard',
      svg: this.sanitize(
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>',
      ),
    },
    {
      label: 'Usuarios',
      icon: 'users',
      route: '/admin/users',
      svg: this.sanitize(
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
      ),
    },
    {
      label: 'Entrenadores',
      icon: 'clipboard',
      route: '/admin/trainers',
      svg: this.sanitize(
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h8"></path><path d="M8 10h8"></path><path d="M8 14h8"></path><path d="M8 18h8"></path><rect x="3" y="3" width="18" height="18" rx="2"></rect></svg>',
      ),
    },
    {
      label: 'Productos',
      icon: 'package',
      route: '/admin/products',
      svg: this.sanitize(
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.6"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>',
      ),
    },
    {
      label: 'Máquinas',
      icon: 'server',
      route: '/admin/machines',
      svg: this.sanitize(
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>',
      ),
    },
    {
      label: 'Membresías',
      icon: 'credit-card',
      route: '/admin/memberships',
      svg: this.sanitize(
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>',
      ),
    },
    {
      label: 'Eventos',
      icon: 'calendar',
      route: '/admin/events',
      svg: this.sanitize(
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
      ),
    },
    {
      label: 'Inscripciones',
      icon: 'check-circle',
      route: '/admin/event-registrations',
      svg: this.sanitize(
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
      ),
    },
    {
      label: 'Mensajes',
      icon: 'mail',
      route: '/admin/contacts',
      svg: this.sanitize(
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>',
      ),
    },
    {
      label: 'Reseñas',
      icon: 'message-square',
      route: '/admin/reviews',
      svg: this.sanitize(
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
      ),
    },
    {
      label: 'Pagos',
      icon: 'credit-card',
      route: '/admin/orders',
      svg: this.sanitize(
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>',
      ),
    },
  ];

  ngOnInit() {
    this.authService.currentUser.subscribe((user: any) => {
      if (user) {
        this.userName = user.name || (user.email ? user.email.split('@')[0] : 'Administrador');
        this.userInitials = this.userName.charAt(0).toUpperCase();
        this.userAvatar = user.profilePicture || null;
        this.cdr.detectChanges();
      }
    });
  }

  onAvatarFileSelected(event: any) {
    const file: File = event.target.files?.[0];
    if (!file) return;

    // Show instant preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.userAvatar = e.target?.result as string;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);

    // Upload to server
    this.isUploadingAvatar = true;
    this.authService.uploadAvatar(file).subscribe({
      next: () => {
        this.isUploadingAvatar = false;
        Swal.fire('¡Éxito!', 'Foto de perfil actualizada', 'success');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isUploadingAvatar = false;
        Swal.fire('Error', 'No se pudo actualizar la foto de perfil', 'error');
        console.error(err);
      },
    });
  }

  private sanitize(svg: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }
}

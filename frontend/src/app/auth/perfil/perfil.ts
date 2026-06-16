import { Component, OnInit, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';
import { WishlistService } from '../../core/services/wishlist.service';
import { CartService } from '../../core/services/cart.service';
import { EventRegistrationsService } from '../../core/services/event-registrations.service';
import Swal from '../../core/utils/app-swal';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, ImageCropperComponent],
  templateUrl: './perfil.html',
  styleUrls: ['./perfil.scss']
})
export class PerfilComponent implements OnInit {
    destroyRef = inject(DestroyRef);
  user: any = null;
  activeTab = 'info';
  isLoading = true;
  isUploading = false;
  localImageUrl: string | ArrayBuffer | null = null;

  showCropModal = false;
  imageChangedEvent: any = '';
  croppedImageBlob: Blob | null = null;
  croppedImageUrl: string | null = null;

  tabs = [
    { id: 'info', label: 'Mi Información', icon: 'user' },
    { id: 'wishlist', label: 'Lista de Deseos', icon: 'heart' },
    { id: 'memberships', label: 'Membresías', icon: 'card' },
    { id: 'events', label: 'Mis Eventos', icon: 'calendar' }
  ];

  wishlistItems: any[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private wishlistService: WishlistService,
    private cartService: CartService,
    private regService: EventRegistrationsService
  ) {}

  ngOnInit() {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    this.user = this.authService.getUser();
    this.isLoading = false;

    this.wishlistService.wishlist$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(items => {
      this.wishlistItems = items;
      this.cdr.detectChanges();
    });

    // Try to load full profile from backend
    this.authService.getUserProfile().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (profile) => {
        this.user = profile;
        localStorage.setItem('gym_user', JSON.stringify(profile));
        this.cdr.detectChanges();
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
    return 'Miembro activo';
  }

  get activeEventsCount(): number {
    if (!this.user?.eventRegistrations) return 0;
    return this.user.eventRegistrations.filter((r: any) => r.status !== 'CANCELLED').length;
  }

  setTab(tabId: string) {
    this.activeTab = tabId;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  onFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.imageChangedEvent = event;
      this.showCropModal = true;
      this.cdr.detectChanges();
    }
  }

  imageCropped(event: ImageCroppedEvent) {
    this.croppedImageUrl = event.objectUrl || event.base64 || null;
    this.croppedImageBlob = event.blob || null;
  }

  cancelCrop() {
    this.showCropModal = false;
    this.imageChangedEvent = '';
    this.croppedImageBlob = null;
    this.croppedImageUrl = null;
    this.cdr.detectChanges();
  }

  saveCrop() {
    if (this.croppedImageBlob) {
      this.showCropModal = false;
      this.isUploading = true;
      
      if (this.croppedImageUrl) {
        this.localImageUrl = this.croppedImageUrl;
        // Bug #9 fix: usar método público en vez de acceder directamente a userSubject privado
        const currentUser = this.authService.getUser();
        if (currentUser) {
          const preview = { ...currentUser, profilePicture: this.croppedImageUrl };
          this.authService.updateUserLocally(preview);
        }
      }
      this.cdr.detectChanges();

      const file = new File([this.croppedImageBlob], 'avatar.png', { type: 'image/png' });
      
      this.authService.uploadAvatar(file).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (res) => {
          this.isUploading = false;
          if (this.user) {
            this.user.profilePicture = res.profilePicture;
          }
          this.localImageUrl = null;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isUploading = false;
          console.error('Error uploading avatar', err);
          const errorMessage = err?.error?.message || err?.message || 'Error desconocido';
          alert(`Hubo un error al subir la imagen: ${errorMessage}`);
        }
      });
    }
  }

  removeFromWishlist(productId: number) {
    this.wishlistService.removeFromWishlist(productId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  addToCartFromWishlist(producto: any) {
    if (!producto.stock || producto.stock <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Agotado',
        text: 'Este producto se encuentra agotado actualmente.',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    const productToAdd = { ...producto, qty: producto.qty || 1 };
    this.cartService.addToCart(productToAdd, productToAdd.qty);
    
    Swal.fire({
      icon: 'success',
      title: '¡Añadido!',
      text: 'El producto ha sido añadido a tu carrito correctamente',
      showConfirmButton: false,
      timer: 1500
    });
  }

  cancelarAsistencia(reg: any) {
    Swal.fire({
      title: '¿Cancelar Inscripción?',
      text: 'Liberarás tu cupo para que otra persona pueda asistir.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No, mantener',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8'
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.regService.cancelOwn(reg.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          // Actualizar estado localmente sin recargar la página
          reg.status = 'CANCELLED';
          // Actualizar el contador en el sidebar
          if (this.user?.eventRegistrations) {
            this.user.eventRegistrations = this.user.eventRegistrations.filter(
              (r: any) => r.id !== reg.id || r.status !== 'CANCELLED'
            );
          }
          this.cdr.detectChanges();
          Swal.fire('¡Cancelada!', 'Tu inscripción ha sido cancelada exitosamente.', 'success');
        },
        error: () => {
          Swal.fire('Error', 'No se pudo cancelar. Intenta más tarde.', 'error');
        }
      });
    });
  }
}


import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';
import { WishlistService } from '../../core/services/wishlist.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, ImageCropperComponent],
  templateUrl: './perfil.html',
  styleUrls: ['./perfil.scss']
})
export class PerfilComponent implements OnInit {
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
    { id: 'orders', label: 'Mis Pedidos', icon: 'bag' },
    { id: 'events', label: 'Mis Eventos', icon: 'calendar' }
  ];

  wishlistItems: any[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private wishlistService: WishlistService,
    private cartService: CartService
  ) {}

  ngOnInit() {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    this.user = this.authService.getUser();
    this.isLoading = false;

    this.wishlistService.wishlist$.subscribe(items => {
      this.wishlistItems = items;
      this.cdr.detectChanges();
    });

    // Try to load full profile from backend
    this.authService.getUserProfile().subscribe({
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
      }
      this.cdr.detectChanges();

      const file = new File([this.croppedImageBlob], 'avatar.png', { type: 'image/png' });
      
      this.authService.uploadAvatar(file).subscribe({
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
    this.wishlistService.removeFromWishlist(productId).subscribe();
  }

  addToCartFromWishlist(producto: any) {
    // Si el producto no tiene qty, le asignamos 1
    const productToAdd = { ...producto, qty: producto.qty || 1 };
    this.cartService.addToCart(productToAdd, productToAdd.qty);
    alert('Producto añadido al carrito');
  }
}


import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { AuthService } from '../../core/services/auth.service';
import { ProductsService } from '../../core/services/products.service';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';

import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.scss'],
})
export class ProductosComponent implements OnInit {
  categories = ['Todos', 'Suplementos', 'Rendimiento', 'Recuperación', 'Ropa', 'Accesorios', 'Energía'];
  selectedCategory = 'Todos';
  searchQuery = '';

  productos: any[] = [];

  constructor(
    private cartService: CartService,
    private wishlistService: WishlistService,
    private authService: AuthService,
    private productsService: ProductsService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) { }

  ngOnInit() {
    this.productsService.getProducts().subscribe({
      next: (data) => {
        this.ngZone.run(() => {
          // filter out inactive products, map properties
          this.productos = data.filter((p: any) => p.isActive !== false).map((p: any) => ({
            ...p,
            cat: p.category || 'Otros',
            qty: 1,
            rating: 4.5, // placeholder
            tag: p.stock === 0 ? 'Agotado' : ''
          }));
          this.cdr.detectChanges();
        });
      },
      error: (err) => this.ngZone.run(() => console.error('Error fetching public products', err))
    });

    // Suscribirse a la wishlist para actualizar la vista inmediatamente
    this.wishlistService.wishlist$.subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  getImageUrl(url: string | undefined): string {
    if (!url) return 'assets/placeholder.jpg';
    if (url.startsWith('http')) return url;
    return `${environment.apiUrl}${url.startsWith('/') ? url : '/' + url}`;
  }

  get filteredProductos() {
    return this.productos.filter(p => {
      const matchesCategory = this.selectedCategory === 'Todos' || p.cat === this.selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }

  setCategory(cat: string) {
    this.selectedCategory = cat;
  }

  increaseQty(producto: any) {
    if (producto.qty < producto.stock) {
      producto.qty++;
    } else {
      Swal.fire({
        toast: true,
        position: 'bottom-end',
        title: 'Stock máximo alcanzado',
        icon: 'info',
        timer: 2000,
        showConfirmButton: false,
        background: '#1e2024',
        color: '#ffffff'
      });
    }
  }

  decreaseQty(producto: any) {
    if (producto.qty > 1) {
      producto.qty--;
    }
  }

  addToCart(producto: any) {
    if (!this.authService.isAuthenticated()) {
      Swal.fire({
        title: 'Inicio de sesión requerido',
        text: 'Para agregar productos al carrito, debes acceder a tu cuenta.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#22c55e',
        cancelButtonColor: '#ef4444',
        confirmButtonText: 'Iniciar sesión',
        cancelButtonText: 'Cancelar',
        background: '#1e2024',
        color: '#ffffff'
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/login']);
        }
      });
      return;
    }
    if (producto.tag === 'Agotado') return;
    
    const result = this.cartService.addToCart(producto, producto.qty);
    
    if (!result.success) {
      Swal.fire({
        toast: true,
        position: 'bottom-end',
        title: result.message,
        icon: 'warning',
        timer: 3000,
        showConfirmButton: false,
        background: '#1e2024',
        color: '#ffffff'
      });
      return;
    }

    producto.added = true;

    Swal.fire({
      toast: true,
      position: 'bottom-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      icon: 'success',
      title: 'Agregado al carrito',
      background: '#22c55e',
      color: '#ffffff',
      iconColor: '#ffffff'
    });

    setTimeout(() => {
      producto.added = false;
      producto.qty = 1;
    }, 1200);
  }

  isInWishlist(productId: number): boolean {
    return this.wishlistService.isInWishlist(productId);
  }

  toggleWishlist(producto: any) {
    if (!this.authService.isAuthenticated()) {
      Swal.fire({
        title: 'Inicio de sesión requerido',
        text: 'Para guardar productos en favoritos, debes acceder a tu cuenta.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#22c55e',
        cancelButtonColor: '#ef4444',
        confirmButtonText: 'Iniciar sesión',
        cancelButtonText: 'Cancelar',
        background: '#1e2024',
        color: '#ffffff'
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/login']);
        }
      });
      return;
    }
    
    // Optimistic UI update can be done here, but WishlistService loads it anyway
    this.wishlistService.toggleWishlist(producto.id).subscribe({
      next: () => console.log('Wishlist toggled for', producto.name),
      error: (err) => {
        console.error('Error toggling wishlist', err);
        // Fallback: Si el backend falla por la FK (porque no hay productos en la BD), guardamos en un wishlist falso
        // Solo para que no falle en desarrollo.
      }
    });
  }
}



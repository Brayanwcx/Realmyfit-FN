import { Component, OnInit, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { AuthService } from '../../core/services/auth.service';
import { ProductsService } from '../../core/services/products.service';
import { CategoriesService } from '../../core/services/categories.service';
import { environment } from '../../../environments/environment';
import Swal from '../../core/utils/app-swal';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.scss'],
})
export class ProductosComponent implements OnInit {
  categories: string[] = ['Todos'];
  selectedCategory = 'Todos';
  searchQuery = '';

  productos: any[] = [];
  destroyRef = inject(DestroyRef);

  constructor(
    private cartService: CartService,
    private wishlistService: WishlistService,
    private authService: AuthService,
    private productsService: ProductsService,
    private categoriesService: CategoriesService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.categoriesService.getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          // Extraemos solo los nombres y preservamos 'Todos' al inicio
          this.categories = ['Todos', ...data.map((c: any) => c.name)];
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error fetching public categories', err)
      });

    this.productsService.getProducts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          // filter out inactive products, map properties
          this.productos = data.filter((p: any) => p.isActive !== false).map((p: any) => ({
            ...p,
            cat: p.category || 'Otros',
            qty: 1,
            rating: 4.5, // placeholder
            tag: p.stock === 0 ? 'Agotado' : ''
          }));
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error fetching public products', err)
      });

    // Suscribirse a la wishlist para actualizar la vista inmediatamente
    this.wishlistService.wishlist$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        // En componentes sin OnPush, Angular detectará el cambio automáticamente 
        // a menos que el servicio emita fuera de la 'Angular Zone'.
        // Mantenemos cdr.detectChanges() solo de precaución si el servicio es asíncrono externo.
        this.cdr.detectChanges();
      });
  }

  getImageUrl(url: string | undefined): string {
    if (!url) return 'assets/placeholder.jpg';
    if (url.startsWith('http')) return url;
    return `${environment.apiUrl}${url.startsWith('/') ? url : '/' + url}`;
  }

  formatCurrency(value: number): string {
    return '$ ' + new Intl.NumberFormat('es-CO').format(value);
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
        color: '#ffffff',
        scrollbarPadding: false
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
        color: '#ffffff',
        scrollbarPadding: false
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
      iconColor: '#ffffff',
      scrollbarPadding: false
    });

    setTimeout(() => {
      producto.added = false;
      producto.qty = 1;
      this.cdr.detectChanges(); // Force update: setTimeout runs outside Angular's zone
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
    this.wishlistService.toggleWishlist(producto.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => console.log('Wishlist toggled for', producto.name),
      error: (err) => {
        console.error('Error toggling wishlist', err);
        // Fallback: Si el backend falla por la FK (porque no hay productos en la BD), guardamos en un wishlist falso
        // Solo para que no falle en desarrollo.
      }
    });
  }
}



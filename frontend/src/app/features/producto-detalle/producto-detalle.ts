import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { AuthService } from '../../core/services/auth.service';
import { ProductsService } from '../../core/services/products.service';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-producto-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './producto-detalle.html',
  styleUrls: ['./producto-detalle.scss']
})
export class ProductoDetalleComponent implements OnInit {
  producto: any;
  qty: number = 1;
  added: boolean = false;
  selectedSize: string = '';
  
  // Dynamic data
  productosMock: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private cartService: CartService,
    private wishlistService: WishlistService,
    public authService: AuthService,
    private productsService: ProductsService,
    private location: Location,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      if (id) {
        this.productsService.getProduct(id).subscribe({
          next: (data) => {
            this.ngZone.run(() => {
              this.producto = {
                ...data,
                cat: data.category || 'Otros',
                rating: 4.5, // placeholder
                reviews: 120, // placeholder
                tag: data.stock === 0 ? 'Agotado' : '',
                ingredients: data.ingredients || [],
                sizes: data.sizes || ['Único']
              };
              if (this.producto && this.producto.sizes && this.producto.sizes.length > 0) {
                this.selectedSize = this.producto.sizes[0];
              }
              this.cdr.detectChanges();
            });
          },
          error: (err) => this.ngZone.run(() => console.error('Error fetching product details', err))
        });
      }
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

  formatCurrency(value: number): string {
    return '$ ' + new Intl.NumberFormat('es-CO').format(value);
  }

  goBack() {
    this.location.back();
  }

  increaseQty() {
    if (!this.producto) return;
    if (this.qty < this.producto.stock) {
      this.qty++;
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

  decreaseQty() {
    if (this.qty > 1) this.qty--;
  }

  selectSize(size: string) {
    this.selectedSize = size;
  }

  addToCart() {
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
    if (!this.producto || this.producto.tag === 'Agotado') return;
    // We pass a clone with the selected size
    const cartItem = { ...this.producto, selectedSize: this.selectedSize };
    const result = this.cartService.addToCart(cartItem, this.qty);
    
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

    this.added = true;
    
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
      this.added = false;
      this.qty = 1; // Reset qty after adding
      this.cdr.detectChanges(); // Force update: setTimeout runs outside Angular's zone
    }, 1500);
  }

  isInWishlist(): boolean {
    if (!this.producto) return false;
    return this.wishlistService.isInWishlist(this.producto.id);
  }

  toggleWishlist() {
    if (!this.producto) return;
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
    this.wishlistService.toggleWishlist(this.producto.id).subscribe();
  }
}

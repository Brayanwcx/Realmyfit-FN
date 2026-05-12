import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.scss'],
})
export class ProductosComponent {
  categories = ['Todos', 'Suplementos', 'Rendimiento', 'Recuperación', 'Ropa', 'Accesorios', 'Energía'];
  selectedCategory = 'Todos';
  searchQuery = '';

  productos: any[] = [
    { id: 1, name: '100% Whey Protein', cat: 'Suplementos', price: 59.99, tag: 'Más Vendido', qty: 1, rating: 4.8 },
    { id: 2, name: 'Creatina Monohidratada', cat: 'Rendimiento', price: 24.99, tag: '', qty: 1, rating: 4.6 },
    { id: 3, name: 'BCAAs Energy', cat: 'Recuperación', price: 34.50, tag: '', qty: 1, rating: 4.5 },
    { id: 4, name: 'Camiseta RealMyFit', cat: 'Ropa', price: 19.99, tag: 'Nuevo', qty: 1, rating: 4.9 },
    { id: 5, name: 'Shaker Pro', cat: 'Accesorios', price: 9.99, tag: '', qty: 1, rating: 4.3 },
    { id: 6, name: 'Pre-Workout Explosive', cat: 'Energía', price: 39.90, tag: 'Agotado', qty: 1, rating: 4.7 }
  ];

  constructor(
    private cartService: CartService,
    private wishlistService: WishlistService,
    private authService: AuthService
  ) { }

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
    if (producto.qty < 99) {
      producto.qty++;
    }
  }

  decreaseQty(producto: any) {
    if (producto.qty > 1) {
      producto.qty--;
    }
  }

  addToCart(producto: any) {
    if (producto.tag === 'Agotado') return;
    this.cartService.addToCart(producto, producto.qty);
    producto.added = true;
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
      alert('Debes iniciar sesión para guardar productos en tu lista de deseos.');
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



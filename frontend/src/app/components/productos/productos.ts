import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.scss'],
})
export class ProductosComponent {
  categories = ['Todos', 'Suplementos', 'Rendimiento', 'Recuperación', 'Ropa', 'Accesorios', 'Energía'];
  selectedCategory = 'Todos';

  productos: any[] = [
    { name: '100% Whey Protein', cat: 'Suplementos', price: 59.99, tag: 'Más Vendido', qty: 1, rating: 4.8 },
    { name: 'Creatina Monohidratada', cat: 'Rendimiento', price: 24.99, tag: '', qty: 1, rating: 4.6 },
    { name: 'BCAAs Energy', cat: 'Recuperación', price: 34.50, tag: '', qty: 1, rating: 4.5 },
    { name: 'Camiseta RealMyFit', cat: 'Ropa', price: 19.99, tag: 'Nuevo', qty: 1, rating: 4.9 },
    { name: 'Shaker Pro', cat: 'Accesorios', price: 9.99, tag: '', qty: 1, rating: 4.3 },
    { name: 'Pre-Workout Explosive', cat: 'Energía', price: 39.90, tag: 'Agotado', qty: 1, rating: 4.7 }
  ];

  constructor(private cartService: CartService) { }

  get filteredProductos() {
    if (this.selectedCategory === 'Todos') {
      return this.productos;
    }
    return this.productos.filter(p => p.cat === this.selectedCategory);
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
}

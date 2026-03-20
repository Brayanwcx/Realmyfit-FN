import { Component } from '@angular/core';

@Component({
  selector: 'app-productos',
  imports: [],
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.scss'],
})
export class ProductosComponent {
  productos = [
    { name: '100% Whey Protein', cat: 'Suplementos', price: 59.99, tag: 'Más Vendido' },
    { name: 'Creatina Monohidratada', cat: 'Rendimiento', price: 24.99, tag: '' },
    { name: 'BCAAs Energy', cat: 'Recuperación', price: 34.50, tag: '' },
    { name: 'Camiseta RealMyFit', cat: 'Ropa', price: 19.99, tag: 'Nuevo' },
    { name: 'Shaker Pro', cat: 'Accesorios', price: 9.99, tag: '' },
    { name: 'Pre-Workout Explosive', cat: 'Energía', price: 39.90, tag: 'Agotado' }
  ];
}

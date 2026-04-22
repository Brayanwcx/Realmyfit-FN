import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductsService } from '../../services/products.service';
import { environment } from '../../../environments/environment';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="view-header">
      <h2>Gestión de Productos</h2>
      <button class="btn-primary" (click)="openModal()">Añadir Producto</button>
    </div>
    
    <div class="table-container glass">
      @if (loading) {
        <div class="loading-state">Cargando productos...</div>
      }

      @if (errorMessage) {
        <div class="error-state">
          <p>Error: {{ errorMessage }}</p>
          <button class="btn-primary" (click)="fetchProducts()">Reintentar</button>
        </div>
      }
      
      @if (!loading && !errorMessage && products.length > 0) {
        <!-- Vista Desktop -->
        <table class="desktop-table">
          <thead>
            <tr>
              <th>Imagen</th>
              <th>Producto</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (product of products; track product.id) {
              <tr>
                <td>
                  <div class="product-thumb glass" [style.backgroundImage]="'url(' + getImageUrl(product.imageUrl) + ')'"></div>
                </td>
                <td>
                  <div class="product-name">{{ product.name }}</div>
                  <div class="product-desc">{{ product.description | slice:0:30 }}...</div>
                </td>
                <td>\${{ product.price }}</td>
                <td>{{ product.stock }}</td>
                <td>
                  <button class="btn-icon" (click)="editProduct(product)">Editar</button>
                  <button class="btn-icon delete" (click)="deleteProduct(product.id)">Eliminar</button>
                </td>
              </tr>
            }
          </tbody>
        </table>

        <!-- Vista Mobile -->
        <div class="mobile-cards">
          @for (product of products; track product.id) {
            <div class="mobile-card glass">
              <div class="card-row">
                <span class="card-label">Imagen</span>
                <div class="product-thumb glass" [style.backgroundImage]="'url(' + getImageUrl(product.imageUrl) + ')'"></div>
              </div>
              <div class="card-row">
                <span class="card-label">Producto</span>
                <div class="card-value">{{ product.name }}</div>
              </div>
              <div class="card-row">
                <span class="card-label">Precio</span>
                <div class="card-value">\${{ product.price }}</div>
              </div>
              <div class="card-row">
                <span class="card-label">Stock</span>
                <div class="card-value">{{ product.stock }}</div>
              </div>
              <div class="card-actions">
                <button class="btn-icon" (click)="editProduct(product)">Editar</button>
                <button class="btn-icon delete" (click)="deleteProduct(product.id)">Eliminar</button>
              </div>
            </div>
          }
        </div>
      }

      @if (!loading && !errorMessage && products.length === 0) {
        <div class="empty-state">
          No se encontraron productos.
        </div>
      }
    </div>

    <!-- Add Product Modal -->
    @if (showModal) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal-content glass" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ isEditing ? 'Editar Producto' : 'Nuevo Producto' }}</h3>
            <button class="btn-close" (click)="closeModal()">&times;</button>
          </div>
          
          <form (ngSubmit)="submitProduct()" #productForm="ngForm" class="product-form">
            <div class="form-group">
              <label>Nombre del Producto</label>
              <input type="text" name="name" [(ngModel)]="newProduct.name" required placeholder="Ej. Proteína Whey" class="glass-input">
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Precio ($)</label>
                <input type="number" name="price" [(ngModel)]="newProduct.price" required placeholder="0.00" class="glass-input">
              </div>
              <div class="form-group">
                <label>Stock</label>
                <input type="number" name="stock" [(ngModel)]="newProduct.stock" required placeholder="0" class="glass-input">
              </div>
            </div>
  
            <div class="form-group">
              <label>Imagen del Producto</label>
              <div class="file-upload-wrapper glass-input">
                <input type="file" (change)="onFileSelected($event)" accept="image/*" class="file-input" id="fileInput">
                <label for="fileInput" class="file-label">
                  @if (!selectedFile) {
                    <span>📁 Seleccionar imagen...</span>
                  } @else {
                    <span>📄 {{ selectedFile.name }}</span>
                  }
                </label>
              </div>
              <!-- Image Preview -->
              @if (imagePreview) {
                <div class="image-preview-container mt-2">
                  <img [src]="imagePreview" class="image-preview glass">
                  <button type="button" class="btn-remove-image" (click)="removeImage()">&times;</button>
                </div>
              }
            </div>
  
            <div class="form-group">
              <label>Descripción</label>
              <textarea name="description" [(ngModel)]="newProduct.description" required placeholder="Describe el producto..." class="glass-input"></textarea>
            </div>
  
            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="closeModal()">Cancelar</button>
              <button type="submit" class="btn-primary" [disabled]="!productForm.valid || isSubmitting">
                {{ isSubmitting ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Producto') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .table-container { padding: 1rem; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { padding: 1rem; color: rgba(255,255,255,0.6); font-weight: 500; border-bottom: 1px solid rgba(255,255,255,0.1); }
    td { padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .loading-state, .empty-state, .error-state { padding: 3rem; text-align: center; color: rgba(255,255,255,0.5); }
    .error-state { color: #ff4d4d; }
    .product-thumb { width: 40px; height: 40px; border-radius: 8px; background-size: cover; background-position: center; border: 1px solid rgba(255,255,255,0.1); }
    .product-name { font-weight: 600; }
    .product-desc { font-size: 0.75rem; color: rgba(255,255,255,0.5); }
    .btn-icon { background: none; border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 0.4rem 0.8rem; border-radius: 8px; cursor: pointer; margin-right: 0.5rem; transition: 0.3s; font-size: 0.75rem; }
    .btn-icon:hover { background: rgba(255,255,255,0.05); }
    .btn-icon.delete:hover { border-color: #ff4d4d; color: #ff4d4d; }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(4px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      padding: 1rem;
    }

    .modal-content {
      width: 100%;
      max-width: 500px;
      padding: 2rem;
      position: relative;
      max-height: 90vh;
      overflow-y: auto;
      box-sizing: border-box;
    }

    .modal-header {
      display: flex;
      justify-content: space-between; align-items: center;
      margin-bottom: 1.5rem;
      h3 { margin: 0; font-size: 1.5rem; }
    }

    .btn-close { background: none; border: none; color: #fff; font-size: 1.5rem; cursor: pointer; }

    /* Form Styles */
    .product-form { display: flex; flex-direction: column; gap: 1.25rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; label { font-size: 0.85rem; color: rgba(255,255,255,0.6); } }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .glass-input { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 0.75rem; color: #fff; font-family: inherit; outline: none; transition: 0.3s; box-sizing: border-box; width: 100%; &:focus { border-color: var(--color-primary, #27ae60); background: rgba(255,255,255,0.08); } }
    textarea.glass-input { min-height: 100px; resize: vertical; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; }
    .btn-secondary { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; transition: 0.3s; &:hover { background: rgba(255,255,255,0.1); } }
    .file-upload-wrapper { position: relative; padding: 0; overflow: hidden; cursor: pointer; }
    .file-input { position: absolute; width: 100%; height: 100%; opacity: 0; cursor: pointer; z-index: 2; }
    .file-label { display: block; padding: 0.75rem; font-size: 0.85rem; color: rgba(255,255,255,0.6); cursor: pointer; }
    .image-preview-container { position: relative; width: 100%; max-height: 200px; border-radius: 8px; overflow: hidden; }
    .image-preview { width: 100%; height: auto; max-height: 200px; object-fit: cover; display: block; }
    .btn-remove-image { position: absolute; top: 5px; right: 5px; background: rgba(255, 77, 77, 0.8); border: none; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; cursor: pointer; z-index: 3; }
    .mt-2 { margin-top: 0.5rem; }

    .mobile-cards { display: none; }

    /* Mobile Responsive Table and Header */
    @media (max-width: 768px) {
      .view-header { flex-direction: column; align-items: stretch; gap: 1rem; }
      .view-header button { width: 100%; }
      
      .desktop-table { display: none; }
      
      .mobile-cards {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }
      
      .mobile-card {
        padding: 1rem;
        background: rgba(255,255,255,0.02);
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,0.05);
      }
      
      .card-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 0;
        border-bottom: 1px solid rgba(255,255,255,0.05);
      }
      
      .card-label {
        font-weight: 500;
        color: rgba(255,255,255,0.6);
      }
      
      .card-value {
        color: white;
        text-align: right;
        font-weight: 500;
      }
      
      .card-actions {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-top: 1rem;
      }
      
      .card-actions .btn-icon {
        width: 100%;
        margin: 0;
        text-align: center;
        padding: 0.75rem;
      }
    }
  `]
})
export class AdminProductsComponent implements OnInit {
  private productsService = inject(ProductsService);
  private cdr = inject(ChangeDetectorRef);
  
  products: any[] = [];
  loading = true;
  errorMessage = '';
  
  showModal = false;
  isSubmitting = false;
  isEditing = false;
  editingProductId: number | null = null;
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  
  newProduct = {
    name: '',
    description: '',
    price: 0,
    stock: 0,
    imageUrl: ''
  };

  ngOnInit() {
    this.fetchProducts();
  }

  getImageUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${environment.apiUrl}${url}`;
  }

  fetchProducts() {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.productsService.getProducts()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (data) => {
          this.products = data;
          console.log('Productos cargados:', this.products);
        },
        error: (err) => {
          console.error('Error fetching products:', err);
          this.errorMessage = err.status === 401 ? 'No autorizado.' : 'Error de conexión';
        }
      });
  }

  openModal() {
    this.showModal = true;
    this.isEditing = false;
    this.editingProductId = null;
    this.newProduct = { name: '', description: '', price: 0, stock: 0, imageUrl: '' };
    this.selectedFile = null;
    this.imagePreview = null;
  }

  editProduct(product: any) {
    this.showModal = true;
    this.isEditing = true;
    this.editingProductId = product.id;
    this.newProduct = { 
      name: product.name, 
      description: product.description, 
      price: product.price, 
      stock: product.stock, 
      imageUrl: product.imageUrl 
    };
    this.imagePreview = this.getImageUrl(product.imageUrl);
    this.selectedFile = null;
  }

  closeModal() {
    this.showModal = false;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.selectedFile = null;
    this.imagePreview = null;
    const input = document.getElementById('fileInput') as HTMLInputElement;
    if (input) input.value = '';
  }

  submitProduct() {
    if (!this.selectedFile && !this.isEditing) {
        alert('Por favor selecciona una imagen');
        return;
    }

    this.isSubmitting = true;
    
    if (this.selectedFile) {
        this.productsService.uploadImage(this.selectedFile).subscribe({
          next: (uploadRes) => {
            this.newProduct.imageUrl = uploadRes.url;
            this.saveProductData();
          },
          error: (err) => {
            console.error('Error uploading image', err);
            alert('Error al subir la imagen');
            this.isSubmitting = false;
          }
        });
    } else {
        this.saveProductData();
    }
  }

  private saveProductData() {
    const dataToSave = {
        ...this.newProduct,
        price: Number(this.newProduct.price),
        stock: Number(this.newProduct.stock)
    };

    if (this.isEditing && this.editingProductId) {
        this.productsService.updateProduct(this.editingProductId, dataToSave).subscribe({
            next: () => this.onSaveSuccess(),
            error: (err) => this.onSaveError(err)
        });
    } else {
        this.productsService.createProduct(dataToSave).subscribe({
            next: () => this.onSaveSuccess(),
            error: (err) => this.onSaveError(err)
        });
    }
  }

  private onSaveSuccess() {
    this.isSubmitting = false;
    this.closeModal();
    this.fetchProducts();
  }

  private onSaveError(err: any) {
    console.error('Error saving product', err);
    alert('Error al guardar el producto');
    this.isSubmitting = false;
  }

  deleteProduct(id: number) {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      this.productsService.deleteProduct(id).subscribe({
        next: () => this.fetchProducts(),
        error: (err) => console.error('Error deleting product', err)
      });
    }
  }
}

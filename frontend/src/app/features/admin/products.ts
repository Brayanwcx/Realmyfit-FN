import { Component, OnInit, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductsService } from '../../core/services/products.service';
import { environment } from '../../../environments/environment';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="view-header">
      <h2>Gestión de Productos</h2>
      <button class="btn-primary" (click)="openModal()">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        Añadir Producto
      </button>
    </div>
    
    <div class="table-container glass">
      @if (loading) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando productos...</p>
        </div>
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
              <th width="80px">Imagen</th>
              <th>Información del Producto</th>
              <th width="120px">Categoría</th>
              <th width="100px">Precio</th>
              <th width="100px">Stock</th>
              <th width="100px">Estado</th>
              <th width="180px">Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (product of pagedProducts; track product.id) {
              <tr>
                <td>
                  <div class="product-thumb glass" [style.backgroundImage]="'url(' + getImageUrl(product.imageUrl) + ')'"></div>
                </td>
                <td>
                  <div class="product-name">{{ product.name }}</div>
                  <div class="product-desc" title="{{ product.description }}">{{ product.description | slice:0:40 }}{{ product.description.length > 40 ? '...' : '' }}</div>
                </td>
                <td><span class="badge category-badge">{{ product.category || 'N/A' }}</span></td>
                <td class="font-bold">\${{ product.price }}</td>
                <td>
                  <span class="badge" [class.badge-low]="product.stock <= 5" [class.badge-good]="product.stock > 5">{{ product.stock }}</span>
                </td>
                <td>
                  <span class="badge" [class.badge-active]="product.isActive" [class.badge-inactive]="!product.isActive">
                    {{ product.isActive ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td>
                  <div class="actions-cell">
                    <button class="btn-icon" (click)="editProduct(product)" title="Editar">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      Editar
                    </button>
                    <button class="btn-icon delete" (click)="deleteProduct(product.id)" title="Eliminar">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>

        <!-- Vista Mobile -->
        <div class="mobile-cards">
          @for (product of pagedProducts; track product.id) {
            <div class="mobile-card glass">
              <div class="card-header">
                <div class="product-thumb glass" [style.backgroundImage]="'url(' + getImageUrl(product.imageUrl) + ')'"></div>
                <div class="card-title">
                  <h4>{{ product.name }}</h4>
                  <span class="badge category-badge">{{ product.category || 'N/A' }}</span>
                </div>
              </div>
              <div class="card-row">
                <span class="card-label">Precio</span>
                <div class="card-value font-bold">\${{ product.price }}</div>
              </div>
              <div class="card-row">
                <span class="card-label">Stock</span>
                <div class="card-value">
                  <span class="badge" [class.badge-low]="product.stock <= 5" [class.badge-good]="product.stock > 5">{{ product.stock }}</span>
                </div>
              </div>
              <div class="card-row">
                <span class="card-label">Estado</span>
                <div class="card-value">
                  <span class="badge" [class.badge-active]="product.isActive" [class.badge-inactive]="!product.isActive">
                    {{ product.isActive ? 'Activo' : 'Inactivo' }}
                  </span>
                </div>
              </div>
              <div class="card-actions">
                <button class="btn-icon" (click)="editProduct(product)">Editar</button>
                <button class="btn-icon delete" (click)="deleteProduct(product.id)">Eliminar</button>
              </div>
            </div>
          }
        </div>

        <!-- Paginación -->
        @if (totalPages > 1) {
          <div class="pagination">
            <button class="page-btn" (click)="page = 1" [disabled]="page === 1">«</button>
            <button class="page-btn" (click)="page = page - 1" [disabled]="page === 1">‹</button>
            @for (p of pageNumbers; track p) {
              <button class="page-btn" [class.active]="p === page" (click)="page = p">{{ p }}</button>
            }
            <button class="page-btn" (click)="page = page + 1" [disabled]="page === totalPages">›</button>
            <button class="page-btn" (click)="page = totalPages" [disabled]="page === totalPages">»</button>
            <span class="page-info">{{ (page-1)*pageSize+1 }}–{{ min(page*pageSize, products.length) }} de {{ products.length }}</span>
          </div>
        }
      }

      @if (!loading && !errorMessage && products.length === 0) {
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          <p>No se encontraron productos. Crea el primero.</p>
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
            <div class="form-grid">
              
              <!-- Left Column: Details -->
              <div class="form-column">
                <div class="form-group">
                  <label>Nombre del Producto *</label>
                  <input type="text" name="name" [(ngModel)]="newProduct.name" required placeholder="Ej. Proteína Whey 5lbs" class="glass-input">
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label>Categoría</label>
                    <select name="category" [(ngModel)]="newProduct.category" class="glass-input">
                      <option value="">Seleccionar...</option>
                      <option value="Suplementos">Suplementos</option>
                      <option value="Rendimiento">Rendimiento</option>
                      <option value="Recuperación">Recuperación</option>
                      <option value="Ropa">Ropa</option>
                      <option value="Accesorios">Accesorios</option>
                      <option value="Energía">Energía</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Estado</label>
                    <div class="toggle-switch">
                      <input type="checkbox" id="isActive" name="isActive" [(ngModel)]="newProduct.isActive">
                      <label for="isActive">Activo (Visible en tienda)</label>
                    </div>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>Precio ($) *</label>
                    <input type="number" name="price" [(ngModel)]="newProduct.price" required min="0" step="0.01" placeholder="0.00" class="glass-input">
                  </div>
                  <div class="form-group">
                    <label>Stock Inicial *</label>
                    <input type="number" name="stock" [(ngModel)]="newProduct.stock" required min="0" placeholder="0" class="glass-input">
                  </div>
                </div>
                
                <div class="form-group">
                  <label>Descripción detallada *</label>
                  <textarea name="description" [(ngModel)]="newProduct.description" required placeholder="Describe las características y beneficios del producto..." class="glass-input" rows="4"></textarea>
                </div>
              </div>

              <!-- Right Column: Image -->
              <div class="form-column">
                <div class="form-group h-100">
                  <label>Imagen del Producto</label>
                  <div class="image-upload-area glass-input" [class.has-image]="imagePreview">
                    @if (imagePreview) {
                      <img [src]="imagePreview" class="image-preview" alt="Preview">
                      <button type="button" class="btn-remove-image" (click)="removeImage()" title="Eliminar imagen">&times;</button>
                    } @else {
                      <input type="file" (change)="onFileSelected($event)" accept="image/*" class="file-input" id="fileInput">
                      <label for="fileInput" class="upload-prompt">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="mb-2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                        <span>Haz clic para subir imagen</span>
                        <small>PNG, JPG o WEBP (Max. 5MB)</small>
                      </label>
                    }
                  </div>
                </div>
              </div>
              
            </div>
  
            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="closeModal()">Cancelar</button>
              <button type="submit" class="btn-primary" [disabled]="!productForm.valid || isSubmitting">
                @if(isSubmitting) {
                  <span class="spinner-small"></span> Guardando...
                } @else {
                  {{ isEditing ? 'Guardar Cambios' : 'Crear Producto' }}
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .view-header h2 { font-size: 1.8rem; margin: 0; font-weight: 700; background: linear-gradient(to right, #fff, rgba(255,255,255,0.7)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    
    .btn-primary { display: inline-flex; align-items: center; justify-content: center; background: var(--color-primary, #22c55e); color: #000; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; border: none; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3); }
    .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(34, 197, 94, 0.4); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }
    
    .table-container { padding: 1.5rem; overflow-x: auto; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); }
    .desktop-table { width: 100%; min-width: 800px; border-collapse: separate; border-spacing: 0; text-align: left; }
    .desktop-table th { padding: 1rem; color: rgba(255,255,255,0.6); font-weight: 600; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .desktop-table td { padding: 1.2rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); vertical-align: middle; }
    
    .loading-state, .empty-state, .error-state { padding: 4rem 2rem; text-align: center; color: rgba(255,255,255,0.5); display: flex; flex-direction: column; align-items: center; gap: 1rem; }
    .empty-state svg { color: rgba(255,255,255,0.2); }
    .error-state { color: #ff4d4d; }
    
    .product-thumb { width: 48px; height: 48px; border-radius: 12px; background-size: cover; background-position: center; border: 1px solid rgba(255,255,255,0.1); flex-shrink: 0; }
    .product-name { font-weight: 600; font-size: 1.05rem; color: #fff; margin-bottom: 0.25rem; }
    .product-desc { font-size: 0.85rem; color: rgba(255,255,255,0.5); line-height: 1.4; }
    .font-bold { font-weight: 700; color: #fff; }
    
    .badge { padding: 0.35rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.5px; display: inline-block; }
    .category-badge { background: rgba(255,255,255,0.1); color: #fff; }
    .badge-active, .badge-good { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); }
    .badge-inactive, .badge-low { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
    
    .actions-cell { display: flex; gap: 0.5rem; }
    .btn-icon { display: inline-flex; align-items: center; gap: 0.4rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 0.5rem 0.8rem; border-radius: 8px; cursor: pointer; transition: 0.3s; font-size: 0.8rem; font-weight: 500; }
    .btn-icon:hover { background: rgba(255,255,255,0.1); }
    .btn-icon.delete:hover { background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3); color: #f87171; }

    /* Modal Styles */
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); display: flex; justify-content: center; align-items: center; z-index: 1000; padding: 1rem; }
    .modal-content { width: 100%; max-width: 850px; padding: 2.5rem; position: relative; max-height: 95vh; overflow-y: auto; box-sizing: border-box; border-radius: 24px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 1rem; }
    .modal-header h3 { margin: 0; font-size: 1.5rem; font-weight: 700; }
    .btn-close { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 1.2rem; cursor: pointer; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
    .btn-close:hover { background: rgba(255,255,255,0.1); transform: scale(1.05); }

    /* Form Styles */
    .product-form { display: flex; flex-direction: column; gap: 1.5rem; }
    .form-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 2rem; }
    .form-column { display: flex; flex-direction: column; gap: 1.25rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.6rem; }
    .form-group label { font-size: 0.9rem; font-weight: 500; color: rgba(255,255,255,0.8); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    
    .glass-input { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 0.85rem 1rem; color: #fff; font-family: inherit; font-size: 0.95rem; outline: none; transition: 0.3s; box-sizing: border-box; width: 100%; }
    .glass-input:focus { border-color: var(--color-primary, #22c55e); background: rgba(255,255,255,0.06); box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.1); }
    select.glass-input { appearance: none; background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E"); background-repeat: no-repeat; background-position: right 1rem top 50%; background-size: 0.65rem auto; padding-right: 2.5rem; }
    select.glass-input option { background: #1a1c20; color: #fff; }
    
    .toggle-switch { display: flex; align-items: center; gap: 0.75rem; height: 100%; padding: 0.5rem 0; }
    .toggle-switch input[type="checkbox"] { width: 44px; height: 24px; appearance: none; background: rgba(255,255,255,0.1); border-radius: 12px; position: relative; cursor: pointer; outline: none; transition: 0.3s; }
    .toggle-switch input[type="checkbox"]::after { content: ''; position: absolute; top: 2px; left: 2px; width: 20px; height: 20px; background: #fff; border-radius: 50%; transition: 0.3s; }
    .toggle-switch input[type="checkbox"]:checked { background: var(--color-primary, #22c55e); }
    .toggle-switch input[type="checkbox"]:checked::after { transform: translateX(20px); }
    .toggle-switch label { font-size: 0.9rem; color: rgba(255,255,255,0.8); cursor: pointer; }

    .h-100 { height: 100%; }
    .image-upload-area { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; min-height: 250px; position: relative; overflow: hidden; padding: 0; border: 2px dashed rgba(255,255,255,0.15); border-radius: 16px; background: rgba(255,255,255,0.02); transition: 0.3s; }
    .image-upload-area:hover { border-color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.05); }
    .image-upload-area.has-image { border-style: solid; border-color: rgba(255,255,255,0.1); }
    .file-input { position: absolute; width: 100%; height: 100%; opacity: 0; cursor: pointer; z-index: 2; }
    .upload-prompt { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; color: rgba(255,255,255,0.5); pointer-events: none; }
    .upload-prompt span { font-weight: 500; color: rgba(255,255,255,0.8); }
    .upload-prompt small { font-size: 0.75rem; }
    
    .image-preview { width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0; z-index: 1; }
    .btn-remove-image { position: absolute; top: 1rem; right: 1rem; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.2); color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; justify-content: center; align-items: center; cursor: pointer; z-index: 3; font-size: 1.2rem; transition: 0.2s; }
    .btn-remove-image:hover { background: rgba(239, 68, 68, 0.8); transform: scale(1.1); }
    
    .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.05); }
    .btn-secondary { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 500; transition: 0.3s; }
    .btn-secondary:hover { background: rgba(255,255,255,0.1); }
    
    .spinner { width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.1); border-top-color: var(--color-primary, #22c55e); border-radius: 50%; animation: spin 1s linear infinite; }
    .spinner-small { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(0,0,0,0.1); border-top-color: #000; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 0.5rem; vertical-align: middle; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .pagination { display: flex; align-items: center; gap: 0.4rem; justify-content: center; padding: 1.5rem 0 0.5rem; flex-wrap: wrap; }
    .page-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; width: 36px; height: 36px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; transition: 0.2s; display: inline-flex; align-items: center; justify-content: center; }
    .page-btn:hover:not(:disabled) { background: rgba(255,255,255,0.12); }
    .page-btn.active { background: var(--color-primary, #22c55e); color: #000; font-weight: 700; border-color: transparent; }
    .page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
    .page-info { font-size: 0.8rem; color: rgba(255,255,255,0.45); margin-left: 0.5rem; }

    .mobile-cards { display: none; }

    /* Mobile Responsive */
    @media (max-width: 992px) {
      .form-grid { grid-template-columns: 1fr; gap: 1.5rem; }
      .image-upload-area { min-height: 200px; }
    }

    @media (max-width: 768px) {
      .view-header { flex-direction: column; align-items: stretch; gap: 1rem; }
      .view-header button { justify-content: center; }
      .form-row { grid-template-columns: 1fr; }
      .modal-content { padding: 1.5rem; }
      
      .desktop-table { display: none; }
      .mobile-cards { display: flex; flex-direction: column; gap: 1rem; }
      
      .mobile-card { padding: 1.25rem; background: rgba(255,255,255,0.02); border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); }
      .card-header { display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
      .card-title h4 { margin: 0 0 0.5rem 0; font-size: 1.1rem; }
      .card-row { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; }
      .card-label { font-size: 0.85rem; color: rgba(255,255,255,0.6); }
      .card-value { color: white; font-weight: 500; }
      .card-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.05); }
      .card-actions .btn-icon { justify-content: center; margin: 0; padding: 0.75rem; }
    }
  `]
})
export class AdminProductsComponent implements OnInit {
  private productsService = inject(ProductsService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  products: any[] = [];
  loading = true;
  errorMessage = '';
  page = 1;
  pageSize = 10;

  get totalPages() { return Math.ceil(this.products.length / this.pageSize); }
  get pagedProducts() { return this.products.slice((this.page-1)*this.pageSize, this.page*this.pageSize); }
  get pageNumbers() { return Array.from({length: this.totalPages}, (_, i) => i + 1); }
  min(a: number, b: number) { return Math.min(a, b); }

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
    category: '',
    isActive: true,
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
          this.ngZone.run(() => {
            this.products = data;
            this.page = 1;
            console.log('Productos cargados:', this.products);
            this.cdr.detectChanges();
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            console.error('Error fetching products:', err);
            this.errorMessage = err.status === 401 ? 'No autorizado.' : 'Error de conexión';
            this.cdr.detectChanges();
          });
        }
      });
  }

  openModal() {
    this.showModal = true;
    this.isEditing = false;
    this.editingProductId = null;
    this.newProduct = { name: '', description: '', price: 0, stock: 0, category: '', isActive: true, imageUrl: '' };
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
      category: product.category || '',
      isActive: product.isActive !== undefined ? product.isActive : true,
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
        this.ngZone.run(() => {
          this.imagePreview = reader.result as string;
          this.cdr.detectChanges();
        });
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.selectedFile = null;
    this.imagePreview = null;
    this.newProduct.imageUrl = '';
    const input = document.getElementById('fileInput') as HTMLInputElement;
    if (input) input.value = '';
  }

  submitProduct() {
    this.isSubmitting = true;

    if (this.selectedFile) {
      this.productsService.uploadImage(this.selectedFile).subscribe({
        next: (uploadRes) => {
          this.ngZone.run(() => {
            this.newProduct.imageUrl = uploadRes.url;
            this.saveProductData();
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            console.error('Error uploading image', err);
            const status = err?.status || 'Desconocido';
            Swal.fire('Error', `Error al subir la imagen (Código: ${status}). Por favor vuelve a iniciar sesión o verifica tu conexión.`, 'error');
            this.isSubmitting = false;
            this.cdr.detectChanges();
          });
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
        next: () => this.ngZone.run(() => this.onSaveSuccess()),
        error: (err) => this.ngZone.run(() => this.onSaveError(err))
      });
    } else {
      this.productsService.createProduct(dataToSave).subscribe({
        next: () => this.ngZone.run(() => this.onSaveSuccess()),
        error: (err) => this.ngZone.run(() => this.onSaveError(err))
      });
    }
  }

  private onSaveSuccess() {
    Swal.fire('¡Éxito!', 'Producto guardado correctamente', 'success').then(() => {
      this.closeModal();
      this.fetchProducts();
      this.isSubmitting = false;
      this.cdr.detectChanges();
    });
  }

  private onSaveError(err: any) {
    console.error('Error saving product', err);
    Swal.fire('Error', 'Error al guardar el producto', 'error');
    this.isSubmitting = false;
    this.cdr.detectChanges();
  }

  deleteProduct(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esto. Se eliminará el producto permanentemente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#22c55e',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.productsService.deleteProduct(id).subscribe({
          next: () => {
            Swal.fire('¡Eliminado!', 'El producto ha sido eliminado.', 'success');
            this.fetchProducts();
          },
          error: () => {
            Swal.fire('Error', 'No se pudo eliminar el producto.', 'error');
          }
        });
      }
    });
  }
}



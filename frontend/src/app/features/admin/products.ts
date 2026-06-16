import { Component, OnInit, inject, ChangeDetectorRef, NgZone, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductsService } from '../../core/services/products.service';
import { environment } from '../../../environments/environment';
import { finalize } from 'rxjs';
import Swal from '../../core/utils/app-swal';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products.html',
  styleUrls: ['./products.scss']})
export class AdminProductsComponent implements OnInit {
    destroyRef = inject(DestroyRef);
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
      }), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.products = data;
              this.page = 1;
              console.log('Productos cargados:', this.products);
              this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error fetching products:', err);
            this.errorMessage = err.status === 401 ? 'No autorizado.' : 'Error de conexión';
            this.cdr.detectChanges();
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
        this.imagePreview = reader.result as string;
          this.cdr.detectChanges();
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
      this.productsService.uploadImage(this.selectedFile).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (uploadRes) => {
          this.newProduct.imageUrl = uploadRes.url;
              this.saveProductData();
        },
        error: (err) => {
          console.error('Error uploading image', err);
            const status = err?.status || 'Desconocido';
            Swal.fire('Error', `Error al subir la imagen (Código: ${status}). Por favor vuelve a iniciar sesión o verifica tu conexión.`, 'error');
            this.isSubmitting = false;
            this.cdr.detectChanges();
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
      this.productsService.updateProduct(this.editingProductId, dataToSave).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => this.ngZone.run(() => this.onSaveSuccess()),
        error: (err) => this.ngZone.run(() => this.onSaveError(err))
      });
    } else {
      this.productsService.createProduct(dataToSave).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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
        this.productsService.deleteProduct(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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



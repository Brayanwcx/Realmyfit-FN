import { Component, OnInit, inject, ChangeDetectorRef, NgZone, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoriesService } from '../../../core/services/categories.service';
import { finalize } from 'rxjs';
import Swal from '../../../core/utils/app-swal';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']})
export class AdminCategoriesComponent implements OnInit {
    destroyRef = inject(DestroyRef);
  private categoriesService = inject(CategoriesService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  categories: any[] = [];
  loading = true;
  errorMessage = '';
  page = 1;
  pageSize = 10;

  get totalPages() { return Math.ceil(this.categories.length / this.pageSize); }
  get pagedCategories() { return this.categories.slice((this.page-1)*this.pageSize, this.page*this.pageSize); }
  get pageNumbers() { return Array.from({length: this.totalPages}, (_, i) => i + 1); }
  min(a: number, b: number) { return Math.min(a, b); }

  showModal = false;
  isSubmitting = false;
  isEditing = false;
  editingId: number | null = null;

  newCategory = {
    name: '',
    description: ''
  };

  ngOnInit() {
    this.fetchCategories();
  }

  fetchCategories() {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.categoriesService.getCategories()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.categories = data;
          this.page = 1;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errorMessage = err.status === 401 ? 'No autorizado.' : 'Error de conexión';
          this.cdr.detectChanges();
        }
      });
  }

  openModal() {
    this.showModal = true;
    this.isEditing = false;
    this.editingId = null;
    this.newCategory = { name: '', description: '' };
  }

  editCategory(cat: any) {
    this.showModal = true;
    this.isEditing = true;
    this.editingId = cat.id;
    this.newCategory = {
      name: cat.name,
      description: cat.description || ''
    };
  }

  closeModal() {
    this.showModal = false;
  }

  submitCategory() {
    this.isSubmitting = true;

    if (this.isEditing && this.editingId) {
      this.categoriesService.updateCategory(this.editingId, this.newCategory).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => this.ngZone.run(() => this.onSaveSuccess()),
        error: (err) => this.ngZone.run(() => this.onSaveError(err))
      });
    } else {
      this.categoriesService.createCategory(this.newCategory).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => this.ngZone.run(() => this.onSaveSuccess()),
        error: (err) => this.ngZone.run(() => this.onSaveError(err))
      });
    }
  }

  private onSaveSuccess() {
    Swal.fire('¡Éxito!', 'Categoría guardada correctamente', 'success').then(() => {
      this.closeModal();
      this.fetchCategories();
      this.isSubmitting = false;
      this.cdr.detectChanges();
    });
  }

  private onSaveError(err: any) {
    Swal.fire('Error', err.error?.message || 'Error al guardar la categoría', 'error');
    this.isSubmitting = false;
    this.cdr.detectChanges();
  }

  deleteCategory(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "Se eliminará la categoría de forma permanente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#22c55e',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.categoriesService.deleteCategory(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            Swal.fire('¡Eliminado!', 'La categoría ha sido eliminada.', 'success');
            this.fetchCategories();
          },
          error: (err) => {
            Swal.fire('Error', err?.error?.message || 'No se pudo eliminar la categoría.', 'error');
          }
        });
      }
    });
  }
}

import { Component, OnInit, inject, ChangeDetectorRef, NgZone, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../core/services/users.service';
import { finalize } from 'rxjs';
import Swal from '../../core/utils/app-swal';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrls: ['./users.scss']
})
export class AdminUsersComponent implements OnInit {
    destroyRef = inject(DestroyRef);
  private usersService = inject(UsersService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  public authService = inject(AuthService);
  isSuperAdmin = false;
  users: any[] = [];
  loading = true;
  errorMessage = '';
  page = 1;
  pageSize = 10;

  get totalPages() { return Math.ceil(this.users.length / this.pageSize); }
  get pagedUsers() { return this.users.slice((this.page-1)*this.pageSize, this.page*this.pageSize); }
  get pageNumbers() { return Array.from({length: this.totalPages}, (_, i) => i + 1); }
  min(a: number, b: number) { return Math.min(a, b); }
  
  showModal = false;
  isSubmitting = false;
  isEditing = false;
  editingId: number | null = null;
  
  newUser: any = {
    name: '',
    lastName: '',
    docType: '',
    docNumber: '',
    email: '',
    password: '',
    isActive: true,
    roleId: ''
  };

  ngOnInit() {
    this.isSuperAdmin = this.authService.isSuperAdmin();
    this.fetchUsers();
  }

  fetchUsers() {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.usersService.getUsers()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.users = data;
              this.page = 1;
              this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error fetching users:', err);
            this.errorMessage = err.status === 401 ? 'No autorizado.' : 'Error de conexión con el servidor.';
            this.cdr.detectChanges();
        }
      });
  }

  openModal() {
    this.showModal = true;
    this.isEditing = false;
    this.editingId = null;
    this.newUser = { 
      name: '', lastName: '', docType: '', docNumber: '', email: '', password: '', isActive: true, roleId: '2'
    };
  }

  editUser(user: any) {
    this.showModal = true;
    this.isEditing = true;
    this.editingId = user.id;
    this.newUser = { 
      name: user.name,
      lastName: user.lastName,
      docType: user.docType,
      docNumber: user.docNumber,
      email: user.email,
      password: '',
      isActive: user.isActive,
      roleId: user.roles && user.roles.length > 0 ? user.roles[0].id.toString() : '2'
    };
  }

  closeModal() {
    this.showModal = false;
  }

  submitUser() {
    this.isSubmitting = true;
    
    const dataToSave: any = {
      name: this.newUser.name,
      lastName: this.newUser.lastName,
      docType: this.newUser.docType,
      docNumber: this.newUser.docNumber,
      email: this.newUser.email,
      isActive: this.newUser.isActive,
      roleIds: [Number(this.newUser.roleId)]
    };

    if (this.newUser.password) {
      dataToSave.password = this.newUser.password;
    }

    if (this.isEditing && this.editingId) {
      this.usersService.updateUser(this.editingId, dataToSave).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => this.ngZone.run(() => this.onSaveSuccess()),
        error: (err) => this.ngZone.run(() => this.onSaveError(err))
      });
    } else {
      this.usersService.createUser(dataToSave).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => this.ngZone.run(() => this.onSaveSuccess()),
        error: (err) => this.ngZone.run(() => this.onSaveError(err))
      });
    }
  }

  private onSaveSuccess() {
    Swal.fire('¡Éxito!', 'Usuario guardado correctamente', 'success').then(() => {
      this.closeModal();
      this.fetchUsers();
      this.isSubmitting = false;
      this.cdr.detectChanges();
    });
  }

  private onSaveError(err: any) {
    console.error('Error saving user', err);
    Swal.fire('Error', err.error?.message || 'Error al guardar el usuario', 'error');
    this.isSubmitting = false;
    this.cdr.detectChanges();
  }

  deleteUser(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esto. Se eliminará el usuario y sus datos asociados.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#22c55e',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.usersService.deleteUser(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            Swal.fire('¡Eliminado!', 'El usuario ha sido eliminado.', 'success');
                this.fetchUsers();
          },
          error: (err) => {
            console.error('Error deleting user', err);
              Swal.fire('Error', 'No se pudo eliminar el usuario', 'error');
          }
        });
      }
    });
  }
}



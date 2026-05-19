import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MembershipsService, Membership } from '../../core/services/memberships.service';
import { AuthService } from '../../core/services/auth.service';

interface PlanCard {
  id: number;
  name: string;
  price: number;
  durationDays: number;
  description: string;
  features: string[];
  recommended: boolean;
}

@Component({
  selector: 'app-membresias',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './membresias.component.html',
  styleUrls: ['./membresias.component.scss'],
})
export class MembresiasComponent implements OnInit {
  private membershipsService = inject(MembershipsService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  planes: PlanCard[] = [];
  loading = true;
  errorMessage = '';

  // Subscription flow
  showConfirmModal = false;
  selectedPlan: PlanCard | null = null;
  subscribing = false;

  // Toast notification
  toast = { show: false, message: '', type: 'success' as 'success' | 'error' };

  ngOnInit() {
    window.scrollTo(0, 0);
    this.loadPlans();
  }

  loadPlans() {
    this.loading = true;
    this.errorMessage = '';

    this.membershipsService.getPublicMemberships().subscribe({
      next: (memberships) => {
        this.planes = memberships.map((m, index) => {
          let desc = m.description || '';
          if (desc.length > 90) {
            desc = desc.substring(0, 87) + '...';
          }
          
          let feats = m.benefits
            ? m.benefits.split(/[,\n]+/).map(b => b.trim()).filter(b => b.length > 0)
            : [];
            
          // Limitar a máximo 5 beneficios para no alargar la tarjeta infinitamente
          if (feats.length > 5) {
            feats = feats.slice(0, 5);
          }

          return {
            id: m.id!,
            name: m.name,
            price: m.price,
            durationDays: m.durationDays,
            description: desc,
            features: feats,
            recommended: index === 1 // Middle plan is recommended by default
          };
        });
        this.loading = false;
        this.cdr.detectChanges(); // Forzar actualización de la vista al instante
      },
      error: (err) => {
        console.error('Error loading memberships:', err);
        this.errorMessage = 'No se pudieron cargar los planes. Intenta de nuevo.';
        this.loading = false;
        this.cdr.detectChanges(); // Forzar actualización de la vista
      }
    });
  }

  selectPlan(plan: PlanCard) {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.selectedPlan = plan;
    this.showConfirmModal = true;
  }

  closeModal() {
    this.showConfirmModal = false;
    this.selectedPlan = null;
  }

  confirmSubscription() {
    if (!this.selectedPlan || this.subscribing) return;

    this.subscribing = true;

    this.membershipsService.subscribeToPlan(this.selectedPlan.id).subscribe({
      next: () => {
        this.subscribing = false;
        this.closeModal();
        this.showToast('¡Te has suscrito exitosamente! Revisa tu perfil.', 'success');

        // Redirect to profile after a short delay
        setTimeout(() => {
          this.router.navigate(['/perfil']);
        }, 2500);
      },
      error: (err) => {
        this.subscribing = false;
        this.closeModal();
        const message = err.error?.message || 'Error al procesar la suscripción.';
        this.showToast(
          Array.isArray(message) ? message.join(', ') : message,
          'error'
        );
      }
    });
  }

  showToast(message: string, type: 'success' | 'error') {
    this.toast = { show: true, message, type };
    setTimeout(() => {
      this.toast.show = false;
    }, 4000);
  }

  getDurationLabel(days: number): string {
    if (days === 30 || days === 31) return '/mes';
    if (days === 90) return '/trimestre';
    if (days === 365 || days === 360) return '/año';
    return `/${days} días`;
  }
}



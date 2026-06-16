import { Component, OnInit, inject, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MembershipsService, Membership } from '../../core/services/memberships.service';
import { AuthService } from '../../core/services/auth.service';
import { PaymentService } from '../../core/services/payment.service';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

interface PlanCard {
  id: number;
  name: string;
  price: number;
  durationDays: number;
  description: string;
  features: string[];
  recommended: boolean;
  owned: boolean;
}

@Component({
  selector: 'app-membresias',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './membresias.component.html',
  styleUrls: ['./membresias.component.scss'],
})
export class MembresiasComponent implements OnInit {
    destroyRef = inject(DestroyRef);
  private membershipsService = inject(MembershipsService);
  private authService = inject(AuthService);
  private paymentService = inject(PaymentService);
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

    this.membershipsService.getPublicMemberships().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (memberships) => {
        const user = this.authService.getUser();
        
        // Find which plans are active for the current user
        const activeMemberships = (user?.userMemberships || []).filter((m: any) => m.status === 'ACTIVE');

        this.planes = memberships.map((m, index) => {
          let desc = m.description || '';
          if (desc.length > 90) {
            desc = desc.substring(0, 87) + '...';
          }
          
          let feats = m.benefits
            ? m.benefits.split(/[,\n]+/).map(b => b.trim()).filter(b => b.length > 0)
            : [];
            
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
            recommended: index === 1,
            owned: activeMemberships.some((um: any) => um.membership?.id === m.id)
          };
        });
        this.loading = false;
        this.cdr.detectChanges();
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

    const user = this.authService.getUser();
    if (!user) return;

    // Store the selected membership so the checkout page can pick it up
    sessionStorage.removeItem('pending_event');
    sessionStorage.setItem('pending_membership', JSON.stringify({
      id: this.selectedPlan.id,
      name: this.selectedPlan.name,
      price: this.selectedPlan.price,
    }));

    this.closeModal();

    // Navigate to our custom payment form
    this.router.navigate(['/checkout/pay']);
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



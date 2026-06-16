import { Component, OnInit, inject, NgZone, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { EventsService } from '../../core/services/events.service';
import { EventRegistrationsService } from '../../core/services/event-registrations.service';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';
import Swal from '../../core/utils/app-swal';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: 'app-eventos',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './eventos.component.html',
  styleUrls: ['./eventos.component.scss'],
})
export class EventosComponent implements OnInit {
    destroyRef = inject(DestroyRef);
  private eventsService = inject(EventsService);
  private regService = inject(EventRegistrationsService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  private apiBase = environment.apiUrl;

  eventos: any[] = [];
  loading = true;
  /** Track which event IDs are currently submitting */
  submitting: Set<number> = new Set();
  /** Track which event IDs the user already registered */
  userRegsIds: Map<number, number> = new Map(); // eventId -> registrationId

  ngOnInit() {
    this.eventsService.getEventsPublic().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        const user = this.authService.getUser();
        this.eventos = data.filter((e: any) => e.isActive).map((e: any) => {
          const activeRegs = (e.registrations || []).filter((r: any) => r.status !== 'CANCELLED');
          
          if (user) {
            const myReg = activeRegs.find((r: any) => r.user_id === user.id || r.userId === user.id || r.user?.id === user.id);
            if (myReg) {
              this.userRegsIds.set(e.id, myReg.id);
            }
          }

          return {
            ...e,
            instructor: e.instructor || 'Inst. Profesional',
            spots: Math.max(0, (e.capacity || 0) - activeRegs.length),
            image: e.imageUrl ? this.resolveImageUrl(e.imageUrl) : 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b',
          };
        });
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  resolveImageUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${this.apiBase}${url}`;
  }

  confirmarAsistencia(evento: any) {
    const user = this.authService.getUser();
    if (!user?.id) {
      Swal.fire({
                  title: 'Inicia Sesión',
                  text: 'Debes iniciar sesión para confirmar tu asistencia.',
                  icon: 'warning',
                  showCancelButton: true,
                  confirmButtonText: 'Iniciar Sesión',
                  cancelButtonText: 'Cancelar',
                  confirmButtonColor: '#22c55e',
                  cancelButtonColor: '#94a3b8',
                }).then((res) => {
                  if (res.isConfirmed) {
                    this.router.navigate(['/login']);
                  }
                });
      return;
    }

    if (this.userRegsIds.has(evento.id)) {
      Swal.fire('¡Ya inscrito!', 'Ya confirmaste tu asistencia a este evento.', 'info');
      return;
    }

    Swal.fire({
              title: `¿Confirmar asistencia?`,
              html: `<b>${evento.title}</b><br><small>${evento.date || ''}</small>`,
              icon: 'question',
              showCancelButton: true,
              confirmButtonText: 'Sí, confirmar',
              cancelButtonText: 'Cancelar',
              confirmButtonColor: '#22c55e',
              cancelButtonColor: '#94a3b8',
            }).then((result) => {
              if (!result.isConfirmed) return;

              this.submitting.add(evento.id);

              this.regService.create({ user_id: user.id, event_id: evento.id }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
                next: (created) => {
                  this.submitting.delete(evento.id);
                  this.userRegsIds.set(evento.id, created?.id || -1);
                  // Reduce displayed spots locally
                  const ev = this.eventos.find(e => e.id === evento.id);
                  if (ev && ev.spots > 0) ev.spots--;
                  Swal.fire('¡Inscrito!', `Tu asistencia a <b>${evento.title}</b> ha sido confirmada.`, 'success');
                },
                error: (err) => {
                  this.submitting.delete(evento.id);
                  const msg = err?.error?.message || 'Hubo un error al registrar tu asistencia. Intenta de nuevo.';
                  Swal.fire('Error', msg, 'error');
                }
              });
            });
  }

  isSubmitting(id: number): boolean {
    return this.submitting.has(id);
  }

  isRegistered(id: number): boolean {
    return this.userRegsIds.has(id);
  }

}

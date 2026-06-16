import { Component, OnInit, inject, NgZone, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { EventRegistrationsService } from '../../core/services/event-registrations.service';
import { AuthService } from '../../core/services/auth.service';
import Swal from '../../core/utils/app-swal';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: 'app-evento-inscripcion',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './evento-inscripcion.html',
  styleUrls: ['./evento-inscripcion.scss'],
})
export class EventoInscripcion implements OnInit {
    destroyRef = inject(DestroyRef);
  private regService = inject(EventRegistrationsService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private ngZone = inject(NgZone);

  evento: any = null;
  isSubmitting = false;

  constructor() {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.evento = navigation.extras.state['evento'];
      // Bug #10 fix: guardar en sessionStorage para sobrevivir F5
      sessionStorage.setItem('inscripcion_evento', JSON.stringify(this.evento));
    }
  }

  ngOnInit() {
    // Bug #10 fix: si se recargó la página, recuperar el evento desde sessionStorage
    if (!this.evento) {
      const saved = sessionStorage.getItem('inscripcion_evento');
      if (saved) {
        try { this.evento = JSON.parse(saved); } catch { /* ignore */ }
      }
    }

    if (!this.evento) {
      this.router.navigate(['/eventos']);
      return;
    }
    
    if (!this.evento.desc && !this.evento.description) {
      this.evento.desc = 'Una sesión intensiva diseñada para superar tus límites. Combina resistencia, fuerza y técnica en un ambiente inmersivo.';
    } else if (this.evento.description) {
      this.evento.desc = this.evento.description;
    }
  }

  confirmarAsistencia(e: Event) {
    e.preventDefault();

    const user = this.authService.getUser();
    if (!user?.id) {
      Swal.fire({
                  title: 'Inicia Sesión',
                  text: 'Debes iniciar sesión para confirmar tu reserva.',
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

    if (!this.evento?.id) {
      Swal.fire('Error', 'No se pudo identificar el evento. Vuelve al calendario e intenta de nuevo.', 'error');
      return;
    }

    if (Number(this.evento.price) > 0) {
      sessionStorage.removeItem('pending_membership');
      sessionStorage.setItem('pending_event', JSON.stringify(this.evento));
      this.router.navigate(['/checkout/pay']);
      return;
    }

    this.isSubmitting = true;

    this.regService.create({ user_id: user.id, event_id: this.evento.id }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isSubmitting = false;
        Swal.fire({
                        title: '¡Reserva Confirmada!',
                        text: `Tu asistencia a ${this.evento.title} ha sido registrada con éxito. ¡Nos vemos en la clase!`,
                        icon: 'success',
                        confirmButtonText: 'Volver a Eventos',
                        confirmButtonColor: '#22c55e'
                      }).then(() => {
                        this.router.navigate(['/eventos']);
                      });
      },
      error: (err) => {
        this.isSubmitting = false;
        const msg = err?.error?.message || 'Error al registrar la inscripción. Intenta de nuevo.';
        if (msg.includes('duplicate') || msg.includes('unique') || err.status === 409) {
                       Swal.fire('¡Atención!', 'Ya tienes una reserva confirmada para este evento.', 'info')
                         .then(() => this.router.navigate(['/eventos']));
                    } else {
                       Swal.fire('Error', msg, 'error');
                    }
      }
    });
  }
}

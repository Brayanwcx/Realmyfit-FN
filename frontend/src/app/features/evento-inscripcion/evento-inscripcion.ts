import { Component, OnInit, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { EventRegistrationsService } from '../../core/services/event-registrations.service';
import { AuthService } from '../../core/services/auth.service';
import { PaymentService } from '../../core/services/payment.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-evento-inscripcion',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './evento-inscripcion.html',
  styleUrls: ['./evento-inscripcion.scss'],
})
export class EventoInscripcion implements OnInit {
  private regService = inject(EventRegistrationsService);
  private authService = inject(AuthService);
  private paymentService = inject(PaymentService);
  private router = inject(Router);
  private ngZone = inject(NgZone);

  evento: any = null;
  isSubmitting = false;

  constructor() {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.evento = navigation.extras.state['evento'];
      sessionStorage.setItem('inscripcion_evento', JSON.stringify(this.evento));
    }
  }

  ngOnInit() {
    if (!this.evento) {
      const saved = sessionStorage.getItem('inscripcion_evento');
      if (saved) {
        try {
          this.evento = JSON.parse(saved);
        } catch {
          /* ignore */
        }
      }
    }

    if (!this.evento) {
      this.router.navigate(['/eventos']);
      return;
    }

    if (!this.evento.desc && !this.evento.description) {
      this.evento.desc =
        'Una sesión intensiva diseñada para superar tus límites. Combina resistencia, fuerza y técnica en un ambiente inmersivo.';
    } else if (this.evento.description) {
      this.evento.desc = this.evento.description;
    }
  }

  isPaidEvent(): boolean {
    return Number(this.evento?.price) > 0;
  }

  formatPrice(price: number | string): string {
    return (
      '$ ' +
      new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(
        Number(price),
      )
    );
  }

  confirmarAsistencia(e: Event) {
    e.preventDefault();

    const user = this.authService.getUser();
    if (!user?.id) {
      this.ngZone.run(() => {
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
            this.router.navigate(['/login'], { queryParams: { returnUrl: '/inscripcion' } });
          }
        });
      });
      return;
    }

    if (!this.evento?.id) {
      this.ngZone.run(() => {
        Swal.fire(
          'Error',
          'No se pudo identificar el evento. Vuelve al calendario e intenta de nuevo.',
          'error',
        );
      });
      return;
    }

    if (this.isPaidEvent()) {
      this.isSubmitting = true;
      sessionStorage.setItem(
        'event_checkout',
        JSON.stringify({
          eventId: this.evento.id,
          name: this.evento.title,
          price: Number(this.evento.price),
          date: this.evento.date,
          image: this.evento.image,
        }),
      );

      this.paymentService.createEventCheckoutSession(this.evento.id, user.id).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          sessionStorage.setItem(
            'last_checkout',
            JSON.stringify([
              {
                name: this.evento.title,
                price: Number(this.evento.price),
                quantity: 1,
              },
            ]),
          );
          sessionStorage.setItem('last_checkout_type', 'event');
          window.location.href = res.url;
        },
        error: (err) => {
          this.isSubmitting = false;
          const msg =
            err?.error?.message || 'No se pudo iniciar el pago del evento. Intenta de nuevo.';
          this.ngZone.run(() => {
            Swal.fire('Error', Array.isArray(msg) ? msg.join(', ') : msg, 'error');
          });
        },
      });
      return;
    }

    this.isSubmitting = true;

    this.regService.create({ user_id: user.id, event_id: this.evento.id }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.ngZone.run(() => {
          Swal.fire({
            title: '¡Reserva Confirmada!',
            text: `Tu asistencia a ${this.evento.title} ha sido registrada con éxito. ¡Nos vemos en la clase!`,
            icon: 'success',
            confirmButtonText: 'Volver a Eventos',
            confirmButtonColor: '#22c55e',
          }).then(() => {
            this.router.navigate(['/eventos']);
          });
        });
      },
      error: (err) => {
        this.isSubmitting = false;
        const msg = err?.error?.message || 'Error al registrar la inscripción. Intenta de nuevo.';
        this.ngZone.run(() => {
          if (msg.includes('duplicate') || msg.includes('unique') || err.status === 409) {
            Swal.fire(
              '¡Atención!',
              'Ya tienes una reserva confirmada para este evento.',
              'info',
            ).then(() => this.router.navigate(['/eventos']));
          } else {
            Swal.fire('Error', msg, 'error');
          }
        });
      },
    });
  }
}

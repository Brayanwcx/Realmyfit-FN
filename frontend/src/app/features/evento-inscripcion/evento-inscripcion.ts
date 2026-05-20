import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { EventRegistrationsService } from '../../core/services/event-registrations.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-evento-inscripcion',
  imports: [RouterLink, CommonModule],
  templateUrl: './evento-inscripcion.html',
  styleUrls: ['./evento-inscripcion.scss'],
})
export class EventoInscripcion implements OnInit {
  private regService = inject(EventRegistrationsService);
  private authService = inject(AuthService);
  private router = inject(Router);

  evento: any = null;
  isSubmitting = false;
  success = false;
  errorMsg = '';

  constructor() {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.evento = navigation.extras.state['evento'];
    }
  }

  ngOnInit() {
    if (!this.evento) {
      this.evento = {
        title: 'Evento RealMyFit',
        date: 'Fecha por definir',
        instructor: 'Staff RealMyFit',
        image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop',
        desc: 'Una sesión intensiva diseñada para superar tus límites. Combina resistencia, fuerza y técnica en un ambiente inmersivo.'
      };
    } else {
      this.evento.desc = 'Una sesión intensiva diseñada para superar tus límites. Combina resistencia, fuerza y técnica en un ambiente inmersivo.';
    }
  }

  confirmInscripcion(e: Event) {
    e.preventDefault();

    const user = this.authService.getUser();
    if (!user?.id) {
      this.errorMsg = 'Debes iniciar sesión para reservar un cupo.';
      return;
    }

    if (!this.evento?.id) {
      this.errorMsg = 'No se pudo identificar el evento. Vuelve al calendario e intenta de nuevo.';
      return;
    }

    this.isSubmitting = true;
    this.errorMsg = '';

    this.regService.create({ user_id: user.id, event_id: this.evento.id }).subscribe({
      next: () => {
        this.success = true;
        this.isSubmitting = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMsg = err?.error?.message || 'Error al registrar la inscripción. Intenta de nuevo.';
        this.isSubmitting = false;
      }
    });
  }
}

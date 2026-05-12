import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-evento-inscripcion',
  imports: [RouterLink, CommonModule],
  templateUrl: './evento-inscripcion.html',
  styleUrls: ['./evento-inscripcion.scss'],
})
export class EventoInscripcion implements OnInit {
  evento: any = null;

  constructor(private router: Router) {
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
    alert('Inscripción confirmada. ¡Nos vemos en el evento!');
  }
}

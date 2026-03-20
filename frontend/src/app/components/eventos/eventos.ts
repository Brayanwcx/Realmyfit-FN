import { Component } from '@angular/core';

@Component({
  selector: 'app-eventos',
  imports: [],
  templateUrl: './eventos.component.html',
  styleUrls: ['./eventos.component.scss'],
})
export class EventosComponent {
  eventos = [
    { title: 'Maratón de Spinning', date: 'Viernes, 20:00 hrs', instructor: 'Sarah Connor', spots: 5 },
    { title: 'Masterclass: Fuerza Bruta', date: 'Sábado, 10:00 hrs', instructor: 'Marcus Vance', spots: 0 },
    { title: 'Taller de Core y Flexibilidad', date: 'Domingo, 09:00 hrs', instructor: 'Elena Rojas', spots: 12 },
    { title: 'Torneo Crossfit Amateur', date: 'Próximo Mes', instructor: 'David Lee', spots: 24 }
  ];
}

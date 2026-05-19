import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-eventos',
  imports: [RouterLink],
  templateUrl: './eventos.component.html',
  styleUrls: ['./eventos.component.scss'],
})
export class EventosComponent {
  eventos = [
    { title: 'Maratón de Spinning', date: 'Viernes, 20:00 hrs', instructor: 'Sarah Connor', spots: 5, image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop' },
    { title: 'Masterclass: Fuerza Bruta', date: 'Sábado, 10:00 hrs', instructor: 'Marcus Vance', spots: 0, image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1470&auto=format&fit=crop' },
    { title: 'Taller de Core y Flexibilidad', date: 'Domingo, 09:00 hrs', instructor: 'Elena Rojas', spots: 12, image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1470&auto=format&fit=crop' },
    { title: 'Torneo Crossfit Amateur', date: 'Próximo Mes', instructor: 'David Lee', spots: 24, image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1470&auto=format&fit=crop' }
  ];
}

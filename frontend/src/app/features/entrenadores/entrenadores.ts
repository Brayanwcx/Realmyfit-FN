import { Component } from '@angular/core';

@Component({
  selector: 'app-entrenadores',
  imports: [],
  templateUrl: './entrenadores.component.html',
  styleUrls: ['./entrenadores.component.scss'],
})
export class EntrenadoresComponent {
  entrenadores = [
    { name: 'Marcus Vance', spec: 'Bodybuilding / Fuerza', exp: '10 Años' },
    { name: 'Sarah Connor', spec: 'CrossFit / Resistencia', exp: '7 Años' },
    { name: 'David Lee', spec: 'Calistenia', exp: '5 Años' },
    { name: 'Elena Rojas', spec: 'Yoga / Flexibilidad', exp: '8 Años' }
  ];
}

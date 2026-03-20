import { Component } from '@angular/core';

@Component({
  selector: 'app-maquinas',
  imports: [],
  templateUrl: './maquinas.component.html',
  styleUrls: ['./maquinas.component.scss'],
})
export class MaquinasComponent {
  maquinas = [
    { name: 'Prensa Atlética 45°', cat: 'Fuerza', desc: 'Máxima resistencia biomecánica.' },
    { name: 'Caminadora Curva', cat: 'Cardio', desc: 'Eco-amigable, sin motor, mayor exigencia.' },
    { name: 'Polea Cruzada 360', cat: 'Multifuncional', desc: 'Versatilidad total para rutinas full body.' },
    { name: 'Hack Squat Pro', cat: 'Fuerza', desc: 'Asegura la postura y focaliza el cuádriceps.' },
    { name: 'Remo Hidráulico', cat: 'Cardio', desc: 'Resistencia mediante agua para impacto cero.' },
    { name: 'Smith Machine', cat: 'Pesas Libres', desc: 'Seguridad garantizada para levantamiento pesado.' }
  ];
}

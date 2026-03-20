import { Component } from '@angular/core';

@Component({
  selector: 'app-membresias',
  imports: [],
  templateUrl: './membresias.component.html',
  styleUrls: ['./membresias.component.scss'],
})
export class MembresiasComponent {
  planes = [
    { name: 'Básico', price: 29.99, features: ['Acceso a máquinas cardio', 'Vestuarios estándar', 'Horario Restricted (9am-4pm)'], recommended: false },
    { name: 'Pro', price: 49.99, features: ['Acceso total a todas las máquinas', 'Clases grupales ilimitadas', 'Casillero personal', '24/7 Access'], recommended: true },
    { name: 'Élite', price: 89.99, features: ['Beneficios Pro', 'Entrenador Personal Semanal', 'Nutrición VIP y Suplementos', 'Spa y Sauna'], recommended: false }
  ];
}

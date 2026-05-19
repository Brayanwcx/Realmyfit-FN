import { Component } from '@angular/core';

@Component({
  selector: 'app-contacto',
  imports: [],
  templateUrl: './contacto.html',
  styleUrls: ['./contacto.scss'],
})
export class Contacto {
  submitForm(e: Event) {
    e.preventDefault();
    alert('¡Mensaje enviado correctamente! Nuestro equipo en RealMyFit se pondrá en contacto pronto.');
  }
}

import { Component, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-maquina-detalle',
  imports: [RouterLink, CommonModule],
  templateUrl: './maquina-detalle.html',
  styleUrl: './maquina-detalle.scss',
})
export class MaquinaDetalle implements OnInit {
  videoUrl!: SafeResourceUrl;
  maquina: any = null;

  constructor(private sanitizer: DomSanitizer, private router: Router) {
    const nav = this.router.getCurrentNavigation();
    if (nav?.extras.state) {
      this.maquina = nav.extras.state['maquina'];
    }
  }

  ngOnInit() {
    // Si no pasaron máquina por estado, generamos una por defecto
    if (!this.maquina) {
      this.maquina = {
        name: 'Prensa Atlética 45°',
        cat: 'Fuerza',
        desc: 'Concebida para atletas de alto rendimiento. Ofrece un recorrido biomecánico perfecto que aísla los cuádriceps, femorales y glúteos de forma segura y efectiva, reduciendo la presión en la columna lumbar.',
        youtubeId: 'FCHm4L2X0hE' // Un video aleatorio real/ejemplo de prensa
      };
    }

    // Asegurar la url de youtube para el iframe embed
    const url = `https://www.youtube.com/embed/${this.maquina.youtubeId || 'FCHm4L2X0hE'}`;
    this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}

import { Component, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { Machine } from '../../core/services/machines.service';

@Component({
  selector: 'app-maquina-detalle',
  imports: [RouterLink, CommonModule],
  templateUrl: './maquina-detalle.html',
  styleUrl: './maquina-detalle.scss',
})
export class MaquinaDetalle implements OnInit {
  videoUrl!: SafeResourceUrl | null;
  maquina: Machine | null = null;

  constructor(private sanitizer: DomSanitizer, private router: Router) {
    const nav = this.router.getCurrentNavigation();
    if (nav?.extras.state) {
      this.maquina = nav.extras.state['maquina'] as Machine;
    }
  }

  ngOnInit() {
    if (this.maquina?.videoUrl) {
      // Soportar URLs de YouTube completas o IDs cortos
      const rawUrl = this.maquina.videoUrl;
      let embedUrl = rawUrl;

      if (rawUrl.includes('youtube.com/watch')) {
        const videoId = new URL(rawUrl).searchParams.get('v');
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (rawUrl.includes('youtu.be/')) {
        const videoId = rawUrl.split('youtu.be/')[1].split('?')[0];
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      }

      this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    } else {
      this.videoUrl = null;
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'AVAILABLE': return 'Disponible';
      case 'IN_MAINTENANCE': return 'En Mantenimiento';
      case 'OUT_OF_SERVICE': return 'Fuera de Servicio';
      default: return status;
    }
  }
}

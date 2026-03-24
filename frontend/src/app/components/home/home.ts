import { Component } from '@angular/core';
import { HeroComponent } from '../hero/hero';
import { FeaturesComponent } from '../features/features';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [HeroComponent, FeaturesComponent, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  testimonials = [
    {
      text: '"Empecé desde cero y el equipo me guio paso a paso. Ahora no imagino mi vida sin RealMyFit. Es más que un gimnasio, es mi segunda casa."',
      author: 'Carlos M.',
      role: 'Miembro hace 2 años',
      avatar: '🙋‍♂️'
    },
    {
      text: '"Las instalaciones son impecables y las máquinas siempre están en perfecto estado. Definitivamente el mejor ambiente para entrenar."',
      author: 'Laura G.',
      role: 'Atleta frecuente',
      avatar: '🏃‍♀️'
    },
    {
      text: '"Me encanta la energía de los entrenadores y la comunidad. Cada clase es un reto nuevo que disfruto al máximo. 100% recomendado."',
      author: 'Andrés F.',
      role: 'Deportista amateur',
      avatar: '🏋️‍♂️'
    }
  ];

  currentIndex = 0;
  intervalId: any;

  ngOnInit() {
    this.startCarousel();
  }

  ngOnDestroy() {
    this.stopCarousel();
  }

  startCarousel() {
    this.intervalId = setInterval(() => {
      this.next();
    }, 6000); // 6 seconds per slide
  }

  stopCarousel() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  next() {
    this.currentIndex = (this.currentIndex + 1) % this.testimonials.length;
  }

  prev() {
    this.currentIndex = (this.currentIndex - 1 + this.testimonials.length) % this.testimonials.length;
  }

  goTo(index: number) {
    this.currentIndex = index;
    this.stopCarousel();
    this.startCarousel(); // reset timer smoothly
  }
}

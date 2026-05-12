import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { HeroComponent } from '../hero/hero';
import { FeaturesComponent } from '../features/features';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [HeroComponent, FeaturesComponent, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
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
  private statsObserver: IntersectionObserver | null = null;
  private statsAnimated = false;

  // Stat definitions — must match the ids added to home.component.html
  private stats = [
    { prefix: '+', target: 5000, suffix: '',   id: 'stat-members' },
    { prefix: '+', target: 50,   suffix: '',   id: 'stat-trainers' },
    { prefix: '',  target: 100,  suffix: '+',  id: 'stat-classes' },
    { prefix: '',  target: 24,   suffix: '/7', id: 'stat-access' },
  ];

  ngOnInit() {
    this.startCarousel();
  }

  ngAfterViewInit() {
    this.setupStatsObserver();
  }

  ngOnDestroy() {
    this.stopCarousel();
    if (this.statsObserver) {
      this.statsObserver.disconnect();
    }
  }

  // ── Count-up animation ────────────────────────────────────────────────────
  private setupStatsObserver() {
    const section = document.querySelector('.stats-section');
    if (!section) return;

    this.statsObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !this.statsAnimated) {
          this.statsAnimated = true;
          this.animateAllStats();
        }
      },
      { threshold: 0.3 }
    );

    this.statsObserver.observe(section);
  }

  private animateAllStats() {
    this.stats.forEach(stat => this.animateNumber(stat));
  }

  private animateNumber(stat: { prefix: string; target: number; suffix: string; id: string }) {
    const el = document.getElementById(stat.id);
    if (!el) return;

    const duration = 1800;
    const steps = 60;
    const stepTime = duration / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += stat.target / steps;
      if (current >= stat.target) {
        current = stat.target;
        clearInterval(timer);
      }
      el.textContent = stat.prefix + Math.floor(current).toLocaleString('es-CO') + stat.suffix;
    }, stepTime);
  }
  // ─────────────────────────────────────────────────────────────────────────

  startCarousel() {
    this.intervalId = setInterval(() => {
      this.next();
    }, 6000);
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
    this.startCarousel();
  }
}

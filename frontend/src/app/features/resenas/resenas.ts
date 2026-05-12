import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-resenas',
  imports: [CommonModule],
  templateUrl: './resenas.html',
  styleUrls: ['./resenas.scss'],
})
export class Resenas {
  globalRating = 4.9;
  totalReviews = 1248;
  showForm = false;
  selectedRating: number | null = null;

  reviews = [
    { name: 'Diana Salazar', role: 'Miembro VIP', rating: 5, date: 'Hace 2 días', text: 'El ambiente y las máquinas son de otro nivel. Realmente me motivan a dar el 100% cada día. La zona de fuerza es mi favorita.' },
    { name: 'Carlos Mendoza', role: 'Principiante', rating: 5, date: 'Hace 1 semana', text: 'Los entrenadores son súper atentos. Empecé desde cero y me han guiado en todo mi proceso. Las instalaciones, impecables.' },
    { name: 'Laura Gómez', role: 'Atleta Pro', rating: 4, date: 'Hace 2 semanas', text: 'Excelente equipamiento de CrossFit. Solo sugeriría ampliar un poco el área de estiramientos, pero en general es el mejor gym de la ciudad en tecnología.' },
    { name: 'Andrés Felipe', role: 'Miembro Élite', rating: 5, date: 'Hace 1 mes', text: 'Sus eventos son increíbles. Fui a la masterclass de spinning y la energía estuvo brutal, hasta invitaron un DJ sorpresa. Totalmente recomendado.' },
    { name: 'Valentina C.', role: 'Fitness Lover', rating: 5, date: 'Hace 1 mes', text: 'La iluminación, la música y el diseño del gym hacen que quieras entrenar más. La app para reservar eventos o productos también funciona de maravilla y ahorra filas.' },
    { name: 'Javier Rocha', role: 'Miembro Regular', rating: 4, date: 'Hace 2 meses', text: 'Muy buenas instalaciones y máquinas de primer nivel. El horario de atención nocturno es súper conveniente.' }
  ];

  toggleForm() {
    this.showForm = !this.showForm;
  }

  get filteredReviews() {
    if (this.selectedRating === null) {
      return this.reviews;
    }
    return this.reviews.filter(review => review.rating === this.selectedRating);
  }

  setFilter(rating: number | null) {
    this.selectedRating = rating;
  }
}

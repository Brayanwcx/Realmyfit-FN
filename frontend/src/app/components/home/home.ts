import { Component } from '@angular/core';
import { HeroComponent } from '../hero/hero';
import { FeaturesComponent } from '../features/features';

@Component({
  selector: 'app-home',
  imports: [HeroComponent, FeaturesComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {}

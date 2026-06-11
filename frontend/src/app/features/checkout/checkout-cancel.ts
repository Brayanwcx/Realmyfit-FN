import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-checkout-cancel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './checkout-cancel.html',
  styleUrls: ['./checkout-cancel.scss']})
export class CheckoutCancelComponent {}

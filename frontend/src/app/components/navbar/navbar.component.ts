import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  isScrolled = false;
  isMobileMenuOpen = false;
  isServicesExpanded = false;
  totalItems = 0;
  currentUser: any = null;
  private userSub!: Subscription;

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cartService.cart$.subscribe(items => {
      this.totalItems = items.reduce((acc, item) => acc + item.qty, 0);
    });

    this.userSub = this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });
  }

  ngOnDestroy() {
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
  }

  get userInitials(): string {
    if (!this.currentUser) return '';
    const f = (this.currentUser.name || '')[0] || '';
    const l = (this.currentUser.lastName || '')[0] || '';
    return (f + l).toUpperCase();
  }

  get isLoggedIn(): boolean {
    return !!this.currentUser;
  }

  logout() {
    this.authService.logout();
    this.closeMobileMenu();
    this.router.navigate(['/']);
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 50;
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    if (!this.isMobileMenuOpen) {
      this.isServicesExpanded = false;
    }
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
    this.isServicesExpanded = false;
  }

  toggleServices(event: Event) {
    if (window.innerWidth <= 768) {
      event.preventDefault();
      this.isServicesExpanded = !this.isServicesExpanded;
    }
  }
}

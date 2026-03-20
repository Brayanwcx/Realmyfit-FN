import { Component, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive], // Standalone needs Router link imports for template usage
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  isScrolled = false;
  isMobileMenuOpen = false;
  isServicesExpanded = false;

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 50;
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    if (!this.isMobileMenuOpen) {
      this.isServicesExpanded = false; // Reset accordion state when closing menu
    }
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
    this.isServicesExpanded = false;
  }

  toggleServices(event: Event) {
    // Only applies logical toggling if in mobile view (where standard hover is unsupported or tricky)
    if (window.innerWidth <= 768) {
      event.preventDefault();
      this.isServicesExpanded = !this.isServicesExpanded;
    }
  }
}

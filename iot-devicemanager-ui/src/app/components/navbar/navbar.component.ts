import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {

  isLoggedIn = false;

  constructor(private cookieService: CookieService) {
    this.checkAuthStatus();
  }

  checkAuthStatus() {
    this.isLoggedIn = !!this.cookieService.get('auth_token');
  }

  signOut() {
    this.cookieService.delete('auth_token');
    this.cookieService.delete('refresh_token');
    this.isLoggedIn = false;
    window.location.href = '/login';
  }

}

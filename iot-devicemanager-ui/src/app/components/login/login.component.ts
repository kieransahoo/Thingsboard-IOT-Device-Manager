import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CookieService } from 'ngx-cookie-service';

interface AuthResponse {
  token: string;
  refreshToken: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  isLoading: boolean = false;
  error: string | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private cookieService: CookieService
  ) {}

  onSubmit() {
    this.isLoading = true;
    this.error = null;

    this.http
      .post<AuthResponse>('http://localhost:8081/api/iot/login', {
        email: this.email,
        password: this.password,
      })
      .subscribe({
        next: (response) => {
          // Save tokens in cookies (secure, HttpOnly in production)
          this.cookieService.set('auth_token', response.token, {
            path: '/',
            secure: false, // Set to true in production (HTTPS only)
            sameSite: 'Strict',
          });

          this.cookieService.set('refresh_token', response.refreshToken, {
            path: '/',
            secure: false,
            sameSite: 'Strict',
          });

          // Redirect to devices page
          this.router.navigate(['/devices']).then(() => {
            window.location.reload(); // Refresh to update navbar
          });
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading = false;
          this.error =
            err.error?.message ||
            'Login failed. Please check your credentials.';
          console.error('Login error:', err);
        },
        complete: () => {
          this.isLoading = false;
        },
      });
  }
}

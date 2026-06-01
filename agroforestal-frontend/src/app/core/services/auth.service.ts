import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { User, AuthResponse } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'agro_token';
  private readonly USER_KEY  = 'agro_user';
  private api = `${environment.apiUrl}`;

  currentUser = signal<User | null>(this.loadUser());

  isLoggedIn  = computed(() => !!this.currentUser());
  isAdmin     = computed(() => this.currentUser()?.role === 'admin');
  isClient    = computed(() => this.currentUser()?.role === 'client');

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${this.api}/login`, { email, password }).pipe(
      tap(res => this.saveSession(res))
    );
  }

  register(data: { name: string; email: string; password: string; password_confirmation: string; phone?: string }) {
    return this.http.post<AuthResponse>(`${this.api}/register`, data).pipe(
      tap(res => this.saveSession(res))
    );
  }

  logout() {
    this.http.post(`${this.api}/logout`, {}).subscribe();
    this.clearSession();
    this.router.navigate(['/']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  refreshMe() {
    return this.http.get<User>(`${this.api}/me`).pipe(
      tap(user => {
        this.currentUser.set(user);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      })
    );
  }

  private saveSession(res: AuthResponse) {
    localStorage.setItem(this.TOKEN_KEY, res.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
    this.currentUser.set(res.user);
  }

  private clearSession() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
  }

  private loadUser(): User | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
}

import { Component, signal, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <a routerLink="/" class="inline-block mb-6">
            <div class="w-12 h-12 bg-brand-orange rounded-full flex items-center justify-center mx-auto">
              <span class="text-white font-bold text-xl">A</span>
            </div>
          </a>
          <h1 class="text-3xl font-extrabold text-gray-900">Crear cuenta</h1>
          <p class="text-gray-500 mt-1">Únete a Agroforestal</p>
        </div>
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
              <input formControlName="name" type="text" class="input" placeholder="Tu nombre">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input formControlName="email" type="email" class="input" placeholder="tu@email.com">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input formControlName="phone" type="tel" class="input" placeholder="+57 300 000 0000">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input formControlName="password" type="password" class="input" placeholder="Mínimo 8 caracteres">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
              <input formControlName="password_confirmation" type="password" class="input" placeholder="Repite tu contraseña">
            </div>
            @if (error()) {
              <p class="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{{ error() }}</p>
            }
            <button type="submit" [disabled]="loading()" class="btn-primary w-full justify-center py-3 text-base">
              @if (loading()) { Creando cuenta... } @else { Crear cuenta }
            </button>
          </form>
          <p class="text-center text-sm text-gray-500 mt-6">
            ¿Ya tienes cuenta? <a routerLink="/auth/login" class="text-brand-orange font-semibold hover:underline">Inicia sesión</a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private router = inject(Router);

  error   = signal('');
  loading = signal(false);

  form = this.fb.group({
    name:                  ['', [Validators.required, Validators.minLength(2)]],
    email:                 ['', [Validators.required, Validators.email]],
    phone:                 [''],
    password:              ['', [Validators.required, Validators.minLength(8)]],
    password_confirmation: ['', Validators.required],
  });

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    this.auth.register(this.form.value as any).subscribe({
      next: () => { this.loading.set(false); this.router.navigate(['/']); },
      error: (err: any) => { this.error.set(err?.error?.message || 'Error al crear cuenta.'); this.loading.set(false); },
    });
  }
}

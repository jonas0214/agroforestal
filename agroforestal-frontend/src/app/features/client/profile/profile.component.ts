import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
      <h2 class="text-xl font-bold text-gray-900 mb-6">Mi perfil</h2>
      <form [formGroup]="form" (ngSubmit)="save()" class="space-y-4 max-w-md">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <input formControlName="name" type="text" class="input">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input [value]="auth.currentUser()?.email" type="email" class="input bg-gray-50" disabled>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
          <input formControlName="phone" type="tel" class="input">
        </div>
        @if (saved()) {
          <p class="text-green-600 text-sm">✅ Perfil actualizado</p>
        }
        <button type="submit" class="btn-primary">Guardar cambios</button>
      </form>
    </div>
  `,
})
export class ProfileComponent {
  private fb   = inject(FormBuilder);
  auth         = inject(AuthService);
  private http = inject(HttpClient);

  saved = signal(false);

  form = this.fb.group({
    name:  [this.auth.currentUser()?.name || ''],
    phone: [this.auth.currentUser()?.phone || ''],
  });

  save() {
    this.http.patch(`${environment.apiUrl}/me`, this.form.value).subscribe(() => {
      this.auth.refreshMe().subscribe();
      this.saved.set(true);
      setTimeout(() => this.saved.set(false), 3000);
    });
  }
}

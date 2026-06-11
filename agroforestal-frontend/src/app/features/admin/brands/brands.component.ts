import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Brand } from '../../../core/models/product.model';

@Component({
  selector: 'app-admin-brands',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
<div class="p-8">
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-2xl font-bold text-gray-900">Marcas</h1>
    <button (click)="openCreate()" class="btn-primary">+ Nueva marca</button>
  </div>

  @if (showForm()) {
    <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl w-full max-w-md p-8">
        <h2 class="text-xl font-bold mb-6">{{ editingId() ? 'Editar' : 'Nueva' }} marca</h2>
        <form [formGroup]="form" (ngSubmit)="save()" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input formControlName="name" type="text" class="input" placeholder="Ej: STIHL">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Sitio web</label>
            <input formControlName="website" type="url" class="input" placeholder="https://www.stihl.com">
          </div>
          @if (error()) {
            <p class="text-sm text-red-600">{{ error() }}</p>
          }
          <div class="flex gap-3 pt-2">
            <button type="submit" [disabled]="loading()" class="btn-primary flex-1 justify-center">
              {{ loading() ? 'Guardando...' : 'Guardar' }}
            </button>
            <button type="button" (click)="showForm.set(false)" class="btn-outline flex-1 text-center">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  }

  <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <table class="w-full text-sm">
      <thead class="bg-gray-50 border-b border-gray-100">
        <tr>
          <th class="text-left px-6 py-3 text-gray-500 font-semibold">Nombre</th>
          <th class="text-left px-6 py-3 text-gray-500 font-semibold hidden md:table-cell">Sitio web</th>
          <th class="text-left px-6 py-3 text-gray-500 font-semibold">Slug</th>
          <th class="text-right px-6 py-3 text-gray-500 font-semibold">Acciones</th>
        </tr>
      </thead>
      <tbody>
        @for (brand of brands(); track brand.id) {
          <tr class="border-b border-gray-50 hover:bg-gray-50">
            <td class="px-6 py-4 font-medium text-gray-900">{{ brand.name }}</td>
            <td class="px-6 py-4 text-gray-500 text-xs hidden md:table-cell">{{ brand.website || '—' }}</td>
            <td class="px-6 py-4 text-gray-400 text-xs font-mono">{{ brand.slug }}</td>
            <td class="px-6 py-4 text-right space-x-2">
              <button (click)="openEdit(brand)" class="text-brand-orange hover:underline text-xs font-semibold">Editar</button>
              <button (click)="delete(brand.id)" class="text-red-500 hover:underline text-xs font-semibold">Eliminar</button>
            </td>
          </tr>
        }
        @if (brands().length === 0) {
          <tr><td colspan="4" class="px-6 py-12 text-center text-gray-400">No hay marcas aún</td></tr>
        }
      </tbody>
    </table>
  </div>
</div>
  `,
})
export class BrandsComponent implements OnInit {
  private http = inject(HttpClient);
  private fb   = inject(FormBuilder);
  private api  = environment.apiUrl;

  brands    = signal<Brand[]>([]);
  showForm  = signal(false);
  editingId = signal<number | null>(null);
  loading   = signal(false);
  error     = signal<string | null>(null);

  form = this.fb.group({
    name:    ['', Validators.required],
    website: [''],
  });

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.http.get<Brand[]>(`${this.api}/brands`).subscribe(b => this.brands.set(b));
  }

  openCreate() {
    this.editingId.set(null);
    this.error.set(null);
    this.form.reset();
    this.showForm.set(true);
  }

  openEdit(b: Brand) {
    this.editingId.set(b.id);
    this.error.set(null);
    this.form.patchValue(b);
    this.showForm.set(true);
  }

  save() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    const data = this.form.value;
    const req = this.editingId()
      ? this.http.patch(`${this.api}/admin/brands/${this.editingId()}`, data)
      : this.http.post(`${this.api}/admin/brands`, data);
    req.subscribe({
      next: () => { this.loading.set(false); this.showForm.set(false); this.loadAll(); },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'No se pudo guardar la marca. Revisa los datos.');
      },
    });
  }

  delete(id: number) {
    if (!confirm('¿Eliminar esta marca?')) return;
    this.http.delete(`${this.api}/admin/brands/${id}`).subscribe(() => this.loadAll());
  }
}

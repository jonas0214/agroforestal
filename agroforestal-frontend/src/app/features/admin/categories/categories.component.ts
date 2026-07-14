import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Category } from '../../../core/models/product.model';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
<div class="p-8">
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-2xl font-bold text-gray-900">Categorías</h1>
    <button (click)="openCreate()" class="btn-primary">+ Nueva categoría</button>
  </div>

  @if (showForm()) {
    <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl w-full max-w-md p-8">
        <h2 class="text-xl font-bold mb-6">{{ editingId() ? 'Editar' : 'Nueva' }} categoría</h2>
        <form [formGroup]="form" (ngSubmit)="save()" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input formControlName="name" type="text" class="input">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea formControlName="description" rows="2" class="input resize-none"></textarea>
          </div>
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

  <div class="relative mb-4">
    <svg class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"/></svg>
    <input type="text" [ngModel]="searchTerm()" (ngModelChange)="searchTerm.set($event)"
           placeholder="Buscar categoría..." class="input !pl-9 w-full max-w-sm">
  </div>

  <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <table class="w-full text-sm">
      <thead class="bg-gray-50 border-b border-gray-100">
        <tr>
          <th class="text-left pl-6 pr-2 py-3 text-gray-500 font-semibold w-12">#</th>
          <th class="text-left px-6 py-3 text-gray-500 font-semibold">Nombre</th>
          <th class="text-left px-6 py-3 text-gray-500 font-semibold">Slug</th>
          <th class="text-right px-6 py-3 text-gray-500 font-semibold">Acciones</th>
        </tr>
      </thead>
      <tbody>
        @for (cat of filteredCategories(); track cat.id; let i = $index) {
          <tr class="border-b border-gray-50 hover:bg-gray-50">
            <td class="pl-6 pr-2 py-4 text-gray-400 tabular-nums">{{ i + 1 }}</td>
            <td class="px-6 py-4 font-medium text-gray-900">{{ cat.name }}</td>
            <td class="px-6 py-4 text-gray-400 text-xs font-mono">{{ cat.slug }}</td>
            <td class="px-6 py-4 text-right space-x-2">
              <button (click)="openEdit(cat)" class="text-brand-orange hover:underline text-xs font-semibold">Editar</button>
              <button (click)="delete(cat.id)" class="text-red-500 hover:underline text-xs font-semibold">Eliminar</button>
            </td>
          </tr>
        }
        @if (filteredCategories().length === 0) {
          <tr><td colspan="4" class="px-6 py-12 text-center text-gray-400">
            {{ categories().length === 0 ? 'No hay categorías aún' : 'Ninguna categoría coincide con la búsqueda' }}
          </td></tr>
        }
      </tbody>
    </table>
  </div>
</div>
  `,
})
export class CategoriesComponent implements OnInit {
  private http = inject(HttpClient);
  private fb   = inject(FormBuilder);
  private api  = environment.apiUrl;

  categories = signal<Category[]>([]);
  searchTerm = signal('');
  filteredCategories = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.categories();
    return this.categories().filter(c =>
      c.name.toLowerCase().includes(term) || (c.slug ?? '').toLowerCase().includes(term));
  });
  showForm   = signal(false);
  editingId  = signal<number | null>(null);
  loading    = signal(false);

  form = this.fb.group({
    name:        ['', Validators.required],
    description: [''],
  });

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.http.get<Category[]>(`${this.api}/categories`).subscribe(c => this.categories.set(c));
  }

  openCreate() {
    this.editingId.set(null);
    this.form.reset();
    this.showForm.set(true);
  }

  openEdit(c: Category) {
    this.editingId.set(c.id);
    this.form.patchValue(c);
    this.showForm.set(true);
  }

  save() {
    if (this.form.invalid) return;
    this.loading.set(true);
    const data = this.form.value;
    const req = this.editingId()
      ? this.http.patch(`${this.api}/admin/categories/${this.editingId()}`, data)
      : this.http.post(`${this.api}/admin/categories`, data);
    req.subscribe(() => { this.loading.set(false); this.showForm.set(false); this.loadAll(); });
  }

  delete(id: number) {
    if (!confirm('¿Eliminar esta categoría?')) return;
    this.http.delete(`${this.api}/admin/categories/${id}`).subscribe(() => this.loadAll());
  }
}

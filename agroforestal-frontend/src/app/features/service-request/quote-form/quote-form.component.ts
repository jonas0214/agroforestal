import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { ServiceRequestService } from '../../../core/services/service-request.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-quote-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 class="section-title mb-2">Solicitar Cotización</h1>
      <p class="section-subtitle">Indícanos los productos y cantidades que necesitas</p>

      @if (success()) {
        <div class="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <div class="text-5xl mb-4">✅</div>
          <h2 class="text-2xl font-bold text-green-800 mb-2">¡Cotización enviada!</h2>
          <p class="text-green-600">Te enviaremos la cotización a tu correo en breve.</p>
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="submit()" class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input formControlName="name" type="text" class="input">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input formControlName="email" type="email" class="input">
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-3">Productos a cotizar *</label>
            <div formArrayName="items" class="space-y-3">
              @for (item of items.controls; track $index) {
                <div [formGroupName]="$index" class="flex gap-3 items-center">
                  <input formControlName="product_name" type="text" placeholder="Nombre del producto" class="input flex-1 text-sm">
                  <input formControlName="quantity" type="number" min="1" placeholder="Cant." class="input w-24 text-sm">
                  @if ($index > 0) {
                    <button type="button" (click)="removeItem($index)" class="text-red-500 hover:text-red-700 p-2">✕</button>
                  }
                </div>
              }
            </div>
            <button type="button" (click)="addItem()" class="mt-3 text-sm text-brand-orange hover:underline font-medium">+ Agregar otro producto</button>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Notas adicionales</label>
            <textarea formControlName="notes" rows="3" class="input resize-none" placeholder="Información adicional..."></textarea>
          </div>

          <button type="submit" [disabled]="loading()" class="btn-primary w-full justify-center py-4">
            @if (loading()) { Enviando... } @else { Enviar cotización }
          </button>
        </form>
      }
    </div>
  `,
})
export class QuoteFormComponent {
  private fb        = inject(FormBuilder);
  private srService = inject(ServiceRequestService);
  private authSvc   = inject(AuthService);

  success = signal(false);
  loading = signal(false);

  form = this.fb.group({
    name:  ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    items: this.fb.array([this.createItem()]),
    notes: [''],
  });

  get items() { return this.form.get('items') as FormArray; }

  constructor() {
    const user = this.authSvc.currentUser();
    if (user) { this.form.patchValue({ name: user.name, email: user.email }); }
  }

  createItem() {
    return this.fb.group({ product_name: ['', Validators.required], quantity: [1, [Validators.required, Validators.min(1)]] });
  }

  addItem()        { this.items.push(this.createItem()); }
  removeItem(i: number) { this.items.removeAt(i); }

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    const payload = {
      ...this.form.value,
      items: this.items.value.map((it: any, i: number) => ({ product_id: i + 1, quantity: it.quantity })),
    };
    this.srService.submitQuote(payload as any).subscribe({
      next: () => { this.success.set(true); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}

import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { ServiceRequestService } from '../../../core/services/service-request.service';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-quote-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 class="section-title mb-2">Solicitar Cotización</h1>
      <p class="section-subtitle">Indícanos los productos y cantidades que necesitas</p>

      @if (success()) {
        <div class="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <div class="text-5xl mb-4">✅</div>
          <h2 class="text-2xl font-bold text-green-800 mb-2">¡Cotización enviada!</h2>
          <p class="text-green-600 mb-6">Te enviaremos la cotización a tu correo en breve.</p>
          <a routerLink="/catalogo" class="btn-primary inline-flex">Seguir viendo el catálogo</a>
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
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono / WhatsApp</label>
              <input formControlName="phone" type="tel" class="input" placeholder="Ej: 300 123 4567">
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Productos a cotizar *</label>
            @if (fromCart()) {
              <p class="text-xs text-gray-400 mb-3">Cargamos los productos de tu carrito. Puedes ajustar cantidades, quitar o agregar más.</p>
            } @else {
              <p class="text-xs text-gray-400 mb-3">Escribe el producto que te interesa, o agrégalo primero al carrito desde el <a routerLink="/catalogo" class="text-brand-orange hover:underline">catálogo</a>.</p>
            }
            <div formArrayName="items" class="space-y-3">
              @for (item of items.controls; track $index) {
                <div [formGroupName]="$index" class="flex gap-3 items-center">
                  <input formControlName="product_name" type="text" placeholder="Nombre del producto" class="input flex-1 text-sm"
                         [readonly]="item.value.product_id" [class.bg-gray-50]="item.value.product_id">
                  <input formControlName="quantity" type="number" min="1" placeholder="Cant." class="input w-24 text-sm">
                  @if (items.length > 1) {
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

          @if (error()) {
            <p class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{{ error() }}</p>
          }

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
  private cart      = inject(CartService);

  success  = signal(false);
  loading  = signal(false);
  error    = signal<string | null>(null);
  fromCart = signal(false);

  form = this.fb.group({
    name:  ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    items: this.fb.array([] as any[]),
    notes: [''],
  });

  get items() { return this.form.get('items') as FormArray; }

  constructor() {
    const user = this.authSvc.currentUser();
    if (user) { this.form.patchValue({ name: user.name, email: user.email }); }

    const cartItems = this.cart.items();
    if (cartItems.length > 0) {
      this.fromCart.set(true);
      for (const ci of cartItems) {
        this.items.push(this.createItem(ci.name, ci.quantity, ci.id));
      }
    } else {
      this.items.push(this.createItem());
    }
  }

  createItem(name = '', quantity = 1, productId: number | null = null) {
    return this.fb.group({
      product_id:   [productId],
      product_name: [name, Validators.required],
      quantity:     [quantity, [Validators.required, Validators.min(1)]],
    });
  }

  addItem()             { this.items.push(this.createItem()); }
  removeItem(i: number) { this.items.removeAt(i); }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set(null);
    const payload = {
      ...this.form.value,
      items: this.items.value.map((it: any) => ({
        product_id:   it.product_id ?? null,
        product_name: it.product_name,
        quantity:     it.quantity,
      })),
    };
    this.srService.submitQuote(payload as any).subscribe({
      next: () => {
        this.success.set(true);
        this.loading.set(false);
        this.cart.clear();
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'No se pudo enviar la cotización. Intenta de nuevo.');
      },
    });
  }
}

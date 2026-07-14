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
                <div [formGroupName]="$index">
                  @if (item.value.product_id) {
                    <!-- Producto del carrito: tarjeta con foto -->
                    <div class="flex items-center gap-4 border border-gray-100 rounded-xl p-3 bg-gray-50/50">
                      @if (item.value.cover_image) {
                        <img [src]="item.value.cover_image" [alt]="item.value.product_name"
                             class="w-16 h-16 object-cover rounded-lg border border-gray-100 bg-white shrink-0">
                      } @else {
                        <div class="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                          <svg class="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        </div>
                      }
                      <div class="flex-1 min-w-0">
                        <p class="font-medium text-gray-900 text-sm truncate">{{ item.value.product_name }}</p>
                        @if (item.value.brand) { <p class="text-xs text-gray-400">{{ item.value.brand }}</p> }
                        @if (item.value.price) {
                          <p class="text-xs font-semibold text-brand-green">{{ item.value.price | currency:'COP':'symbol-narrow':'1.0-0' }}</p>
                        } @else {
                          <p class="text-xs text-gray-400">Precio a consultar</p>
                        }
                      </div>
                      <div class="flex items-center gap-2 shrink-0">
                        <label class="text-xs text-gray-400 hidden sm:block">Cant.</label>
                        <input formControlName="quantity" type="number" min="1" class="input w-20 text-sm text-center">
                        <button type="button" (click)="removeItem($index)" title="Quitar"
                                class="text-red-400 hover:text-red-600 p-2">✕</button>
                      </div>
                    </div>
                  } @else {
                    <!-- Producto escrito a mano -->
                    <div class="flex gap-3 items-center">
                      <input formControlName="product_name" type="text" placeholder="Nombre del producto" class="input flex-1 text-sm">
                      <input formControlName="quantity" type="number" min="1" placeholder="Cant." class="input w-24 text-sm">
                      @if (items.length > 1) {
                        <button type="button" (click)="removeItem($index)" class="text-red-500 hover:text-red-700 p-2">✕</button>
                      }
                    </div>
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
        this.items.push(this.fb.group({
          product_id:   [ci.id],
          product_name: [ci.name, Validators.required],
          quantity:     [ci.quantity, [Validators.required, Validators.min(1)]],
          cover_image:  [ci.cover_image ?? null],
          price:        [ci.price || null],
          brand:        [ci.brand ?? null],
        }));
      }
    } else {
      this.items.push(this.createItem());
    }
  }

  createItem() {
    return this.fb.group({
      product_id:   [null],
      product_name: ['', Validators.required],
      quantity:     [1, [Validators.required, Validators.min(1)]],
      cover_image:  [null],
      price:        [null],
      brand:        [null],
    });
  }

  addItem()             { this.items.push(this.createItem()); }
  removeItem(i: number) { this.items.removeAt(i); }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (this.items.length === 0) { this.error.set('Agrega al menos un producto.'); return; }
    this.loading.set(true);
    this.error.set(null);
    const payload = {
      name:  this.form.value.name,
      email: this.form.value.email,
      phone: this.form.value.phone,
      notes: this.form.value.notes,
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

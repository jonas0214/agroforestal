import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { ServiceRequestService } from '../../../core/services/service-request.service';
import { ProductService } from '../../../core/services/product.service';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-quote-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
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

            <!-- Buscador de productos: el cliente agrega sin salir del formulario -->
            <div class="relative mb-3">
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input [(ngModel)]="query" [ngModelOptions]="{ standalone: true }" (ngModelChange)="onSearch($event)"
                     (focus)="searchFocused.set(true)" type="text" autocomplete="off"
                     placeholder="Busca un producto por nombre o referencia..."
                     class="input pl-10">
              @if (searching()) {
                <div class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-brand-orange border-t-transparent animate-spin"></div>
              }

              @if (searchFocused() && query.length >= 2) {
                <div class="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-80 overflow-y-auto">
                  @if (results().length === 0 && !searching()) {
                    <div class="px-4 py-4 text-sm text-gray-500">
                      No encontramos “{{ query }}”.
                      <button type="button" (click)="addManual(query)" class="text-brand-orange font-medium hover:underline">Agregarlo igual</button>
                    </div>
                  }
                  @for (p of results(); track p.id) {
                    <button type="button" (click)="addProduct(p)"
                            class="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left border-b border-gray-50 last:border-0">
                      @if (p.cover_image) {
                        <img [src]="p.cover_image" [alt]="p.name" class="w-11 h-11 object-contain rounded-lg bg-gray-50 border border-gray-100 shrink-0">
                      } @else {
                        <div class="w-11 h-11 rounded-lg bg-gray-100 shrink-0"></div>
                      }
                      <span class="flex-1 min-w-0">
                        <span class="block text-sm font-medium text-gray-900 truncate">{{ p.name }}</span>
                        <span class="block text-xs text-gray-400 truncate">
                          {{ p.brand?.name || 'Sin marca' }}@if (p.sku) { · Ref. {{ p.sku }} }
                        </span>
                      </span>
                      <span class="text-brand-orange text-xs font-bold shrink-0">+ Agregar</span>
                    </button>
                  }
                </div>
              }
            </div>

            @if (fromCart()) {
              <p class="text-xs text-gray-400 mb-3">Cargamos los productos de tu carrito. Puedes ajustar cantidades, quitar o agregar más.</p>
            }

            <div formArrayName="items" class="space-y-3">
              @for (item of items.controls; track $index) {
                <div [formGroupName]="$index">
                  @if (item.value.product_id) {
                    <!-- Producto seleccionado del catálogo: tarjeta con foto -->
                    <div class="flex items-center gap-4 border border-gray-100 rounded-xl p-3 bg-gray-50/50">
                      @if (item.value.cover_image) {
                        <img [src]="item.value.cover_image" [alt]="item.value.product_name"
                             class="w-16 h-16 object-contain rounded-lg border border-gray-100 bg-white shrink-0">
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
                      <button type="button" (click)="removeItem($index)" class="text-red-500 hover:text-red-700 p-2">✕</button>
                    </div>
                  }
                </div>
              }
            </div>

            @if (items.length === 0) {
              <p class="text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl px-4 py-5 text-center">
                Busca arriba el producto que necesitas, o revisa el <a routerLink="/catalogo" class="text-brand-orange hover:underline">catálogo completo</a>.
              </p>
            }

            <button type="button" (click)="addManual()" class="mt-3 text-sm text-brand-orange hover:underline font-medium">+ Escribir un producto manualmente</button>
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
export class QuoteFormComponent implements OnInit {
  private fb         = inject(FormBuilder);
  private srService  = inject(ServiceRequestService);
  private productSvc = inject(ProductService);
  private authSvc    = inject(AuthService);
  private route      = inject(ActivatedRoute);
  private cart       = inject(CartService);

  success  = signal(false);
  loading  = signal(false);
  error    = signal<string | null>(null);
  fromCart = signal(false);

  query         = '';
  results       = signal<Product[]>([]);
  searching     = signal(false);
  searchFocused = signal(false);
  private search$ = new Subject<string>();

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
    }

    this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        this.searching.set(true);
        return this.productSvc.getProducts({ search: term, perPage: 8 });
      }),
    ).subscribe(res => {
      this.results.set(res.data);
      this.searching.set(false);
    });
  }

  ngOnInit() {
    // /cotizacion?producto=<id> — el cliente llega desde la ficha del producto
    // y lo encuentra ya cargado, con foto, sin volver al catálogo.
    const id = Number(this.route.snapshot.queryParamMap.get('producto'));
    if (id) {
      this.productSvc.getProduct(id).subscribe(p => this.addProduct(p));
    }
  }

  onSearch(term: string) {
    this.searchFocused.set(true);
    if (term.trim().length < 2) { this.results.set([]); return; }
    this.search$.next(term.trim());
  }

  addProduct(p: Product) {
    const existing = this.items.controls.findIndex(c => c.value.product_id === p.id);
    if (existing !== -1) {
      const ctrl = this.items.at(existing).get('quantity')!;
      ctrl.setValue((Number(ctrl.value) || 1) + 1);
    } else {
      this.items.push(this.fb.group({
        product_id:   [p.id],
        product_name: [p.name, Validators.required],
        quantity:     [1, [Validators.required, Validators.min(1)]],
        cover_image:  [p.cover_image ?? null],
        price:        [Number(p.sale_price || p.price) || null],
        brand:        [p.brand?.name ?? null],
      }));
    }
    this.query = '';
    this.results.set([]);
    this.searchFocused.set(false);
  }

  addManual(name = '') {
    this.items.push(this.fb.group({
      product_id:   [null],
      product_name: [name, Validators.required],
      quantity:     [1, [Validators.required, Validators.min(1)]],
      cover_image:  [null],
      price:        [null],
      brand:        [null],
    }));
    this.query = '';
    this.results.set([]);
    this.searchFocused.set(false);
  }

  removeItem(i: number) { this.items.removeAt(i); }

  submit() {
    if (this.items.length === 0) { this.error.set('Agrega al menos un producto.'); return; }
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
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

import { Injectable, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Product } from '../models/product.model';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  cover_image?: string;
  quantity: number;
  sku?: string;
  brand?: string;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private platformId = inject(PLATFORM_ID);
  private STORAGE_KEY = 'agro_cart';

  items  = signal<CartItem[]>(this.loadCart());
  isOpen = signal(false);

  total = computed(() => this.items().reduce((sum, i) => sum + i.price * i.quantity, 0));
  count = computed(() => this.items().reduce((sum, i) => sum + i.quantity, 0));

  add(product: Product) {
    const price = Number(product.sale_price || product.price || 0);
    const existing = this.items().find(i => i.id === product.id);
    if (existing) {
      this.items.update(items => items.map(i =>
        i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      this.items.update(items => [...items, {
        id:          product.id,
        name:        product.name,
        price,
        cover_image: product.cover_image,
        quantity:    1,
        sku:         product.sku,
        brand:       product.brand?.name,
      }]);
    }
    this.save();
    this.isOpen.set(true);
  }

  remove(id: number) {
    this.items.update(items => items.filter(i => i.id !== id));
    this.save();
  }

  setQty(id: number, qty: number) {
    if (qty < 1) { this.remove(id); return; }
    this.items.update(items => items.map(i => i.id === id ? { ...i, quantity: qty } : i));
    this.save();
  }

  clear() {
    this.items.set([]);
    this.save();
  }

  private loadCart(): CartItem[] {
    if (!isPlatformBrowser(this.platformId)) return [];
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  private save() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.items()));
    }
  }
}

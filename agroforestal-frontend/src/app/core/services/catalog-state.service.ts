import { Injectable } from '@angular/core';
import { Product, PaginatedResponse } from '../models/product.model';

interface CatalogSnapshot {
  key: string;
  products: Product[];
  pagination: Partial<PaginatedResponse<any>>;
  page: number;
  scrollY: number;
}

/**
 * Recuerda el catálogo tal como lo dejó el cliente.
 *
 * Sin esto, entrar a un producto y volver atrás rehace la primera petición:
 * se pierden las tandas cargadas con "Cargar más" y la página salta al inicio.
 * Quien venía viendo el producto 60 tenía que recorrerlo todo de nuevo.
 *
 * La instantánea se guarda en memoria (no sobrevive a un F5, y está bien:
 * una recarga explícita sí debe traer datos frescos).
 */
@Injectable({ providedIn: 'root' })
export class CatalogStateService {
  private snapshot: CatalogSnapshot | null = null;

  save(s: CatalogSnapshot) { this.snapshot = s; }

  /** Devuelve la instantánea solo si corresponde a los mismos filtros. */
  restore(key: string): CatalogSnapshot | null {
    return this.snapshot && this.snapshot.key === key ? this.snapshot : null;
  }

  clear() { this.snapshot = null; }
}

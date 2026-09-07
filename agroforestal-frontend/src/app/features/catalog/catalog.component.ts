import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { CatalogStateService } from '../../core/services/catalog-state.service';
import { CartService } from '../../core/services/cart.service';
import { Product, Category, Brand, PaginatedResponse } from '../../core/models/product.model';

const PER_PAGE = 24;

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './catalog.component.html',
})
export class CatalogComponent implements OnInit, OnDestroy {
  products   = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  brands     = signal<Brand[]>([]);
  pagination = signal<Partial<PaginatedResponse<any>>>({});
  loading    = signal(false);
  loadingMore = signal(false);

  searchTerm = '';
  // Multi-selección: el cliente puede combinar varias categorías y marcas
  selectedCategories = signal<string[]>([]);
  selectedBrands     = signal<string[]>([]);
  onlyAvailable      = signal(false);
  sort = 'name_asc';
  currentPage = 1;
  filtersOpen = signal(false);

  sortOptions = [
    { value: 'name_asc',   label: 'Nombre (A - Z)' },
    { value: 'name_desc',  label: 'Nombre (Z - A)' },
    { value: 'newest',     label: 'Más recientes' },
    { value: 'price_asc',  label: 'Precio: menor a mayor' },
    { value: 'price_desc', label: 'Precio: mayor a menor' },
  ];

  // Orden alfabético insensible a mayúsculas y tildes (GUADAÑAS, ÁRBOLES...)
  private byName = <T extends { name: string }>(a: T, b: T) =>
    a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });

  sortedCategories = computed(() => [...this.categories()].sort(this.byName));
  sortedBrands     = computed(() => [...this.brands()].sort(this.byName));

  // Buscadores dentro del panel: 29 categorías y 44 marcas son demasiadas
  // para recorrer a ojo (llegar a DUCATI exigía pasar por 10 marcas antes).
  catQuery   = signal('');
  brandQuery = signal('');

  private matches = (name: string, q: string) =>
    name.localeCompare(q, 'es', { sensitivity: 'base' }) === 0 ||
    name.toLocaleLowerCase('es').normalize('NFD').replace(/\p{Diacritic}/gu, '')
        .includes(q.toLocaleLowerCase('es').normalize('NFD').replace(/\p{Diacritic}/gu, ''));

  visibleCategories = computed(() => {
    const q = this.catQuery().trim();
    return q ? this.sortedCategories().filter(c => this.matches(c.name, q)) : this.sortedCategories();
  });

  visibleBrands = computed(() => {
    const q = this.brandQuery().trim();
    return q ? this.sortedBrands().filter(b => this.matches(b.name, q)) : this.sortedBrands();
  });

  /** Las marcas con más equipos, fijadas arriba para no castigar a STIHL por empezar por S. */
  pinnedBrands = computed(() =>
    [...this.brands()]
      .filter(b => (b.products_count ?? 0) > 0)
      .sort((a, b) => (b.products_count ?? 0) - (a.products_count ?? 0))
      .slice(0, 5));

  total       = computed(() => this.pagination().total ?? this.products().length);
  hasMore     = computed(() => this.products().length < this.total());
  filterCount = computed(() =>
    this.selectedCategories().length + this.selectedBrands().length + (this.onlyAvailable() ? 1 : 0));

  private state = inject(CatalogStateService);
  cart          = inject(CartService);

  // Ids agregados hace un instante, para confirmar en la propia tarjeta
  justAdded = signal<number[]>([]);

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  /** Identifica un conjunto de filtros: si cambia, hay que pedir de nuevo. */
  private stateKey(): string {
    return JSON.stringify([
      this.selectedCategories(), this.selectedBrands(),
      this.onlyAvailable(), this.searchTerm, this.sort,
    ]);
  }

  ngOnInit() {
    this.productService.getCategories().subscribe(c => this.categories.set(c));
    this.productService.getBrands().subscribe(b => this.brands.set(b));
    this.route.queryParams.subscribe(params => {
      this.selectedCategories.set(this.parseList(params['category']));
      this.selectedBrands.set(this.parseList(params['brand']));
      this.onlyAvailable.set(params['disponibles'] === '1');
      this.searchTerm = params['search'] || '';
      this.sort       = params['sort'] || 'name_asc';

      // Al volver de una ficha con los mismos filtros, se recupera lo que ya
      // estaba cargado en vez de rehacer la primera petición.
      const snap = this.state.restore(this.stateKey());
      if (snap) {
        this.products.set(snap.products);
        this.pagination.set(snap.pagination);
        this.currentPage = snap.page;
        this.loading.set(false);
        // Esperar al render para devolver el scroll a donde estaba
        setTimeout(() => window.scrollTo({ top: snap.scrollY, behavior: 'auto' }), 0);
        return;
      }

      this.currentPage = 1;
      this.loadProducts();
    });
  }

  private parseList(raw: string | undefined): string[] {
    return (raw || '').split(',').map(s => s.trim()).filter(Boolean);
  }

  private queryFor(page: number) {
    return {
      category: this.selectedCategories().join(',') || undefined,
      brand:    this.selectedBrands().join(',') || undefined,
      status:   this.onlyAvailable() ? 'available' : undefined,
      search:   this.searchTerm || undefined,
      sort:     this.sort,
      page,
      perPage:  PER_PAGE,
    };
  }

  loadProducts() {
    this.loading.set(true);
    this.currentPage = 1;
    this.productService.getProducts(this.queryFor(1)).subscribe(res => {
      this.products.set(res.data);
      this.pagination.set(res);
      this.loading.set(false);
    });
  }

  // Añade la siguiente tanda al listado actual en vez de reemplazarlo
  loadMore() {
    if (this.loadingMore() || !this.hasMore()) return;
    this.loadingMore.set(true);
    const next = this.currentPage + 1;
    this.productService.getProducts(this.queryFor(next)).subscribe({
      next: res => {
        this.currentPage = next;
        this.products.update(list => [...list, ...res.data]);
        this.pagination.set(res);
        this.loadingMore.set(false);
      },
      error: () => this.loadingMore.set(false),
    });
  }

  toggleCategory(slug: string) {
    this.selectedCategories.update(list =>
      list.includes(slug) ? list.filter(s => s !== slug) : [...list, slug]);
    this.applyFilters();
  }

  toggleBrand(slug: string) {
    this.selectedBrands.update(list =>
      list.includes(slug) ? list.filter(s => s !== slug) : [...list, slug]);
    this.applyFilters();
  }

  toggleAvailable() {
    this.onlyAvailable.update(v => !v);
    this.applyFilters();
  }

  applyFilters() {
    this.router.navigate([], { queryParams: {
      category:    this.selectedCategories().join(',') || null,
      brand:       this.selectedBrands().join(',') || null,
      disponibles: this.onlyAvailable() ? '1' : null,
      search:      this.searchTerm || null,
      sort:        this.sort === 'name_asc' ? null : this.sort,
    }, queryParamsHandling: 'merge' });
  }

  clearFilters() {
    this.state.clear();
    this.searchTerm = '';
    this.selectedCategories.set([]);
    this.selectedBrands.set([]);
    this.onlyAvailable.set(false);
    this.sort = 'name_asc';
    this.router.navigate(['/catalogo']);
  }

  /**
   * Agrega sin salir del catálogo ni abrir el cajón: quien cotiza varios
   * equipos los va marcando y sigue navegando.
   */
  addToCart(product: Product, ev: Event) {
    ev.preventDefault();
    ev.stopPropagation();
    this.cart.add(product, false);
    this.justAdded.update(ids => [...ids, product.id]);
    setTimeout(() => this.justAdded.update(ids => ids.filter(i => i !== product.id)), 1800);
  }

  wasAdded(id: number) { return this.justAdded().includes(id); }

  inCart(id: number) { return this.cart.items().some(i => i.id === id); }

  ngOnDestroy() {
    // Se guarda al salir hacia la ficha del producto (o a donde sea)
    this.state.save({
      key:        this.stateKey(),
      products:   this.products(),
      pagination: this.pagination(),
      page:       this.currentPage,
      scrollY:    window.scrollY,
    });
  }

  getCategoryName(slug: string): string {
    return this.categories().find(c => c.slug === slug)?.name || slug;
  }

  getBrandName(slug: string): string {
    return this.brands().find(b => b.slug === slug)?.name || slug;
  }
}

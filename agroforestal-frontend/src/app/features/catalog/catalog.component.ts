import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { Product, Category, Brand, PaginatedResponse } from '../../core/models/product.model';

const PER_PAGE = 24;

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './catalog.component.html',
})
export class CatalogComponent implements OnInit {
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

  total       = computed(() => this.pagination().total ?? this.products().length);
  hasMore     = computed(() => this.products().length < this.total());
  filterCount = computed(() =>
    this.selectedCategories().length + this.selectedBrands().length + (this.onlyAvailable() ? 1 : 0));

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.productService.getCategories().subscribe(c => this.categories.set(c));
    this.productService.getBrands().subscribe(b => this.brands.set(b));
    this.route.queryParams.subscribe(params => {
      this.selectedCategories.set(this.parseList(params['category']));
      this.selectedBrands.set(this.parseList(params['brand']));
      this.onlyAvailable.set(params['disponibles'] === '1');
      this.searchTerm = params['search'] || '';
      this.sort       = params['sort'] || 'name_asc';
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
    this.searchTerm = '';
    this.selectedCategories.set([]);
    this.selectedBrands.set([]);
    this.onlyAvailable.set(false);
    this.sort = 'name_asc';
    this.router.navigate(['/catalogo']);
  }

  getCategoryName(slug: string): string {
    return this.categories().find(c => c.slug === slug)?.name || slug;
  }

  getBrandName(slug: string): string {
    return this.brands().find(b => b.slug === slug)?.name || slug;
  }
}

import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { Product, Category, Brand, PaginatedResponse } from '../../core/models/product.model';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './catalog.component.html',
})
export class CatalogComponent implements OnInit {
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  brands = signal<Brand[]>([]);
  pagination = signal<Partial<PaginatedResponse<any>>>({});
  loading = signal(false);

  searchTerm = '';
  selectedCategory = '';
  selectedBrand = '';
  sort = 'name_asc';
  currentPage = 1;
  filtersOpen = signal(false);

  sortOptions = [
    { value: 'name_asc',   label: 'Nombre (A - Z)' },
    { value: 'name_desc',  label: 'Nombre (Z - A)' },
    { value: 'price_asc',  label: 'Precio: menor a mayor' },
    { value: 'price_desc', label: 'Precio: mayor a menor' },
    { value: 'newest',     label: 'Más recientes' },
  ];

  // Orden alfabético insensible a mayúsculas y tildes (GUADAÑAS, ÁRBOLES...)
  private byName = <T extends { name: string }>(a: T, b: T) =>
    a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });

  sortedCategories = computed(() => [...this.categories()].sort(this.byName));
  sortedBrands     = computed(() => [...this.brands()].sort(this.byName));

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.productService.getCategories().subscribe(c => this.categories.set(c));
    this.productService.getBrands().subscribe(b => this.brands.set(b));
    this.route.queryParams.subscribe(params => {
      this.selectedCategory = params['category'] || '';
      this.selectedBrand    = params['brand'] || '';
      this.searchTerm       = params['search'] || '';
      this.sort             = params['sort'] || 'name_asc';
      this.currentPage      = +(params['page'] || 1);
      this.loadProducts();
    });
  }

  loadProducts() {
    this.loading.set(true);
    this.productService.getProducts({
      category: this.selectedCategory || undefined,
      brand:    this.selectedBrand || undefined,
      search:   this.searchTerm || undefined,
      sort:     this.sort,
      page:     this.currentPage,
    }).subscribe(res => {
      this.products.set(res.data);
      this.pagination.set(res);
      this.loading.set(false);
    });
  }

  applyFilters() {
    this.currentPage = 1;
    this.router.navigate([], { queryParams: {
      category: this.selectedCategory || null,
      brand:    this.selectedBrand || null,
      search:   this.searchTerm || null,
      sort:     this.sort === 'name_asc' ? null : this.sort,
      page:     null,
    }, queryParamsHandling: 'merge' });
  }

  goToPage(page: number) {
    this.router.navigate([], { queryParams: { page }, queryParamsHandling: 'merge' });
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.selectedBrand = '';
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

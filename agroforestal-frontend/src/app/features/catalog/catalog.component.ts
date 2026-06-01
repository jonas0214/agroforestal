import { Component, OnInit, signal } from '@angular/core';
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
  currentPage = 1;
  filtersOpen = signal(false);

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
    this.router.navigate(['/catalogo']);
  }

  getCategoryName(slug: string): string {
    return this.categories().find(c => c.slug === slug)?.name || slug;
  }

  getBrandName(slug: string): string {
    return this.brands().find(b => b.slug === slug)?.name || slug;
  }
}

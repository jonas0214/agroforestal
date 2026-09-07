import { Component, OnInit, OnDestroy, signal, computed, inject, PLATFORM_ID, AfterViewInit, effect } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { ProductService } from '../../core/services/product.service';
import { SettingsService } from '../../core/services/settings.service';
import { CartService } from '../../core/services/cart.service';
import { Product, Brand } from '../../core/models/product.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  private productService = inject(ProductService);
  private platformId     = inject(PLATFORM_ID);
  private router         = inject(Router);
  settingsService        = inject(SettingsService);
  cart                   = inject(CartService);

  featuredProducts = signal<Product[]>([]);

  /**
   * La vitrina se organiza por TRABAJO, no por categoría de bodega.
   * Un cliente no busca "fumigadoras estacionarias": busca fumigar.
   * Cada trabajo agrupa varias categorías y enlaza al catálogo ya filtrado
   * con todas ellas (el catálogo acepta varios slugs separados por coma).
   */
  readonly jobs: { name: string; hint: string; cats: string[] }[] = [
    { name: 'Fumigar y proteger',   hint: 'De espalda, de batería y estacionarias',
      cats: ['fumigadoras', 'fumigadoras-de-bateria', 'fumigadoras-estacionarias', 'insufladora'] },
    { name: 'Bombear y regar',      hint: 'Motobombas, bombas eléctricas y presión',
      cats: ['motobombas', 'bombas-electricas', 'sistemas-de-presion', 'mangueras', 'accesorios-para-bombas'] },
    { name: 'Desmalezar y podar',   hint: 'Guadañas, multifuncionales y cortacésped',
      cats: ['guadanas', 'guadanas-multifuncionales', 'cortacesped'] },
    { name: 'Limpiar y soplar',     hint: 'Hidrolavadoras y sopladoras',
      cats: ['hidrolavadoras', 'sopladoras', 'sopladoras-a-bateria', 'sopladoras-electricas'] },
    { name: 'Cortar y talar',       hint: 'Motosierras, podadoras de altura y cortasetos',
      cats: ['motosierras', 'podadoras-de-altura', 'cortasetos', 'triturador-de-residuos-organicos-chipeadoras'] },
    { name: 'Procesar la cosecha',  hint: 'Picapastos, despulpadoras y molinos',
      cats: ['picapastos', 'despulpadoras-de-cafe', 'molino-triturador'] },
    { name: 'Energía y motores',    hint: 'Plantas eléctricas y motores',
      cats: ['plantas-electricas', 'motores-a-gasolina-o-diesel', 'motores-electricos'] },
    { name: 'Preparar la tierra',   hint: 'Motoazadas, motocultores y hoyadoras',
      cats: ['motoazadas-y-motocultores', 'hoyadoras'] },
    { name: 'Herramienta y repuestos', hint: 'Herramienta manual y repuestos',
      cats: ['herramientas', 'repuestos'] },
  ];

  jobTiles = signal<{ name: string; hint: string; cats: string[]; count: number; image: string | null }[]>([]);
  brands   = signal<Brand[]>([]);

  // Atajos para el cliente que ya sabe la marca que quiere
  topBrands = computed(() =>
    [...this.brands()]
      .filter(b => b.products_count === undefined || b.products_count > 0)
      .sort((a, b) => (b.products_count ?? 0) - (a.products_count ?? 0))
      .slice(0, 8));

  // Buscador de la vitrina
  query         = '';
  results       = signal<Product[]>([]);
  searching     = signal(false);
  searchFocused = signal(false);
  private search$ = new Subject<string>();
  activeSection    = signal(0);
  swiperInstance: any = null;
  swiperReady      = false;
  private observer: IntersectionObserver | null = null;

  // Vacío hasta que el API responda — evita flash de imágenes de fallback
  heroSlides: { bg: string; label: string }[] = [];

  marqueeBrands = [
    'STIHL', 'Honda', 'Husqvarna', 'Kawasaki', 'Briggs & Stratton', 'Toyama', 'Makita',
    'STIHL', 'Honda', 'Husqvarna', 'Kawasaki', 'Briggs & Stratton', 'Toyama', 'Makita',
  ];

  navSections = [
    { id: 'sec-hero',       label: 'Inicio',     dark: true  },
    { id: 'sec-categorias', label: 'Categorías', dark: false },
    { id: 'sec-productos',  label: 'Productos',  dark: false },
    { id: 'sec-servicios', label: 'Servicios', dark: true  },
    { id: 'sec-marcas',    label: 'Marcas',    dark: false },
    { id: 'sec-feed',      label: 'Síguenos',  dark: true  },
    { id: 'sec-cta',       label: 'Contacto',  dark: true  },
  ];

  services = [
    { icon: '⚙️', title: 'Mantenimiento', desc: 'Mantenimiento preventivo y correctivo de equipos agrícolas con técnicos certificados.' },
    { icon: '🔧', title: 'Reparación',    desc: 'Reparación especializada con repuestos originales directamente del fabricante.' },
    { icon: '🔍', title: 'Diagnóstico',   desc: 'Diagnóstico preciso de fallas con equipos de última tecnología.' },
  ];

  stats = [
    { value: '47+',  label: 'Años de experiencia' },
    { value: '500+', label: 'Productos disponibles' },
    { value: '10K+', label: 'Clientes satisfechos' },
    { value: '5★',   label: 'Calidad garantizada' },
  ];

  constructor() {
    this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        this.searching.set(true);
        return this.productService.getProducts({ search: term, perPage: 6 });
      }),
    ).subscribe(res => {
      this.results.set(res.data);
      this.searching.set(false);
    });

    // Reactivo: cuando settings carguen del API, actualiza slides y reinicia Swiper
    effect(() => {
      const images = this.settingsService.heroImages();
      if (images.length === 0) return;

      this.heroSlides = images.map(url => ({ bg: url, label: '' }));

      if (!isPlatformBrowser(this.platformId)) return;

      // Si Swiper ya estaba inicializado, destruirlo y recrear con las nuevas imágenes
      if (this.swiperReady) {
        this.swiperInstance?.destroy(true, true);
        this.swiperInstance = null;
        this.swiperReady = false;
        setTimeout(() => this.initSwiper(), 80);
      }
    });
  }

  ngOnInit() {
    this.productService.getProducts({ featured: true }).subscribe(res => {
      this.featuredProducts.set(res.data.slice(0, 6));
    });
    this.productService.getBrands().subscribe(b => this.brands.set(b));

    // Vitrina por trabajo: el conteo sale de sumar las categorías de cada grupo
    // (sin peticiones extra) y la foto, de un producto representativo.
    this.productService.getCategories().subscribe(cats => {
      const countBySlug = new Map(cats.map(c => [c.slug, c.products_count ?? 0]));
      const tiles = this.jobs
        .map(job => ({
          ...job,
          count: job.cats.reduce((sum, slug) => sum + (countBySlug.get(slug) ?? 0), 0),
          image: null as string | null,
        }))
        .filter(t => t.count > 0)
        .sort((a, b) => b.count - a.count);
      this.jobTiles.set(tiles);

      // La foto sale de la categoría PRINCIPAL del grupo (la primera declarada),
      // no del conjunto: si no, "Cortar y talar" acaba mostrando una trituradora
      // en vez de una motosierra, por puro orden alfabético.
      tiles.forEach((tile, i) => {
        this.productService.getProducts({ category: tile.cats[0], perPage: 1 })
          .subscribe(res => {
            const img = res.data[0]?.cover_image;
            if (!img) return;
            this.jobTiles.update(list => list.map((t, idx) => idx === i ? { ...t, image: img } : t));
          });
      });
    });
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.initSwiper(), 150);
      this.initSectionObserver();
    }
  }

  onSearch(term: string) {
    this.searchFocused.set(true);
    if (term.trim().length < 2) { this.results.set([]); return; }
    this.search$.next(term.trim());
  }

  // Enter sin elegir sugerencia: al catálogo con el término
  submitSearch() {
    const q = this.query.trim();
    if (!q) return;
    this.searchFocused.set(false);
    this.router.navigate(['/catalogo'], { queryParams: { search: q } });
  }

  openProduct(p: Product) {
    this.query = '';
    this.results.set([]);
    this.searchFocused.set(false);
    this.router.navigate(['/catalogo', p.id]);
  }

  scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  addToCart(product: Product, ev: Event) {
    ev.preventDefault();
    ev.stopPropagation();
    this.cart.add(product);
  }

  private async initSwiper() {
    const { Swiper }                           = await import('swiper');
    const { Autoplay, EffectFade, Pagination } = await import('swiper/modules');

    this.swiperInstance = new Swiper('.hero-swiper', {
      modules: [Autoplay, EffectFade, Pagination],
      effect:      'fade',
      fadeEffect:  { crossFade: true },
      loop:        true,
      speed:       1400,
      autoplay:    { delay: 5500, disableOnInteraction: false, pauseOnMouseEnter: true },
      pagination:  { el: '.swiper-pagination', clickable: true, dynamicBullets: true },
    });
    this.swiperReady = true;
  }

  private initSectionObserver() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const idx = this.navSections.findIndex(s => s.id === entry.target.id);
            if (idx !== -1) this.activeSection.set(idx);
          }
        });
      },
      { threshold: 0.35 }
    );

    this.navSections.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) this.observer!.observe(el);
    });
  }

  ngOnDestroy() {
    this.swiperInstance?.destroy(true, true);
    this.observer?.disconnect();
  }
}

import { Component, OnInit, OnDestroy, signal, inject, PLATFORM_ID, AfterViewInit, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { forkJoin } from 'rxjs';
import { ProductService } from '../../core/services/product.service';
import { SettingsService } from '../../core/services/settings.service';
import { Product, Category } from '../../core/models/product.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  private productService = inject(ProductService);
  private platformId     = inject(PLATFORM_ID);
  settingsService        = inject(SettingsService);

  featuredProducts = signal<Product[]>([]);
  categoryCards    = signal<{ cat: Category; image: string | null; count: number }[]>([]);
  activeSection    = signal(0);
  swiperInstance: any = null;
  swiperReady      = false;
  private observer: IntersectionObserver | null = null;

  // Vacío hasta que el API responda — evita flash de imágenes de fallback
  heroSlides: { bg: string; label: string }[] = [];

  brands = ['STIHL', 'Honda', 'Husqvarna', 'Kawasaki', 'Briggs & Stratton', 'Toyama', 'Makita'];

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
    // Carga categorías + un sondeo de productos para imagen y conteo.
    // Solo se muestran categorías con productos (sin tarjetas vacías).
    this.productService.getCategories().subscribe(cats => {
      const top = cats.slice(0, 8);
      if (top.length === 0) return;
      forkJoin(top.map(cat => this.productService.getProducts({ category: cat.slug }))).subscribe(results => {
        const cards = top
          .map((cat, i) => ({
            cat,
            image: cat.image || results[i].data.find(p => p.cover_image)?.cover_image || null,
            count: results[i].total,
          }))
          .filter(c => c.count > 0)
          .slice(0, 6);
        this.categoryCards.set(cards);
      });
    });
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.initSwiper(), 150);
      this.initSectionObserver();
    }
  }

  scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
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

import { Component, OnInit, OnDestroy, signal, computed, effect, inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { SettingsService } from '../../../core/services/settings.service';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './layout.component.html',
})
export class LayoutComponent implements OnInit, OnDestroy {
  auth            = inject(AuthService);
  settingsService = inject(SettingsService);
  cart            = inject(CartService);
  private platformId = inject(PLATFORM_ID);
  private router     = inject(Router);

  // La barra de cotización estorba justo donde se completa la solicitud
  private currentUrl = signal('');
  onQuotePage = () => this.currentUrl().startsWith('/cotizacion');

  mobileOpen     = signal(false);
  showChatBubble = signal(false);
  currentYear    = new Date().getFullYear();

  // Mensaje puntual que pisa al de la página (p. ej. al agregar un equipo)
  private flash        = signal<string | null>(null);
  private hideTimer: any = null;
  private silenceUntil = 0;   // el cliente cerró el globo: no insistir
  private lastCount    = -1;

  /**
   * Estado de la mascota para animarla:
   * 'oculta' antes de la primera entrada, 'sale' mientras se agacha al
   * cambiar de página, 'entra' cuando aparece con rebote.
   */
  mascotState = signal<'oculta' | 'entra' | 'sale'>('oculta');
  private mascotTimer: any = null;

  /** La despide y la hace volver a entrar; se usa en cada cambio de página. */
  private reaparece() {
    clearTimeout(this.mascotTimer);
    if (this.mascotState() === 'oculta') {
      this.mascotTimer = setTimeout(() => this.mascotState.set('entra'), 700);
      return;
    }
    this.showChatBubble.set(false);
    this.mascotState.set('sale');
    this.mascotTimer = setTimeout(() => this.mascotState.set('entra'), 360);
  }

  /**
   * La mascota habla de lo que el cliente está haciendo: no es el mismo
   * mensaje en el catálogo que en una ficha o con equipos ya elegidos.
   */
  chatMessage = computed(() => {
    const puntual = this.flash();
    if (puntual) return puntual;

    const n = this.cart.count();
    if (n > 0) return n === 1
      ? 'Tienes 1 equipo listo. ¿Lo cotizamos?'
      : `Ya llevas ${n} equipos. ¿Los cotizamos?`;

    const url = this.currentUrl();
    if (url.startsWith('/catalogo/'))     return '¿Dudas con este equipo? Pregúntame.';
    if (url.startsWith('/catalogo'))      return '¿No encuentras tu equipo? Yo te ayudo.';
    if (url.startsWith('/servicio-tecnico')) return '¿Tu máquina necesita revisión?';
    if (url.startsWith('/blog'))          return '¿Buscas algo para tu finca?';
    return '¿Te ayudo a cotizar? 👋';
  });

  constructor() {
    // Reacciona al agregar un equipo: felicita y ofrece el siguiente paso
    effect(() => {
      const n = this.cart.count();
      const previo = this.lastCount;
      this.lastCount = n;
      if (previo < 0 || n <= previo) return;      // primera lectura o quitó algo
      this.flash.set(n === 1
        ? '¡Buena elección! Agrega más o cotiza ya.'
        : `Van ${n}. ¿Sigues buscando o cotizamos?`);
      this.saluda(6500, true);                     // aquí sí vale interrumpir
    }, { allowSignalWrites: true });
  }

  /** Muestra el globo un rato y lo esconde solo, para no estorbar. */
  private saluda(ms = 8000, forzar = false) {
    if (!forzar && Date.now() < this.silenceUntil) return;
    this.showChatBubble.set(true);
    clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(() => {
      this.showChatBubble.set(false);
      this.flash.set(null);
    }, ms);
  }

  toggleMenu() { this.mobileOpen.update(v => !v); }
  logout()     { this.auth.logout(); }

  ngOnInit() {
    this.currentUrl.set(this.router.url);
    this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd) {
        this.currentUrl.set(e.urlAfterRedirects);
        if (isPlatformBrowser(this.platformId)) {
          this.reaparece();
          // Nueva página, nuevo mensaje: la mascota comenta dónde está
          setTimeout(() => this.saluda(7000), 2500);
        }
      }
    });

    if (isPlatformBrowser(this.platformId)) {
      this.reaparece();                       // entrada al cargar la página
      setTimeout(() => this.saluda(9000), 4000);
    }
  }

  /** Al pasar el ratón por la mascota, que salude aunque esté en silencio. */
  saludaAhora() { this.saluda(7000, true); }

  dismissChat() {
    this.showChatBubble.set(false);
    this.flash.set(null);
    clearTimeout(this.hideTimer);
    this.silenceUntil = Date.now() + 4 * 60 * 1000;   // cerrado: 4 min en silencio
  }

  ngOnDestroy() {
    clearTimeout(this.hideTimer);
    clearTimeout(this.mascotTimer);
  }

  /**
   * Número de WhatsApp en formato internacional (solo dígitos).
   * Acepta lo que el admin escriba: "300 123 4567", "+57 300 123 4567", etc.
   * Devuelve '' si no hay número configurado — en ese caso el botón no se muestra,
   * en vez de enlazar a un número inexistente.
   */
  whatsappNumber(): string {
    const digits = (this.settingsService.settings().whatsapp || '').replace(/\D/g, '');
    if (digits.length < 7) return '';
    return digits.startsWith('57') ? digits : '57' + digits.replace(/^0+/, '');
  }

  whatsappLink(): string {
    const msg = encodeURIComponent('Hola, vengo de la página web y quiero más información.');
    return `https://wa.me/${this.whatsappNumber()}?text=${msg}`;
  }

  /**
   * La mascota y el botón se muestran siempre. Mientras no haya número
   * configurado en /admin/configuracion, el botón lleva al formulario de
   * cotización en vez de a un wa.me inexistente: es la misma intención y
   * evita repetir el enlace roto que reportó el cliente.
   * Al cargar el número, pasa a ser WhatsApp real sin tocar nada más.
   */
  chatHref(): string {
    return this.whatsappNumber() ? this.whatsappLink() : '/cotizacion';
  }

  chatTarget(): string | null {
    return this.whatsappNumber() ? '_blank' : null;
  }

  chatLabel(): string {
    return this.whatsappNumber() ? 'Escríbenos por WhatsApp' : 'Pídenos tu cotización';
  }

  onChatClick(ev: Event) {
    if (this.whatsappNumber()) return;      // wa.me: que el enlace haga lo suyo
    ev.preventDefault();
    this.showChatBubble.set(false);
    this.router.navigate(['/cotizacion']);
  }
}

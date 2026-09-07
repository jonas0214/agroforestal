import { Component, OnInit, signal, inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
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
export class LayoutComponent implements OnInit {
  auth            = inject(AuthService);
  settingsService = inject(SettingsService);
  cart            = inject(CartService);
  private platformId = inject(PLATFORM_ID);

  mobileOpen     = signal(false);
  showChatBubble = signal(false);
  currentYear    = new Date().getFullYear();

  toggleMenu() { this.mobileOpen.update(v => !v); }
  logout()     { this.auth.logout(); }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // La mascota "saluda" desde el botón de WhatsApp tras unos segundos
      setTimeout(() => { if (this.whatsappNumber()) this.showChatBubble.set(true); }, 4000);
    }
  }

  dismissChat() { this.showChatBubble.set(false); }

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
}

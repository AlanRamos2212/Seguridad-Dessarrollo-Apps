import { Component, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { routes } from '../../app.routes';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, DrawerModule, ButtonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class SidebarComponent {
  visible: boolean = false;
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID); // Necesario para manipular el DOM de forma segura
  sidebarLinks: { path: string, name: string, icon: string }[] = [];

  constructor() {
    const flattened = this.flattenRoutes(routes);
    
    this.sidebarLinks = Array.from(
      new Map(flattened.map(item => [item.path, item])).values()
    );

    // Escuchar cambios de ruta para limpiar el DOM
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.visible = false;
        this.cleanupDOM();
      }
    });
  }

  /**
   * Elimina clases de bloqueo y elementos residuales de PrimeNG
   */
  private cleanupDOM() {
    if (isPlatformBrowser(this.platformId)) {
      // Usamos un pequeño timeout para asegurar que PrimeNG haya terminado su ciclo
      setTimeout(() => {
        document.body.classList.remove('p-overflow-hidden');
        const masks = document.querySelectorAll('.p-drawer-mask, .p-component-overlay');
        masks.forEach(m => m.remove());
      }, 100); 
    }
  }

  private flattenRoutes(routes: any[], parentPath: string = ''): any[] {
    return routes.reduce((acc, route) => {
      if (route.redirectTo !== undefined || route.path === '**') return acc;

      const fullPath = [parentPath, route.path].filter(Boolean).join('/');
      
      if (route.component) {
        acc.push({
          path: '/' + fullPath,
          name: route.data?.label || this.formatName(route.path || parentPath),
          icon: route.data?.icon || 'pi pi-bookmark'
        });
      }

      if (route.children) {
        acc.push(...this.flattenRoutes(route.children, fullPath));
      }

      return acc;
    }, []);
  }

  private formatName(path: string): string {
    const part = path.split('/').pop() || 'Página';
    return part.charAt(0).toUpperCase() + part.slice(1);
  }
}
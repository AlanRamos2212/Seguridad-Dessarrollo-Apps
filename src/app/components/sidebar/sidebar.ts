import { Component, inject, PLATFORM_ID, computed } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { routes } from '../../app.routes';
import { PermissionsService } from '../../core/services/permissions.service';
import { SupabaseService } from '../../core/services/supabase.service';

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
  private platformId = inject(PLATFORM_ID);
  private permissionsService = inject(PermissionsService);
  private supabaseService = inject(SupabaseService);
  // Signal computada para que reaccione a los cambios de permisos
  sidebarLinks = computed(() => {
    const allLinks = this.flattenRoutes(routes);
    return allLinks.filter(link => {
      if (!link.requiredPermission) return true;
      return this.permissionsService.hasPermission(link.requiredPermission);
    });
  });

  constructor() {
    // Cargamos permisos al iniciar
    this.permissionsService.loadFromSession();
  }

  private cleanupDOM() {
    if (isPlatformBrowser(this.platformId)) {
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

    // CAMBIO: Solo agregamos al acumulador si tiene la bandera showInSidebar
    if (route.component && route.data?.showInSidebar) {
      acc.push({
        path: '/' + fullPath,
        name: route.data?.label || this.formatName(route.path || parentPath),
        icon: route.data?.icon || 'pi pi-bookmark',
        requiredPermission: route.data?.requiredPermission
      });
    }

    if (route.children) {
      acc.push(...this.flattenRoutes(route.children, fullPath));
    }

    return acc;
  }, []);
}

  private formatName(path: string): string {
    const part = path.split('/').pop() || 'Pagina';
    return part.charAt(0).toUpperCase() + part.slice(1);
  }

  async logout() {
    if (isPlatformBrowser(this.platformId)) {
      try { await this.supabaseService.logout(); } catch (e) {}
      localStorage.removeItem('user_session');
    }
    this.permissionsService.clear();
    this.visible = false;
    this.cleanupDOM();
    this.router.navigate(['/auth/login']);
  }
}
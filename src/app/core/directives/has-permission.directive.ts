import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect, signal } from '@angular/core';
import { PermissionsService } from '../services/permissions.service';

/**
 * Structural directive to show/hide elements based on user permissions.
 * Usage: *appHasPermission="'tickets:create'"
 */
@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  private permissionsService = inject(PermissionsService);

  private hasView = false;
  private permissionInput = signal<string | undefined>(undefined);

  @Input() set appHasPermission(permission: string) {
    this.permissionInput.set(permission);
  }

  constructor() {
    // We declare the effect in the constructor (valid injection context)
    effect(() => {
      const permission = this.permissionInput();
      if (!permission) return;

      // React to both input changes and global permission state changes
      const hasPerm = this.permissionsService.hasPermission(permission);
      
      if (hasPerm && !this.hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      } else if (!hasPerm && this.hasView) {
        this.viewContainer.clear();
        this.hasView = false;
      }
    });
  }
}

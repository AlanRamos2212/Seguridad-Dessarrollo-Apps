import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// ─── Catalogue of all module permissions ──────────────────────────────────────
export const MODULE_PERMISSIONS: Record<string, { key: string; label: string }[]> = {
    'Dashboard': [
        { key: 'dashboard:view', label: 'Ver Dashboard' },
        { key: 'tickets:create', label: 'Crear Tickets' },
        { key: 'tickets:edit', label: 'Editar Tickets' },
        { key: 'tickets:delete', label: 'Eliminar Tickets' },
    ],
    'Grupos': [
        { key: 'group:view', label: 'Ver Grupos' },
        { key: 'group:add', label: 'Agregar Grupos' },
        { key: 'group:edit', label: 'Editar Grupos' },
        { key: 'group:delete', label: 'Eliminar Grupos' },
    ],
    'Usuarios': [
        { key: 'users:view', label: 'Ver Usuarios' },
        { key: 'users:manage', label: 'Gestionar Usuarios' },
        { key: 'users:delete', label: 'Eliminar Usuarios' },
    ],
    'Perfil': [
        { key: 'profile:view', label: 'Ver Perfil' },
        { key: 'profile:edit', label: 'Editar Perfil' },
    ],
};

// Flat list for convenience
export const ALL_PERMISSIONS = Object.values(MODULE_PERMISSIONS).flat();

// ─── Service ──────────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class PermissionsService {
    private _permissions = signal<string[]>([]);
    private platformId = inject(PLATFORM_ID);

    /** Reactive list of active permissions */
    readonly permissions = this._permissions.asReadonly();

    /** True when the user has the wildcard (`*`) permission */
    readonly isSuperAdmin = computed(() => this._permissions().includes('*'));

    /** Load permissions from the active user_session in localStorage */
    loadFromSession(): void {
        if (!isPlatformBrowser(this.platformId)) return;
        try {
            const raw = localStorage.getItem('user_session');
            if (!raw) return;
            const session = JSON.parse(raw);
            const perms = session?.permisos ? JSON.parse(session.permisos) : [];
            this._permissions.set(Array.isArray(perms) ? perms : []);
        } catch {
            this._permissions.set([]);
        }
    }

    /** Check whether the current user has a specific permission (or is SuperAdmin) */
    hasPermission(perm: string): boolean {
        const perms = this._permissions();
        return perms.includes('*') || perms.includes(perm);
    }

    /** 
     * Refresh permissions based on a specific group context.
     * In a real scenario, this might trigger an HTTP call to fetch permssions for that group.
     */
    refreshPermissionsForGroup(groupId: string): void {
        console.log(`[Security] Refreshing permissions for group: ${groupId}`);
        // For now, we simulate a refresh by reloading from session or keeping current ones
        // but this is the hook for future API calls per group.
        this.loadFromSession(); 
    }

    /** Replace the permission set (used by SuperAdmin CRUD when saving a user) */
    setPermissions(perms: string[]): void {
        this._permissions.set(perms);
        // Persists back to the current session
        if (isPlatformBrowser(this.platformId)) {
            const raw = localStorage.getItem('user_session');
            if (raw) {
                const session = JSON.parse(raw);
                session.permisos = JSON.stringify(perms);
                localStorage.setItem('user_session', JSON.stringify(session));
            }
        }
    }

    /** Clear permissions (used on logout) */
    clear(): void {
        this._permissions.set([]);
    }
}

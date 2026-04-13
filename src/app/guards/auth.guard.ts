import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

export const AuthGuard: CanActivateFn = () => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID); // Detecta si es servidor o navegador

  // Si estamos en el servidor, dejamos pasar (el navegador hará la validación real después)
  if (!isPlatformBrowser(platformId)) {
    return true; 
  }

  // Ahora sí es seguro usar localStorage porque estamos en el cliente
  // Verificamos tanto la sesión de usuario como el token JWT
  const session = localStorage.getItem('user_session');
  const token = localStorage.getItem('supabase_token');

  if (session && token) {
    return true;
  }

  // Si falta algo, al login y limpiamos por seguridad
  localStorage.removeItem('user_session');
  localStorage.removeItem('supabase_token');

  router.navigate(['/auth/login']);
  return false;
};
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  
  const platformId = inject(PLATFORM_ID);
  
  // 1. Obtener el token de localStorage (solo en el navegador)
  const token = isPlatformBrowser(platformId) ? localStorage.getItem('supabase_token') : null;

  let authReq = req;
  
  // 2. Si hay token, lo inyectamos en la cabecera AUTHORIZATION
  if (token) {
    console.log(`[Interceptor] Adjuntando token en request: ${req.url}`);
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  } else {
    console.warn(`[Interceptor] No hay token para la petición: ${req.url}`);
  }

  // 3. Manejo global de respuestas y errores
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      
      // Error 401/403: No autorizado o sesión expirada
      if (error.status === 401 || error.status === 403) {
        console.warn('⚠️ Acceso denegado o sesión expirada. Redirigiendo a Login...');
        if (isPlatformBrowser(platformId)) {
          localStorage.removeItem('supabase_token');
        }
        router.navigate(['/auth/login']);
      }

      // Error 429: Rate Limit excedido
      if (error.status === 429) {
        alert('🛑 Demasiadas peticiones. Por favor, espera un momento.');
      }

      return throwError(() => error);
    })
  );
};

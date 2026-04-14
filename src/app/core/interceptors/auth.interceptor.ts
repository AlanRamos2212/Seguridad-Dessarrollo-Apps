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
      
      // Error 401: No autenticado o sesión expirada (Token inválido/missing)
      if (error.status === 401) {
        console.warn('⚠️ Sesión expirada o no válida. Redirigiendo a Login...');
        if (isPlatformBrowser(platformId)) {
          localStorage.removeItem('supabase_token');
          localStorage.removeItem('user_session'); // Limpiar la sesión persistente también
        }
        router.navigate(['/auth/login']);
      }

      // Error 403: Prohibido (Falta de permisos)
      if (error.status === 403) {
        console.warn('⚠️ Acceso denegado: El usuario no tiene permisos suficientes para realizar esta acción.');
        // No redirigimos ni borramos tokens porque la sesión sigue siendo válida.
        // Dejamos que el controlador (componente) maneje el error y muestre un Toast.
      }

      // Error 429: Rate Limit excedido
      if (error.status === 429) {
        alert('🛑 Demasiadas peticiones. Por favor, espera un momento.');
      }

      return throwError(() => error);
    })
  );
};

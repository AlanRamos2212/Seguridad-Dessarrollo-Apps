import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';

// Importaciones de PrimeNG
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura'; 

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(), // Proporciona animaciones de forma más ligera
    providePrimeNG({ 
        theme: {
            preset: Aura // Esto define el look & feel de tus inputs y botones
        }
    })
  ]
};
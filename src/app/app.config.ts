import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'; // Recomendado sobre provideAnimations
import { routes } from './app.routes';

// Importaciones de PrimeNG
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura'; 

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(), // Proporciona animaciones de forma más ligera
    providePrimeNG({ 
        theme: {
            preset: Aura // Esto define el look & feel de tus inputs y botones
        }
    })
  ]
};
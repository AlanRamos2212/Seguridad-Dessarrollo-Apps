import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing';
import { LoginComponent } from './pages/auth/login/login';
import { RegisterComponent } from './pages/auth/register/register';

export const routes: Routes = [
  // Página inicial (Login)
  { path: '', component: LandingComponent }, 

  // Agrupación de Autenticación
  { 
    path: 'auth', 
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent }
    ]
  },

  { path: 'landing', component: LandingComponent },

  // Comodín para rutas no encontradas (404)
  { path: '**', redirectTo: '' }
];
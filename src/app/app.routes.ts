import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { LandingComponent } from './pages/landing/landing';
import { LoginComponent } from './pages/auth/login/login';
import { RegisterComponent } from './pages/auth/register/register';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { HomeComponent } from './pages/home/home';
import { GroupComponent } from './pages/group/group';
import { UserComponent } from './pages/user/user';

export type { Routes };

export const routes: Routes = [
  { path: '', redirectTo: 'landing', pathMatch: 'full' },
  { 
    path: 'landing', 
    component: LandingComponent, 
    data: { label: 'Inicio', icon: 'pi pi-home' } 
  },
  { 
    path: 'auth/login', 
    component: LoginComponent, 
    data: { label: 'Login', icon: 'pi pi-sign-in' } 
  },
  { 
    path: 'auth/register', 
    component: RegisterComponent, 
    data: { label: 'Registro', icon: 'pi pi-user-plus' } 
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'home', component: HomeComponent, data: { label: 'Dashboard', icon: 'pi pi-chart-bar' } },
      { path: 'group', component: GroupComponent, data: { label: 'Grupos', icon: 'pi pi-users' } },
      { path: 'user', component: UserComponent, data: { label: 'Usuarios', icon: 'pi pi-user' } },
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'auth/login' }
];
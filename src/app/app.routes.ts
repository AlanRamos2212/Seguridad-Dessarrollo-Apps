import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { LandingComponent } from './pages/landing/landing';
import { LoginComponent } from './pages/auth/login/login';
import { RegisterComponent } from './pages/auth/register/register';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { HomeComponent } from './pages/home/home';
import { GroupComponent } from './pages/group/group';
import { UserComponent } from './pages/user/user';
import { AdminUsers } from './pages/admin-users/admin-users';

export type { Routes };

export const routes: Routes = [
  { path: '', redirectTo: 'landing', pathMatch: 'full' },
  {
    path: 'landing',
    component: LandingComponent,
    data: { label: 'Inicio', icon: 'pi pi-home' } // Sin marca = No sale
  },
  {
    path: 'auth/login',
    component: LoginComponent,
    // Eliminamos label para limpiar
  },
  {
    path: 'auth/register',
    component: RegisterComponent,
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { 
        path: 'home', 
        component: HomeComponent, 
        data: { label: 'Dashboard', icon: 'pi pi-chart-bar', showInSidebar: true } // <--- MARCA
      },
      { 
        path: 'group', 
        component: GroupComponent, 
        data: { label: 'Grupos', icon: 'pi pi-users', requiredPermission: 'group:view', showInSidebar: true } // <--- MARCA
      },
      { 
        path: 'user', 
        component: UserComponent, 
        data: { label: 'Mi perfil', icon: 'pi pi-user', showInSidebar: true } // <--- MARCA
      },
      { 
        path: 'admin-users', 
        component: AdminUsers, 
        data: { label: 'Gestión Usuarios', icon: 'pi pi-shield', requiredPermission: 'users:manage', showInSidebar: true } // <--- MARCA
      },
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'auth/login' }
];
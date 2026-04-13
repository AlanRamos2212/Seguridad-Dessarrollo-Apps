import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { PasswordModule } from 'primeng/password';
import { IftaLabelModule } from 'primeng/iftalabel';
import { CheckboxModule } from 'primeng/checkbox';
import { PermissionsService } from '../../../core/services/permissions.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    InputTextModule, ButtonModule, RippleModule,
    MessageModule, ToastModule, IconFieldModule, InputIconModule,
    PasswordModule, IftaLabelModule, CheckboxModule
  ],
  providers: [MessageService],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  loginForm!: FormGroup;

  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private router = inject(Router);
  private permissionsService = inject(PermissionsService);
  private authService = inject(AuthService);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  async onLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const credentials = this.loginForm.value;

    try {
      // 1. Iniciar sesión a través del Gateway
      const response = await this.authService.login(credentials);

      if (response.statusCode === 200 && response.data && response.data[0]) {
        const authData = response.data[0];
        
        // 2. Cargamos los permisos (vienen dentro del objeto user)
        const userPermissions = authData.user?.permisos || [];
        
        // 3. Crear sesión local para compatibilidad UI
        const session = {
          id: authData.user.id,
          email: authData.user.email,
          nombre: authData.user?.nombre_completo || 'Usuario',
          permisos: JSON.stringify(userPermissions)
        };

        localStorage.setItem('user_session', JSON.stringify(session));
        this.permissionsService.loadFromSession();

        this.messageService.add({
          severity: 'success',
          summary: '¡Bienvenido!',
          detail: `Hola ${session.nombre}. Acceso concedido.`
        });
        
        setTimeout(() => this.router.navigate(['/home']), 1000);
      }
    } catch (error: any) {
      console.error('Error en Login:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error de Acceso',
        detail: error.error?.data?.[0]?.message || 'Credenciales inválidas o error de servidor.'
      });
    }
  }
}

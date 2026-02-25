import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router'; // Importamos Router
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// PrimeNG Modules
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    RippleModule,
    MessageModule,
    ToastModule,
    IconFieldModule,
    InputIconModule
  ],
  providers: [MessageService],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  loginForm!: FormGroup; 
  
  // Credenciales para la práctica
  private readonly USER_VALID = 'admin@correo.com';
  private readonly PASS_VALID = '123456';

  constructor(
    private fb: FormBuilder, 
    private messageService: MessageService,
    private router: Router // Inyectamos el servicio de rutas
  ) {
    this.initForm();
  }

  private initForm() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

onLogin() {
  if (this.loginForm.invalid) {
    this.loginForm.markAllAsTouched();
    return;
  }

  const { email, password } = this.loginForm.value;

  // 1. Intentamos obtener el usuario registrado en LocalStorage
  const savedUserJson = localStorage.getItem('user_session');
  const savedUser = savedUserJson ? JSON.parse(savedUserJson) : null;

  // 2. Validamos contra LocalStorage O contra tus credenciales fijas
  const esUsuarioRegistrado = savedUser && email === savedUser.email && password === savedUser.password;
  const esAdminFijo = email === this.USER_VALID && password === this.PASS_VALID;

  if (esUsuarioRegistrado || esAdminFijo) {
    this.messageService.add({ 
      severity: 'success', 
      summary: '¡Bienvenido!', 
      detail: `Hola ${savedUser?.nombre || 'Admin'}. Redirigiendo...` 
    });
    setTimeout(() => this.router.navigate(['/landing']), 1500);
  } else {
    this.messageService.add({ 
      severity: 'error', 
      summary: 'Acceso Denegado', 
      detail: 'Correo o contraseña incorrectos.' 
    });
  }
}
}
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';

// PrimeNG Modules
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { PasswordModule } from 'primeng/password'; // IMPORTANTE PARA EL OJO
import { MessageService } from 'primeng/api';


@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    RippleModule,
    MessageModule,
    ToastModule,
    IconFieldModule,
    InputIconModule,
    PasswordModule // AGREGADO AQUÍ
  ],
  providers: [MessageService],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {
  registerForm!: FormGroup;

  constructor(
    private fb: FormBuilder, 
    private messageService: MessageService,
    private router: Router
  ) {
    this.initForm();
  }

private initForm() {
  this.registerForm = this.fb.group({
    usuario: ['', [Validators.required, Validators.minLength(4)]],
    email: ['', [Validators.required, Validators.email]],
    nombre: ['', Validators.required],
    direccion: ['', Validators.required],
    telefono: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
    // PASSWORD SIMPLIFICADO: Solo 6 caracteres mínimos, sin símbolos obligatorios
    password: ['', [Validators.required, Validators.minLength(6)]], 
    confirmPassword: ['', Validators.required],
    fechaNacimiento: ['', [Validators.required, this.validarMayoriaEdad]]
  }, { validators: this.passwordMatchValidator });
}

  // Validador personalizado para mayoría de edad
  validarMayoriaEdad(control: AbstractControl) {
    if (!control.value) return null;
    const fechaNac = new Date(control.value);
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mes = hoy.getMonth() - fechaNac.getMonth();
    
    // Ajuste si aún no ha pasado su cumpleaños este año
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
      edad--;
    }
    
    return edad >= 18 ? null : { menorDeEdad: true };
  }

  // Validador para asegurar que las contraseñas coincidan
  passwordMatchValidator(control: AbstractControl) {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    return password && confirmPassword && password.value === confirmPassword.value 
      ? null : { mismatch: true };
  }

  onSubmit() {
    // Si el formulario es inválido, marcamos todo como "tocado" para que se pinte de rojo
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Formulario Inválido', 
        detail: 'Por favor, rellena los campos marcados en rojo correctamente.' 
      });
      return;
    }

    // --- LÓGICA DE PERSISTENCIA (LOCAL STORAGE) ---
    // Extraemos los datos que necesitamos para el Login
    const { email, password, nombre } = this.registerForm.value;
    
    const userSession = {
      email: email,
      password: password,
      nombre: nombre
    };

    // Guardamos en LocalStorage para que el Login lo pueda leer
    localStorage.setItem('user_session', JSON.stringify(userSession));
    // ----------------------------------------------

    this.messageService.add({ 
      severity: 'success', 
      summary: '¡Éxito!', 
      detail: 'Tu cuenta ha sido creada y guardada localmente.' 
    });

    // Redirección al Login después de 2 segundos
    setTimeout(() => {
      this.router.navigate(['/auth/login']);
    }, 2000);
  }
}
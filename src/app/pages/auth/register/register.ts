import { Component, inject } from '@angular/core';
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
import { PasswordModule } from 'primeng/password';
import { DatePickerModule } from 'primeng/datepicker';
import { IftaLabelModule } from 'primeng/iftalabel';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';

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
    PasswordModule,
    DatePickerModule,
    IftaLabelModule
  ],
  providers: [MessageService],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {
  registerForm!: FormGroup;
  private authService = inject(AuthService);

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
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      fechaNacimiento: ['', [Validators.required, this.validarMayoriaEdad]]
    }, { validators: this.passwordMatchValidator });
  }

  validarMayoriaEdad(control: AbstractControl) {
    if (!control.value) return null;
    const fechaNac = new Date(control.value);
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mes = hoy.getMonth() - fechaNac.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
      edad--;
    }

    return edad >= 18 ? null : { menorDeEdad: true };
  }

  passwordMatchValidator(control: AbstractControl) {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    return password && confirmPassword && password.value === confirmPassword.value
      ? null : { mismatch: true };
  }

  async onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.messageService.add({
        severity: 'error',
        summary: 'Formulario Inválido',
        detail: 'Por favor, rellena los campos correctamente.'
      });
      return;
    }

    const { email, password, nombre, direccion, telefono, fechaNacimiento, usuario } = this.registerForm.value;

    try {
      // Registrar usando nuestro nuevo AuthService (Gateway)
      const response = await this.authService.register({
        email,
        password,
        nombre_completo: nombre, // Ajustado al nombre de campo del backend
        username: usuario,       // Ajustado al nombre de campo del backend
        direccion,
        telefono,
        fecha_nacimiento: fechaNacimiento // Ajustado al nombre de campo del backend
      });

      if (response.statusCode === 201) {
        this.messageService.add({
          severity: 'success',
          summary: '¡Cuenta Creada!',
          detail: 'Tu cuenta ha sido registrada con éxito. Ya puedes iniciar sesión.'
        });

        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error en Registro:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error al Registrar',
        detail: error.error?.data?.[0]?.message || 'No se pudo crear la cuenta. Inténtalo de nuevo.'
      });
    }
  }
}
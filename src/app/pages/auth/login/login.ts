import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';



// PrimeNG Modules
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';

@Component({
  selector: 'app-login',
  standalone: true, // Esto es clave en Angular moderno
  imports: [
    CommonModule, 
    RouterLink,
    InputTextModule, // Necesario para pInputText
    ButtonModule,     // Necesario para pButton
    RippleModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  // Aquí irá tu lógica de autenticación
}
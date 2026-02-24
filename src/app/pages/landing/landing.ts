import { Component } from '@angular/core';
import { CustomButtonComponent } from '../../components/custom-button/custom-button'; // 1. Importar clase

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CustomButtonComponent], // 2. Inyectar componente
  templateUrl: './landing.html'
})
export class LandingComponent {}
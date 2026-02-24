import { Component, Input } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';

@Component({
  selector: 'custom-button', // Tu etiqueta personalizada
  standalone: true,
  imports: [ButtonModule, RippleModule],
  template: `
    <p-button 
      [label]="label" 
      [icon]="icon" 
      [raised]="true" 
      severity="primary" />
  `
})
export class CustomButtonComponent {
  @Input() label: string = 'Botón';
  @Input() icon: string = '';
}
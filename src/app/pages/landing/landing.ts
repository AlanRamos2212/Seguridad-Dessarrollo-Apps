import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { RouterModule } from '@angular/router';
import { RippleModule } from 'primeng/ripple';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [ButtonModule, RouterModule, RippleModule],
  templateUrl: './landing.html',
  styleUrl: './landing.css'
})
export class LandingComponent {}
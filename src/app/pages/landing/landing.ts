import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [ButtonModule, RouterModule],
  templateUrl: './landing.html',
  styleUrl: './landing.css'
})
export class LandingComponent {}
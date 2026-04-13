

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule, Router } from '@angular/router';

// PrimeNG
import { SidebarComponent } from '../../components/sidebar/sidebar';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { AvatarModule } from 'primeng/avatar';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    RouterModule, 
    SidebarComponent, 
    ButtonModule, 
    RippleModule,
    AvatarModule
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css'
})
export class MainLayoutComponent {
  sidebarVisible: boolean = false;

  constructor(private router: Router, private supabaseService: SupabaseService) {}

  async logout() {
    try { await this.supabaseService.logout(); } catch(e) {}
    localStorage.removeItem('user_session');
    this.router.navigate(['/auth/login']);
  }
}
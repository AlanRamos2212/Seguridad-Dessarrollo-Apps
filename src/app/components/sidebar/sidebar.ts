import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DrawerModule } from 'primeng/drawer'; // Cambiado de Drawer a DrawerModule
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, DrawerModule, ButtonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'   
})
export class SidebarComponent {
  visible: boolean = false;
}
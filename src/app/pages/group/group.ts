import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-group',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, BadgeModule, TagModule],
  templateUrl: './group.html',
  styleUrl: './group.css'
})
export class GroupComponent {
  // Datos simulados para la "Total N" y la Card Avanzada
  totalMiembros: number = 42;
  nombreGrupo: string = "Desarrolladores Web - Sección A";
  ultimaActividad: string = "Hace 10 minutos";
}
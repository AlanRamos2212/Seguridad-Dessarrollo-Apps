import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { ProgressBarModule } from 'primeng/progressbar';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    ChartModule,
    TableModule,
    ProgressBarModule
  ],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent {

  chartData: any;

  projects = [
    { name: 'Sistema ERP', client: 'Empresa A', status: 'Activo', progress: 80 },
    { name: 'App Móvil', client: 'Startup B', status: 'Pendiente', progress: 45 },
    { name: 'Web Corporativa', client: 'Cliente C', status: 'Activo', progress: 60 }
  ];

  ngOnInit() {
    this.chartData = {
      labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Usuarios',
          data: [50, 70, 65, 90, 120, 128]
        }
      ]
    };
  }
}

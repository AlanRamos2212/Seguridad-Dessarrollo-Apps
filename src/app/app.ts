import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PermissionsService } from './core/services/permissions.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`
})
export class App {
  constructor() {
    // Load permissions from the stored session on every app initialisation
    inject(PermissionsService).loadFromSession();
  }
}
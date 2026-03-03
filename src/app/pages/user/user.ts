import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    CardModule, 
    AvatarModule, 
    ButtonModule, 
    DividerModule, 
    TagModule,
    InputTextModule
  ],
  templateUrl: './user.html',
  styleUrl: './user.css'
})
export class UserComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private fb = inject(FormBuilder);
  
  userData: any = null;
  isEditing: boolean = false;
  userForm!: FormGroup;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const storedSession = localStorage.getItem('user_session');
      if (storedSession) {
        try {
          this.userData = JSON.parse(storedSession);
          this.initForm(this.userData);
        } catch (error) {
          console.error("Error al parsear los datos de sesión:", error);
        }
      }
    }
  }

  initForm(data: any) {
    this.userForm = this.fb.group({
      id: [{ value: data.id || 'N/A', disabled: true }], // El ID no se debería editar
      name: [data.name || '', Validators.required],
      lastname: [data.lastname || ''],
      email: [data.email || '', [Validators.required, Validators.email]],
      direccion: [data.direccion || ''],
      telefono: [data.telefono || ''],
      fechaNacimiento: [data.fechaNacimiento || ''],
      miembroDesde: [{ value: data.miembroDesde || 'Enero 2024', disabled: true }]
    });
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.userForm.reset(this.userData);
    }
  }

  saveChanges() {
    if (this.userForm.valid) {
      // Obtenemos los valores (incluyendo los deshabilitados)
      const updatedData = this.userForm.getRawValue();
      this.userData = { ...this.userData, ...updatedData };
      
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('user_session', JSON.stringify(this.userData));
      }
      
      this.isEditing = false;
    }
  }
}
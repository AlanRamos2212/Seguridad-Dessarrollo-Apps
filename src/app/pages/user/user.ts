import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'; // Importar formularios
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext'; // Necesario para los campos de edición

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
  isEditing: boolean = false; // Estado para alternar vista
  userForm!: FormGroup;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const storedSession = localStorage.getItem('user_session');
      if (storedSession) {
        try {
          this.userData = JSON.parse(storedSession);
        } catch (error) {
          console.error("Error parsing user session data:", error);
        }
      }

      // Asegurar que userData tenga valores predeterminados
      this.userData = {
        name: this.userData?.name || '',
        lastname: this.userData?.lastname || '',
        email: this.userData?.email || '',
        direccion: this.userData?.direccion || '',
        telefono: this.userData?.telefono || '',
        fechaNacimiento: this.userData?.fechaNacimiento || ''
      };

      this.initForm(this.userData); // Inicializar formulario con datos
    }
  }

  // Inicializa el formulario con validaciones básicas
  initForm(data: any) {
    this.userForm = this.fb.group({
      name: [data.name || '', Validators.required],
      lastname: [data.lastname || ''],
      email: [data.email || '', [Validators.required, Validators.email]],
      direccion: [data.direccion || ''],
      telefono: [data.telefono || ''],
      fechaNacimiento: [data.fechaNacimiento || '']
    });
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.userForm.reset(this.userData); // Si cancela, volvemos a los datos originales
    }
  }

  saveChanges() {
    if (this.userForm.valid) {
      // Actualizamos el objeto local
      this.userData = { ...this.userData, ...this.userForm.value };
      
      // Guardamos en LocalStorage para persistencia
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('user_session', JSON.stringify(this.userData));
      }
      
      this.isEditing = false;
      // Aquí podrías llamar a un servicio para guardar en DB
    }
  }
}
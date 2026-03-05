import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, CardModule, AvatarModule,
    ButtonModule, DividerModule, TagModule, InputTextModule,
    ConfirmDialogModule, ToastModule, DialogModule, TooltipModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './user.html',
  styleUrl: './user.css'
})
export class UserComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private fb = inject(FormBuilder);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  userData: any = null;
  displayModal: boolean = false;
  userForm!: FormGroup;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const storedSession = localStorage.getItem('user_session');
      let data = storedSession ? JSON.parse(storedSession) : null;

      // Valores por defecto
      this.userData = {
        id: data?.id || 'ID-999',
        name: data?.name || 'Usuario',
        lastname: data?.lastname || '',
        email: data?.email || 'sin@correo.com',
        direccion: data?.direccion || 'No especificada',
        telefono: data?.telefono || '000-000',
        fechaNacimiento: data?.fechaNacimiento || 'N/A',
        miembroDesde: data?.miembroDesde || 'Enero 2024'
      };

      this.initForm(this.userData);
    }
  }

  initForm(data: any) {
    this.userForm = this.fb.group({
      id: [{ value: data.id, disabled: true }],
      name: [data.name, Validators.required],
      lastname: [data.lastname],
      email: [data.email, [Validators.required, Validators.email]],
      direccion: [data.direccion],
      telefono: [data.telefono],
      fechaNacimiento: [data.fechaNacimiento],
      miembroDesde: [{ value: data.miembroDesde, disabled: true }]
    });
  }

  openModal() {
    this.userForm.patchValue(this.userData);
    this.displayModal = true;
  }

  closeModal() {
    this.displayModal = false;
    this.userForm.reset(this.userData);
  }

  saveChanges() {
    if (this.userForm.valid) {
      const updatedData = this.userForm.getRawValue();
      this.userData = { ...this.userData, ...updatedData };

      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('user_session', JSON.stringify(this.userData));
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Perfil actualizado' });
      }
      this.displayModal = false;
    }
  }

  confirmDelete() {
    this.confirmationService.confirm({
      header: 'Confirmar Eliminación',
      message: '¿Estás seguro de que deseas dar de baja tu cuenta? Esta acción borrará tus datos permanentemente.',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.deleteAccount();
      }
    });
  }

  deleteAccount() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('user_session');
      this.messageService.add({
        severity: 'info',
        summary: 'Cuenta Eliminada',
        detail: 'Redirigiendo al registro...'
      });

      setTimeout(() => {
        this.router.navigate(['/auth/register']);
      }, 2000);
    }
  }
}
import { Component, OnInit, inject, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { ChipModule } from 'primeng/chip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AuthService } from '../../core/services/auth.service';
import { AdminService } from '../../core/services/admin.service';
import { TicketService } from '../../core/services/ticket.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, ButtonModule, InputTextModule,
    ConfirmDialogModule, ToastModule, DialogModule, TooltipModule, 
    MultiSelectModule, TableModule, TagModule, CheckboxModule, SelectModule, ChipModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css',
})
export class AdminUsers implements OnInit {
  private fb = inject(FormBuilder);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private authService = inject(AuthService);
  private adminService = inject(AdminService);
  private ticketService = inject(TicketService);
  private platformId = inject(PLATFORM_ID);

  managedUsers = signal<any[]>([]);
  allGroups = signal<any[]>([]);
  
  displayUserModal = false;
  isEditingUser = false;
  loading = signal(false);

  selectedManagedUser: any = null;

  userCrudForm!: FormGroup;

  ngOnInit() {
    this.initUserCrudForm();
    if (isPlatformBrowser(this.platformId)) {
      this.loadInitialData();
    }
  }

  async loadInitialData() {
    this.loading.set(true);
    try {
      const [usersRes, groupsRes] = await Promise.all([
        this.authService.getUsersAdmin(),
        this.ticketService.getGroups().toPromise()
      ]);

      if (usersRes.data) this.managedUsers.set(usersRes.data);
      if (groupsRes?.data) this.allGroups.set(groupsRes.data);
    } catch (error) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Fallo al cargar datos maestros' });
    } finally {
      this.loading.set(false);
    }
  }

  initUserCrudForm() {
    this.userCrudForm = this.fb.group({
      id: [null],
      nombre_completo: ['', Validators.required],
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      direccion: [''],
      fecha_inicio: [new Date().toISOString().split('T')[0]],
      grupo: [null] // El grupo inicial
    });
  }

  openUserModal(user?: any) {
    this.isEditingUser = !!user;
    this.selectedManagedUser = user || null;
    this.initUserCrudForm(); // Reset form
    
    if (user) {
      this.userCrudForm.patchValue({
        id: user.id,
        nombre_completo: user.nombre_completo,
        username: user.username,
        email: user.email,
        telefono: user.telefono,
        direccion: user.direccion,
        fecha_inicio: user.fecha_inicio,
        password: '' // Clear password field for security/choice
      });
    } else {
      this.userCrudForm.get('password')?.enable();
    }
    this.displayUserModal = true;
  }

  async saveUserCrud() {
    if (this.userCrudForm.invalid && !this.isEditingUser) return;
    
    this.loading.set(true);
    try {
      const rawVal = this.userCrudForm.getRawValue();
      
      const val: any = {};
      Object.keys(rawVal).forEach(key => {
        const itemVal = rawVal[key];
        if (itemVal !== null && itemVal !== undefined && itemVal.toString().trim() !== '') {
          val[key] = itemVal;
        }
      });
      // Asegurar que el id persista
      if (rawVal.id) val.id = rawVal.id;
      
      if (this.isEditingUser) {
        // 1. Actualización de perfil y password vía Auth Service
        const updateData = { ...val };
        // Si el password está vacío, lo removemos para no sobreescribir con nada
        if (!updateData.password) delete updateData.password;
        
        await this.authService.adminUpdateUser(val.id, updateData);

        // 2. Re-asignación de grupo si se seleccionó uno nuevo
        if (val.grupo) {
           const group = this.allGroups().find(g => g.nombre === val.grupo);
           if (group) {
              await this.ticketService.addMember(group.id, val.email).toPromise();
           }
        }
        this.messageService.add({ severity: 'success', summary: 'Sincronizado', detail: 'Ficha de empleado actualizada' });
      } else {
        await this.authService.adminCreateUser(val);
        this.messageService.add({ severity: 'success', summary: 'Usuario Creado', detail: val.nombre_completo });
      }
      
      this.displayUserModal = false;
      await this.loadInitialData();
    } catch (error: any) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.message || 'Error en la operación' });
    } finally {
      this.loading.set(false);
    }
  }

  async deleteUserCrud(user: any) {
    this.confirmationService.confirm({
      header: 'Confirmar Eliminación',
      message: `¿Estás seguro de eliminar a <b>${user.nombre_completo}</b>? Esta acción no se puede deshacer.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar definitivamente',
      rejectLabel: 'Conservar',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-text p-button-sm',
      accept: async () => {
        try {
          await this.authService.deleteUser(user.id);
          this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Usuario removido correctamente' });
          await this.loadInitialData();
        } catch (error) {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar al usuario' });
        }
      }
    });
  }

  async removeGroupFromUser(user: any, groupName: string) {
    const group = this.allGroups().find(g => g.nombre === groupName);
    if (!group) return;

    this.confirmationService.confirm({
      header: 'Quitar rol/grupo',
      message: `¿Remover a <b>${user.nombre_completo}</b> del grupo <b>${groupName}</b>?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Remover',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-text p-button-sm',
      accept: async () => {
        try {
          this.loading.set(true);
          await this.ticketService.removeMember(group.id, user.email).toPromise();
          this.messageService.add({ severity: 'success', summary: 'Removido', detail: `Usuario removido del grupo ${groupName}` });
          await this.loadInitialData();
        } catch (error) {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo remover al usuario del grupo' });
          this.loading.set(false);
        }
      }
    });
  }
}

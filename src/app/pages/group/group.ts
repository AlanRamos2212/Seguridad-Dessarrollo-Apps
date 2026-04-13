import { Component, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { ChipModule } from 'primeng/chip';
import { AdminService } from '../../core/services/admin.service';
import { TicketService } from '../../core/services/ticket.service';
import { PermissionsService } from '../../core/services/permissions.service';
import { HasPermissionDirective } from '../../core/directives/has-permission.directive';
import { Group } from '../../core/models/ticket.model';

@Component({
  selector: 'app-group',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, BadgeModule, TagModule, ToastModule,
    ReactiveFormsModule, FormsModule, DialogModule, TooltipModule, InputNumberModule, InputTextModule,
    CheckboxModule, ChipModule, HasPermissionDirective],
  providers: [MessageService],
  templateUrl: './group.html',
  styleUrl: './group.css'
})
export class GroupComponent implements OnInit {
  private messageService = inject(MessageService);
  private fb = inject(FormBuilder);
  private ticketService = inject(TicketService);
  private router = inject(Router);
  private permissionsService = inject(PermissionsService);
  private adminService = inject(AdminService);
  private platformId = inject(PLATFORM_ID);

  // --- PERMISSION MGMT STATE ---
  allPermissions = signal<any[]>([]);
  groupPermissions = signal<string[]>([]);
  displayRoleModal = false;
  selectedGroup: any = null;
  loading = signal(false);

  permissionSearchTerm: string = '';

  get filteredPermissions(): any[] {
    const term = this.permissionSearchTerm.toLowerCase();
    if (!term) return this.allPermissions();
    return this.allPermissions().filter(p => 
      p.nombre.toLowerCase().includes(term) || 
      p.descripcion.toLowerCase().includes(term)
    );
  }

  getPermissionName(permId: string): string {
    const perm = this.allPermissions().find(p => p.id === permId);
    return perm ? perm.nombre : permId;
  }

  removePermission(permId: string) {
    this.groupPermissions.update(perms => perms.filter(id => id !== permId));
  }

  // Data from Service
  grupos = this.ticketService.groups;
  allTickets = this.ticketService.tickets;

  groupForm: FormGroup<{
    nombre: FormControl<string | null>;
    descripcion: FormControl<string | null>;
  }>;
  displayModal: boolean = false;
  isEditing: boolean = false;
  editingIndex: number | null = null;

  constructor() {
    this.groupForm = this.fb.group({
      nombre: ["", Validators.required],
      descripcion: ["", Validators.required]
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.ticketService.getGroups().subscribe();
      this.ticketService.getTickets().subscribe();
      this.loadAllPermissions();
    }
  }

  async loadAllPermissions() {
    try {
      const res = await this.adminService.getAllPermissions();
      if (res.data) this.allPermissions.set(res.data);
    } catch (error) {
      console.error('Error loading permissions:', error);
    }
  }

  // --- PERMISSIONS ---
  get canAddGroup(): boolean { return this.permissionsService.hasPermission('group:add'); }
  get canEditGroup(): boolean { return this.permissionsService.hasPermission('group:edit'); }
  get canDeleteGroup(): boolean { return this.permissionsService.hasPermission('group:delete'); }

  // --- LOGIC ---
  getTicketsCount(groupId: string): number {
    return this.allTickets().filter(t => t.grupo_id === groupId).length;
  }

  goToDashboard(groupId: string) {
    this.router.navigate(['/home']);
  }

  openModal(editing: boolean, index?: number) {
    if (editing && !this.canEditGroup) return;
    if (!editing && !this.canAddGroup) return;

    this.isEditing = editing;
    this.displayModal = true;

    if (editing && index !== undefined) {
      this.editingIndex = index;
      const grupo = this.grupos()[index];
      this.groupForm.patchValue({
        nombre: grupo.nombre,
        descripcion: grupo.descripcion
      });
    } else {
      this.editingIndex = null;
      this.groupForm.reset();
    }
  }

  closeModal() {
    this.displayModal = false;
    this.groupForm.reset();
  }

  saveGroup() {
    if (this.groupForm.valid) {
      const formValue = this.groupForm.value;
      const groupPayload: Partial<Group> = {
        id: this.isEditing && this.editingIndex !== null ? this.grupos()[this.editingIndex].id : undefined,
        nombre: formValue.nombre ?? '',
        descripcion: formValue.descripcion ?? ''
      };

      this.ticketService.upsertGroup(groupPayload).subscribe({
        next: (res) => {
          this.messageService.add({
            severity: 'success',
            summary: this.isEditing ? 'Grupo Actualizado' : 'Grupo Creado',
            detail: `Éxito con: ${res.data && (res.data as any).nombre ? (res.data as any).nombre : 'Nuevo Grupo'}`
          });
          this.closeModal();
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el grupo' });
        }
      });
    }
  }

  deleteGroup(index: number) {
    if (!this.canDeleteGroup) return;
    const group = this.grupos()[index];
    
    this.ticketService.deleteGroup(group.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'warn', summary: 'Grupo Eliminado', detail: `Se eliminó el grupo: ${group.nombre}` });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el grupo' });
      }
    });
  }

  // --- ROLE MGMT METHODS ---
  async openRoleModal(group: any) {
    this.selectedGroup = group;
    this.loading.set(true);
    try {
      const res = await this.adminService.getGroupPermissions(group.id);
      if (res.data) {
        this.groupPermissions.set(res.data.map((p: any) => p.permiso_id));
      }
      this.displayRoleModal = true;
    } catch (error) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Fallo al cargar permisos del grupo' });
    } finally {
      this.loading.set(false);
    }
  }

  async saveRolePermissions() {
    this.loading.set(true);
    try {
      await this.adminService.updateGroupPermissions(this.selectedGroup.id, this.groupPermissions());
      this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Permisos del grupo actualizados' });
      this.displayRoleModal = false;
    } catch (error) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Fallo al guardar cambios' });
    } finally {
      this.loading.set(false);
    }
  }
}

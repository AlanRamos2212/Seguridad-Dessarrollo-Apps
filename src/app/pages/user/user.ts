import { Component, inject, OnInit, PLATFORM_ID, computed, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
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
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { MultiSelectModule } from 'primeng/multiselect';
import { DatePickerModule } from 'primeng/datepicker';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { TicketService } from '../../core/services/ticket.service';
import { PermissionsService, ALL_PERMISSIONS, MODULE_PERMISSIONS } from '../../core/services/permissions.service';
import { TicketPriority, TicketStatus } from '../../core/models/enums';
import { HasPermissionDirective } from '../../core/directives/has-permission.directive';
import { Ticket } from '../../core/models/ticket.model';
import { TicketCardComponent } from '../../shared/components/ticket-card/ticket-card';
import { SupabaseService } from '../../core/services/supabase.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, CardModule, AvatarModule,
    ButtonModule, DividerModule, TagModule, InputTextModule,
    ConfirmDialogModule, ToastModule, DialogModule, TooltipModule,
    SelectModule, TextareaModule, MultiSelectModule, TicketCardComponent,
    HasPermissionDirective, DatePickerModule
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
  private ticketService = inject(TicketService);
  readonly permissionsService = inject(PermissionsService);
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);

  // Permission helpers
  readonly isSuperAdmin = this.permissionsService.isSuperAdmin;
  readonly modulePermissions = MODULE_PERMISSIONS;
  readonly allPermissions = ALL_PERMISSIONS;

  userData = signal<any>(null);
  displayModal: boolean = false;
  userForm!: FormGroup;
  loading = signal(false);


  // Ticket Detail State
  selectedTicket: Ticket | null = null;
  displayDetailModal: boolean = false;
  isEditing = signal(false);
  newComment = signal('');
  ticketForm!: FormGroup;

  statusOptions = Object.values(TicketStatus);
  priorityOptions = Object.values(TicketPriority);
  users = this.ticketService.users;

  // Computed Signals for User Workload
  userTickets = computed(() => {
    const data = this.userData();
    if (!data || !data.id) return [];
    // Filtramos por ID (UUID) que es lo que viene del backend como asignado_id
    return this.ticketService.tickets().filter(t => t.asignado_id === data.id);
  });

  stats = computed(() => {
    const tickets = this.userTickets();
    return {
      total: tickets.length,
      pendiente: tickets.filter(t => t.estado === TicketStatus.PENDIENTE).length,
      progreso: tickets.filter(t => t.estado === TicketStatus.EN_PROGRESO).length,
      revision: tickets.filter(t => t.estado === TicketStatus.EN_REVISION).length,
      finalizado: tickets.filter(t => t.estado === TicketStatus.FINALIZADA).length
    };
  });

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadProfile();
      this.initTicketForm();
    }
  }

  async loadProfile() {
    try {
      // 1. Intentamos cargar desde localStorage para una respuesta visual instantánea
      const storedSession = localStorage.getItem('user_session');
      if (storedSession) {
        this.syncUserData(JSON.parse(storedSession));
      }

      // 2. Cargamos desde la API para tener la "verdad absoluta" de la BD
      const res = await this.authService.getMe();
      if (res.data) {
        this.syncUserData(res.data);
        // Guardamos la versión fresca para el próximo inicio
        localStorage.setItem('user_session', JSON.stringify(res.data));
      }
    } catch (error) {
      console.error('🔴 Error al cargar el perfil real:', error);
    }
  }

  /**
   * Armoniza los datos del usuario entre versiones de esquema (antiguas y nuevas)
   */
  private syncUserData(data: any) {
    // Si el backend envuelve el objeto en un arreglo (debido a sendResponse), extraemos el primer elemento
    const profile = Array.isArray(data) ? data[0] : data;
    
    console.info('[SYNC DEBUG] Datos recibidos del servidor (limpios):', profile);
    
    const harmonizedData = {
      id: profile?.id || this.userData()?.id || 'ID-999',
      nombre_completo: profile?.nombre_completo || profile?.nombre || profile?.name || 'Usuario',
      email: profile?.email || 'sin@correo.com',
      direccion: profile?.direccion || 'No especificada',
      telefono: profile?.telefono || '0000000000',
      fecha_inicio: profile?.fecha_inicio || profile?.fecha_nacimiento || '',
      miembroDesde: profile?.creado_en 
        ? new Date(profile.creado_en).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
        : 'Enero 2024'
    };

    this.userData.set(harmonizedData);

    if (!this.userForm) {
      this.initForm(harmonizedData);
    } else {
      // Si el formulario ya existe (edición activa), lo actualizamos con los datos reales
      this.userForm.patchValue(harmonizedData, { emitEvent: false });
    }
  }

  initTicketForm() {
    this.ticketForm = this.fb.group({
      id: [null],
      grupo_id: [''],
      titulo: ['', Validators.required],
      descripcion: ['', Validators.required],
      estado: [TicketStatus.PENDIENTE],
      asignado_id: [''],
      prioridad: [TicketPriority.MEDIA],
      fecha_termino: [new Date()]
    });
  }

  initForm(data: any) {
    this.userForm = this.fb.group({
      id: [{ value: data.id, disabled: true }],
      nombre_completo: [data.nombre_completo, Validators.required],
      email: [{ value: data.email, disabled: true }], // Email usually not self-editable for security in this flow
      direccion: [data.direccion],
      telefono: [data.telefono, [Validators.pattern(/^[0-9]{10}$/)]],
      fecha_inicio: [data.fecha_inicio],
      password: [''], // Optional password change
      miembroDesde: [{ value: data.miembroDesde, disabled: true }]
    });
  }

  openModal() {
    const data = this.userData();
    this.userForm.patchValue({
      ...data,
      password: ''
    });
    this.displayModal = true;
  }

  closeModal() {
    this.displayModal = false;
    this.userForm.reset(this.userData());
  }

  async saveChanges() {
    if (this.userForm.valid) {
      this.loading.set(true);
      const rawValues = this.userForm.getRawValue();
      
      // Sanitización rigurosa de datos para el backend
      const updateData: any = {};
      const fields = ['nombre_completo', 'direccion', 'telefono', 'fecha_inicio', 'password'];
      
      fields.forEach(field => {
        const val = rawValues[field];
        if (val && val.toString().trim() !== '') {
          updateData[field] = val;
        }
      });

      try {
        const res = await this.authService.updateMyProfile(updateData);
        
        if (res.data) {
          // Refrescamos TODO desde la API para asegurar sincronización total con el DOM
          await this.loadProfile();
          
          this.messageService.add({ 
            severity: 'success', 
            summary: 'Éxito', 
            detail: 'Perfil sincronizado correctamente con el servidor' 
          });
          this.displayModal = false;
        }
      } catch (error: any) {
        console.error('Error actualizando perfil:', error);
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: error.error?.message || 'No se pudo actualizar el perfil' 
        });
      } finally {
        this.loading.set(false);
      }
    }
  }

  confirmDelete() {
    this.confirmationService.confirm({
      header: 'Confirmar Eliminación',
      message: '¿Estás seguro de que deseas dar de baja tu cuenta?',
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

  async deleteAccount() {
    if (isPlatformBrowser(this.platformId)) {
      try { await this.supabaseService.logout(); } catch(e) {}
      localStorage.removeItem('user_session');
      this.router.navigate(['/auth/login']);
    }
  }

  // --- Ticket Detail Logic ---
  viewTicket(ticket: Ticket) {
    this.selectedTicket = ticket;
    this.isEditing.set(false);
    this.displayDetailModal = true;

    this.ticketForm.patchValue({
      id: ticket.id,
      grupo_id: ticket.grupo_id,
      titulo: ticket.titulo,
      descripcion: ticket.descripcion,
      estado: ticket.estado,
      asignado_id: ticket.asignado_id,
      prioridad: ticket.prioridad,
      fecha_termino: ticket.fecha_termino ? new Date(ticket.fecha_termino) : new Date()
    });
  }

  toggleEdit() {
    this.isEditing.update(v => !v);
  }

  canEditAll(ticket: Ticket | null): boolean {
    const data = this.userData();
    if (!ticket || !data) return false;
    return ticket.creador_id === data.nombre_completo;
  }

  canChangeStatus(ticket: Ticket | null): boolean {
    const data = this.userData();
    if (!ticket || !data) return false;
    return this.canEditAll(ticket) || ticket.asignado_id === data.nombre_completo;
  }

  updateTicket() {
    if (this.ticketForm.valid && this.selectedTicket) {
      const formValue = this.ticketForm.value;
      const updatedTicket: Ticket = {
        ...this.selectedTicket,
        titulo: formValue.titulo ?? this.selectedTicket!.titulo,
        descripcion: formValue.descripcion ?? this.selectedTicket!.descripcion,
        asignado_id: formValue.asignado_id ?? this.selectedTicket!.asignado_id,
        estado: formValue.estado ?? this.selectedTicket!.estado,
        prioridad: formValue.prioridad ?? this.selectedTicket!.prioridad,
        fecha_termino: (formValue.fecha_termino instanceof Date ? formValue.fecha_termino.toISOString() : formValue.fecha_termino) as string | undefined || this.selectedTicket!.fecha_termino,
        historial: [...(this.selectedTicket!.historial || []), `Editado por ${this.userData()?.nombre_completo || 'Usuario'}`]
      };
      this.ticketService.upsertTicket(updatedTicket).subscribe({
        next: () => {
          this.selectedTicket = updatedTicket;
          this.isEditing.set(false);
          this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Ticket actualizado' });
        }
      });
    }
  }

  addComment() {
    const comment = this.newComment();
    if (comment && comment.trim() && this.selectedTicket) {
      const timestamp = new Date().toLocaleString();
      const commentWithUser = `[${timestamp}] ${this.userData()?.nombre_completo || 'Usuario'}: ${comment}`;
      const updatedTicket: Ticket = {
        ...this.selectedTicket!,
        comentarios: [...(this.selectedTicket!.comentarios || []), commentWithUser]
      };
      this.ticketService.upsertTicket(updatedTicket).subscribe({
        next: () => {
          this.selectedTicket = updatedTicket;
          this.newComment.set('');
          this.messageService.add({ severity: 'info', summary: 'Comentario', detail: 'Comentario agregado' });
        }
      });
    }
  }

  getStatusSeverity(estado: TicketStatus | string) {
    switch (estado) {
      case TicketStatus.PENDIENTE: return 'warn';
      case TicketStatus.EN_PROGRESO: return 'info';
      case TicketStatus.EN_REVISION: return 'info';
      case TicketStatus.FINALIZADA: return 'success';
      default: return 'secondary';
    }
  }
}

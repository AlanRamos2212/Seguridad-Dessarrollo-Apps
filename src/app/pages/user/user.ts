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
import { ConfirmationService, MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { TicketService } from '../../core/services/ticket.service';
import { Ticket } from '../../core/models/ticket.model';
import { TicketStatus, TicketPriority } from '../../core/models/enums';
import { TicketCardComponent } from '../../shared/components/ticket-card/ticket-card';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, CardModule, AvatarModule,
    ButtonModule, DividerModule, TagModule, InputTextModule,
    ConfirmDialogModule, ToastModule, DialogModule, TooltipModule,
    SelectModule, TextareaModule, TicketCardComponent
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

  userData: any = null;
  displayModal: boolean = false;
  userForm!: FormGroup;

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
    if (!this.userData) return [];
    return this.ticketService.tickets().filter(t => t.assignedTo === this.userData.name);
  });

  stats = computed(() => {
    const tickets = this.userTickets();
    return {
      total: tickets.length,
      pendiente: tickets.filter(t => t.status === TicketStatus.PENDIENTE).length,
      progreso: tickets.filter(t => t.status === TicketStatus.EN_PROGRESO).length,
      revision: tickets.filter(t => t.status === TicketStatus.EN_REVISION).length,
      finalizado: tickets.filter(t => t.status === TicketStatus.FINALIZADA).length
    };
  });

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
      this.initTicketForm();
    }
  }

  initTicketForm() {
    this.ticketForm = this.fb.group({
      id: [null],
      groupId: [''],
      title: ['', Validators.required],
      description: ['', Validators.required],
      status: [TicketStatus.PENDIENTE],
      assignedTo: [''],
      priority: [TicketPriority.MEDIA],
      dueDate: [new Date()]
    });
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

  // --- Ticket Detail Logic (Mirrored from Home for consistency) ---
  viewTicket(ticket: Ticket) {
    this.selectedTicket = ticket;
    this.isEditing.set(false);
    this.displayDetailModal = true;

    this.ticketForm.patchValue({
      id: ticket.id,
      groupId: ticket.groupId,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      assignedTo: ticket.assignedTo,
      priority: ticket.priority,
      dueDate: new Date(ticket.dueDate)
    });
  }

  toggleEdit() {
    this.isEditing.update(v => !v);
  }

  canEditAll(ticket: Ticket | null): boolean {
    if (!ticket || !this.userData) return false;
    return ticket.createdBy === this.userData.name;
  }

  canChangeStatus(ticket: Ticket | null): boolean {
    if (!ticket || !this.userData) return false;
    return this.canEditAll(ticket) || ticket.assignedTo === this.userData.name;
  }

  updateTicket() {
    if (this.ticketForm.valid && this.selectedTicket) {
      const formValue = this.ticketForm.value;
      const updatedTicket: Ticket = {
        ...this.selectedTicket,
        title: formValue.title ?? this.selectedTicket.title,
        description: formValue.description ?? this.selectedTicket.description,
        assignedTo: formValue.assignedTo ?? this.selectedTicket.assignedTo,
        status: formValue.status ?? this.selectedTicket.status,
        priority: formValue.priority ?? this.selectedTicket.priority,
        dueDate: formValue.dueDate ?? this.selectedTicket.dueDate,
        history: [...this.selectedTicket.history, `Editado por ${this.userData?.name || 'Usuario'}`]
      };
      this.ticketService.upsertTicket(updatedTicket);
      this.selectedTicket = updatedTicket;
      this.isEditing.set(false);
      this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Ticket actualizado con éxito' });
    }
  }

  addComment() {
    const comment = this.newComment();
    if (comment && comment.trim() && this.selectedTicket) {
      const timestamp = new Date().toLocaleString();
      const commentWithUser = `[${timestamp}] ${this.userData?.name || 'Usuario'}: ${comment}`;
      const updatedTicket: Ticket = {
        ...this.selectedTicket,
        comments: [...(this.selectedTicket.comments || []), commentWithUser]
      };
      this.ticketService.upsertTicket(updatedTicket);
      this.selectedTicket = updatedTicket;
      this.newComment.set('');
      this.messageService.add({ severity: 'info', summary: 'Comentario', detail: 'Comentario agregado' });
    }
  }

  getStatusSeverity(status: TicketStatus | string) {
    switch (status) {
      case TicketStatus.PENDIENTE: return 'warn';
      case TicketStatus.EN_PROGRESO: return 'info';
      case TicketStatus.EN_REVISION: return 'info';
      case TicketStatus.FINALIZADA: return 'success';
      default: return 'secondary';
    }
  }
}

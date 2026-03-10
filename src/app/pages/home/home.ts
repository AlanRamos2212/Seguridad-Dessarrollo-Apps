import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CdkDropListGroup, CdkDropList, CdkDrag, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { ProgressBarModule } from 'primeng/progressbar';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { ChipModule } from 'primeng/chip';
import { TooltipModule } from 'primeng/tooltip';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TicketService } from '../../core/services/ticket.service';
import { Ticket, Group } from '../../core/models/ticket.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    ChartModule,
    TableModule,
    ProgressBarModule,
    DialogModule,
    SelectModule,
    InputTextModule,
    TextareaModule,
    TagModule,
    BadgeModule,
    ChipModule,
    TooltipModule,
    ToggleSwitchModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    ConfirmDialogModule,
    ToastModule,
    CdkDropListGroup,
    CdkDropList,
    CdkDrag
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private ticketService = inject(TicketService);
  private fb = inject(FormBuilder);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  userData: any = null;
  groups: Group[] = [];
  tickets: Ticket[] = [];
  filteredTickets: Ticket[] = [];
  activeFilter: 'all' | 'mine' | 'unassigned' | 'high' = 'all';

  viewMode: 'kanban' | 'list' = 'kanban';
  displayTicketModal = false;
  displayDetailModal = false;
  displayMemberModal = false;

  ticketForm: FormGroup;
  memberForm: FormGroup;
  selectedTicket: Ticket | null = null;
  selectedGroupId: string | null = null;

  statusOptions = [
    { label: 'Pendiente', value: 'Pendiente' },
    { label: 'En Progreso', value: 'En Progreso' },
    { label: 'En Revisión', value: 'En Revisión' },
    { label: 'Finalizada', value: 'Finalizada' }
  ];

  priorityOptions = [
    { label: 'Baja', value: 'Baja' },
    { label: 'Media', value: 'Media' },
    { label: 'Alta', value: 'Alta' }
  ];

  stats = {
    total: 0,
    pendiente: 0,
    progreso: 0,
    revision: 0,
    finalizada: 0
  };

  constructor() {
    this.ticketForm = this.fb.group({
      id: [''],
      groupId: ['', Validators.required],
      title: ['', Validators.required],
      description: ['', Validators.required],
      status: ['Pendiente', Validators.required],
      assignedTo: ['', Validators.required],
      priority: ['Media', Validators.required],
      dueDate: [new Date(), Validators.required]
    });

    this.memberForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const storedSession = localStorage.getItem('user_session');
      this.userData = storedSession ? JSON.parse(storedSession) : null;
    }

    this.ticketService.getGroups().subscribe(groups => this.groups = groups);
    this.ticketService.getTickets().subscribe(tickets => {
      this.tickets = tickets;
      this.applyFilter();
      this.calculateStats();
    });
  }

  calculateStats() {
    this.stats = {
      total: this.tickets.length,
      pendiente: this.tickets.filter(t => t.status === 'Pendiente').length,
      progreso: this.tickets.filter(t => t.status === 'En Progreso').length,
      revision: this.tickets.filter(t => t.status === 'En Revisión').length,
      finalizada: this.tickets.filter(t => t.status === 'Finalizada').length
    };
  }

  showCreateTicket(groupId: string) {
    this.ticketForm.reset({
      id: Math.random().toString(36).substr(2, 9),
      groupId: groupId,
      status: 'Pendiente',
      priority: 'Media',
      dueDate: new Date()
    });
    this.displayTicketModal = true;
  }

  saveTicket() {
    if (this.ticketForm.valid) {
      const ticket: Ticket = {
        ...this.ticketForm.value,
        createdAt: new Date(),
        comments: [],
        history: [`Creado por ${this.userData?.nombre || 'Usuario'}`]
      };
      this.ticketService.upsertTicket(ticket);
      this.displayTicketModal = false;
    }
  }

  viewTicket(ticket: Ticket) {
    this.selectedTicket = ticket;
    this.displayDetailModal = true;
  }

  addMember(groupId: string) {
    this.selectedGroupId = groupId;
    this.memberForm.reset();
    this.displayMemberModal = true;
  }

  saveMember() {
    if (this.memberForm.valid && this.selectedGroupId) {
      this.ticketService.addMember(this.selectedGroupId, this.memberForm.value.email);
      this.displayMemberModal = false;
    }
  }

  removeMember(groupId: string, email: string) {
    this.confirmationService.confirm({
      message: `¿Estás seguro de que deseas eliminar a <b>${email}</b> de este equipo de seguridad?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      rejectButtonStyleClass: 'p-button-text',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.ticketService.removeMember(groupId, email);
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Miembro eliminado con éxito' });
      }
    });
  }

  getStatusSeverity(status: string): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined {
    switch (status) {
      case 'Pendiente': return 'warn';
      case 'En Progreso': return 'info';
      case 'En Revisión': return 'secondary';
      case 'Finalizada': return 'success';
      default: return 'info';
    }
  }

  getTicketsByStatus(status: string): Ticket[] {
    return this.filteredTickets.filter(t => t.status === status);
  }

  onDrop(event: CdkDragDrop<Ticket[]>, newStatus: string) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const ticket = event.previousContainer.data[event.previousIndex];
      ticket.status = newStatus as any;
      ticket.history.push(`Estatus cambiado a ${newStatus} por ${this.userData?.nombre || 'Usuario'}`);

      this.ticketService.upsertTicket(ticket);
      // No need to manually transfer as the subscription will refresh
    }
  }

  applyFilter(filter?: 'all' | 'mine' | 'unassigned' | 'high') {
    if (filter) this.activeFilter = filter;

    switch (this.activeFilter) {
      case 'mine':
        this.filteredTickets = this.tickets.filter(t => t.assignedTo === this.userData?.nombre);
        break;
      case 'unassigned':
        this.filteredTickets = this.tickets.filter(t => !t.assignedTo || t.assignedTo === 'Sin asignar');
        break;
      case 'high':
        this.filteredTickets = this.tickets.filter(t => t.priority === 'Alta');
        break;
      default:
        this.filteredTickets = [...this.tickets];
    }
    this.calculateStats();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Pendiente': return '#eab308'; // yellow-500
      case 'En Progreso': return '#60a5fa'; // blue-400
      case 'En Revisión': return '#a855f7'; // purple-500
      case 'Finalizada': return '#22c55e'; // green-500
      default: return '#93c5fd'; // blue-300
    }
  }

  getGroupTickets(groupId: string): Ticket[] {
    return this.tickets.filter(t => t.groupId === groupId);
  }
}

import { Component, inject, OnInit, PLATFORM_ID, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CdkDropListGroup, CdkDropList, CdkDrag, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

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
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';

import { TicketService } from '../../core/services/ticket.service';
import { Ticket, Group } from '../../core/models/ticket.model';
import { TicketStatus, TicketPriority, UserSession } from '../../core/models/enums';
import { TicketCardComponent } from '../../shared/components/ticket-card/ticket-card';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [
        CommonModule, ButtonModule, ChartModule, TableModule, ProgressBarModule, DialogModule,
        SelectModule, InputTextModule, TextareaModule, TagModule, BadgeModule, ChipModule,
        TooltipModule, ToggleSwitchModule, FormsModule, ReactiveFormsModule, RouterLink,
        ConfirmDialogModule, ToastModule, CdkDropListGroup, CdkDropList, CdkDrag, TicketCardComponent
    ],
    providers: [ConfirmationService, MessageService],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './home.html',
    styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit {
    private platformId = inject(PLATFORM_ID);
    private ticketService = inject(TicketService);
    private fb = inject(FormBuilder);
    private confirmationService = inject(ConfirmationService);
    private messageService = inject(MessageService);

    userData: UserSession | null = null;

    // State from Signals
    groups = this.ticketService.groups;
    allTickets = this.ticketService.tickets;
    users = this.ticketService.users;
    activeFilter = signal<'all' | 'mine' | 'unassigned' | 'high'>('all');

    // Computed State
    filteredTickets = computed(() => {
        const filter = this.activeFilter();
        const tickets = this.allTickets();
        if (filter === 'mine') return tickets.filter(t => t.assignedTo === this.userData?.nombre);
        if (filter === 'unassigned') return tickets.filter(t => !t.assignedTo || t.assignedTo === 'Sin asignar');
        if (filter === 'high') return tickets.filter(t => t.priority === TicketPriority.ALTA || t.priority === TicketPriority.MEDIA);
        return tickets;
    });

    stats = computed(() => {
        const tickets = this.allTickets();
        return {
            total: tickets.length,
            pendiente: tickets.filter(t => t.status === TicketStatus.PENDIENTE).length,
            progreso: tickets.filter(t => t.status === TicketStatus.EN_PROGRESO).length,
            revision: tickets.filter(t => t.status === TicketStatus.EN_REVISION).length,
            finalizada: tickets.filter(t => t.status === TicketStatus.FINALIZADA).length
        };
    });

    viewMode = signal<'kanban' | 'list'>('kanban');
    displayTicketModal = false;
    displayDetailModal = false;
    displayMemberModal = false;
    isEditing = signal(false);
    newComment = signal('');

    ticketForm: FormGroup<{
        id: FormControl<string | null>;
        groupId: FormControl<string | null>;
        title: FormControl<string | null>;
        description: FormControl<string | null>;
        status: FormControl<TicketStatus | null>;
        assignedTo: FormControl<string | null>;
        priority: FormControl<TicketPriority | null>;
        dueDate: FormControl<Date | null>;
    }>;

    memberForm: FormGroup<{
        email: FormControl<string | null>;
    }>;
    selectedTicket: Ticket | null = null;
    selectedGroupId: string | null = null;

    TicketStatus = TicketStatus;
    TicketPriority = TicketPriority;

    statusOptions = [
        { label: 'Pendiente', value: TicketStatus.PENDIENTE },
        { label: 'En Progreso', value: TicketStatus.EN_PROGRESO },
        { label: 'En Revisión', value: TicketStatus.EN_REVISION },
        { label: 'Finalizada', value: TicketStatus.FINALIZADA }
    ];

    priorityOptions = [
        { label: 'Alta', value: TicketPriority.ALTA },
        { label: 'Media', value: TicketPriority.MEDIA },
        { label: 'Baja', value: TicketPriority.BAJA }
    ];

    constructor() {
        this.ticketForm = this.fb.group({
            id: [''],
            groupId: ['', Validators.required],
            title: ['', Validators.required],
            description: ['', Validators.required],
            status: [TicketStatus.PENDIENTE, Validators.required],
            assignedTo: ['', Validators.required],
            priority: [TicketPriority.MEDIA, Validators.required],
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
    }

    showCreateTicket(groupId: string) {
        this.ticketForm.reset({
            id: Math.random().toString(36).substr(2, 9),
            groupId: groupId,
            status: TicketStatus.PENDIENTE,
            priority: TicketPriority.MEDIA,
            dueDate: new Date()
        });
        this.displayTicketModal = true;
    }

    saveTicket() {
        if (this.ticketForm.valid) {
            const formValue = this.ticketForm.value;
            const ticket: Ticket = {
                id: formValue.id ?? Math.random().toString(36).substr(2, 9),
                groupId: formValue.groupId ?? '',
                title: formValue.title ?? '',
                description: formValue.description ?? '',
                status: formValue.status ?? TicketStatus.PENDIENTE,
                assignedTo: formValue.assignedTo ?? '',
                priority: formValue.priority ?? TicketPriority.MEDIA,
                dueDate: formValue.dueDate ?? new Date(),
                createdAt: new Date(),
                createdBy: this.userData?.nombre || 'Usuario',
                comments: [],
                history: [`Creado por ${this.userData?.nombre || 'Usuario'}`]
            };
            this.ticketService.upsertTicket(ticket);
            this.displayTicketModal = false;
        }
    }

    viewTicket(ticket: Ticket) {
        this.selectedTicket = ticket;
        this.isEditing.set(false);
        this.displayDetailModal = true;

        // Patch form for editing
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
        return ticket.createdBy === this.userData.nombre;
    }

    canChangeStatus(ticket: Ticket | null): boolean {
        if (!ticket || !this.userData) return false;
        return this.canEditAll(ticket) || ticket.assignedTo === this.userData.nombre;
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
                history: [...this.selectedTicket.history, `Editado por ${this.userData?.nombre || 'Usuario'}`]
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
            const commentWithUser = `[${timestamp}] ${this.userData?.nombre || 'Usuario'}: ${comment}`;
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

    addMember(groupId: string) {
        this.selectedGroupId = groupId;
        this.memberForm.reset();
        this.displayMemberModal = true;
    }

    saveMember() {
        if (this.memberForm.valid && this.selectedGroupId) {
            const email = this.memberForm.value.email;
            if (email) {
                this.ticketService.addMember(this.selectedGroupId, email);
            }
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

    getStatusSeverity(status: TicketStatus): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined {
        switch (status) {
            case TicketStatus.PENDIENTE: return 'warn';
            case TicketStatus.EN_PROGRESO: return 'info';
            case TicketStatus.EN_REVISION: return 'secondary';
            case TicketStatus.FINALIZADA: return 'success';
            default: return 'info';
        }
    }

    getTicketsByStatus(status: TicketStatus | string): Ticket[] {
        return this.filteredTickets().filter(t => t.status === status);
    }

    onDrop(event: CdkDragDrop<Ticket[]>, newStatus: string) {
        if (event.previousContainer === event.container) {
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        } else {
            const ticket = event.previousContainer.data[event.previousIndex];
            const updatedTicket: Ticket = {
                ...ticket,
                status: newStatus as TicketStatus,
                history: [...ticket.history, `Estatus cambiado a ${newStatus} por ${this.userData?.nombre || 'Usuario'}`]
            };
            this.ticketService.upsertTicket(updatedTicket);
        }
    }

    applyFilter(filter: 'all' | 'mine' | 'unassigned' | 'high') {
        this.activeFilter.set(filter);
    }

    getStatusColor(status: TicketStatus | string): string {
        switch (status) {
            case TicketStatus.PENDIENTE: return '#eab308'; // yellow-500
            case TicketStatus.EN_PROGRESO: return '#60a5fa'; // blue-400
            case TicketStatus.EN_REVISION: return '#a855f7'; // purple-500
            case TicketStatus.FINALIZADA: return '#22c55e'; // green-500
            default: return '#93c5fd'; // blue-300
        }
    }

    getGroupTickets(groupId: string): Ticket[] {
        return this.allTickets().filter(t => t.groupId === groupId);
    }
}

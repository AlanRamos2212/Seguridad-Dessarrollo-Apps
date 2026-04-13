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
import { AvatarModule } from 'primeng/avatar';
import { DatePickerModule } from 'primeng/datepicker';

import { TicketService } from '../../core/services/ticket.service';
import { PermissionsService } from '../../core/services/permissions.service';
import { HasPermissionDirective } from '../../core/directives/has-permission.directive';
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
        ConfirmDialogModule, ToastModule, CdkDropListGroup, CdkDropList, CdkDrag,
        TicketCardComponent, HasPermissionDirective, AvatarModule, DatePickerModule
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
    readonly permissionsService = inject(PermissionsService);

    userData: UserSession | null = null;

    // Raw signals
    groups = this.ticketService.groups;
    allTickets = this.ticketService.tickets;
    users = this.ticketService.users;
    activeFilter = signal<'all' | 'mine' | 'unassigned' | 'high'>('all');

    // ── Permission helpers ───────────────────────────────────────────────
    get canCreateTicket(): boolean { return this.permissionsService.hasPermission('tickets:create'); }
    get canDeleteTicket(): boolean { return this.permissionsService.hasPermission('tickets:delete'); }
    get canAddMember(): boolean { return this.permissionsService.hasPermission('group:edit'); }
    get canManageGroups(): boolean { return this.permissionsService.hasPermission('group:view') || this.permissionsService.isSuperAdmin(); }

    // ── Scoped signals: regular users see ONLY their group & assigned tickets
    visibleGroups = computed(() => {
        const all = this.groups();
        if (this.permissionsService.isSuperAdmin() || this.permissionsService.hasPermission('group:view')) return all;
        const userId = this.userData?.id;
        return all.filter(g =>
            (g.usuarios_grupos || []).some((ug: any) => ug.usuario_id === userId)
        );
    });

    // Computed State
    filteredTickets = computed(() => {
        const filter = this.activeFilter();
        const isSuperOrAdmin = this.permissionsService.isSuperAdmin() || this.permissionsService.hasPermission('dashboard:view');
        const userId = this.userData?.id;
        let tickets = this.allTickets();

        if (!isSuperOrAdmin) {
            const myGroupIds = this.visibleGroups().map(g => g.id);
            tickets = tickets.filter(t =>
                myGroupIds.includes(t.grupo_id) ||
                t.asignado_id === userId
            );
        }

        if (filter === 'mine') return tickets.filter(t => t.asignado_id === userId);
        if (filter === 'unassigned') return tickets.filter(t => !t.asignado_id || t.asignado_id === 'Sin asignar');
        if (filter === 'high') return tickets.filter(t => t.prioridad === TicketPriority.ALTA);
        return tickets;
    });

    stats = computed(() => {
        const tickets = this.filteredTickets();
        return {
            total: tickets.length,
            pendiente: tickets.filter(t => t.estado === TicketStatus.PENDIENTE).length,
            progreso: tickets.filter(t => t.estado === TicketStatus.EN_PROGRESO).length,
            revision: tickets.filter(t => t.estado === TicketStatus.EN_REVISION).length,
            finalizada: tickets.filter(t => t.estado === TicketStatus.FINALIZADA).length
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
        grupo_id: FormControl<string | null>;
        titulo: FormControl<string | null>;
        descripcion: FormControl<string | null>;
        estado: FormControl<TicketStatus | null>;
        asignado_id: FormControl<string | null>;
        prioridad: FormControl<TicketPriority | null>;
        fecha_termino: FormControl<Date | null>;
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
            grupo_id: ['', Validators.required],
            titulo: ['', Validators.required],
            descripcion: ['', Validators.required],
            estado: [TicketStatus.PENDIENTE, Validators.required],
            asignado_id: ['', Validators.required],
            prioridad: [TicketPriority.MEDIA, Validators.required],
            fecha_termino: [new Date(), Validators.required]
        });

        this.memberForm = this.fb.group({
            email: ['', [Validators.required]]
        });
    }

    ngOnInit() {
        if (isPlatformBrowser(this.platformId)) {
            console.log('[HomeComponent] Inicializando versión v2.0 - Sincronización Identidad');
            const storedSession = localStorage.getItem('user_session');
            this.userData = storedSession ? JSON.parse(storedSession) : null;
            this.loadDashboardData();
        }
    }

    loadDashboardData() {
        this.ticketService.getGroups().subscribe();
        this.ticketService.getTickets().subscribe();
        this.ticketService.getUsers().subscribe();
        this.ticketService.getCatalogs().subscribe();
    }

    showCreateTicket(groupId: string) {
        this.selectedGroupId = groupId;
        this.ticketForm.reset({
            id: undefined,
            grupo_id: groupId,
            estado: TicketStatus.PENDIENTE,
            prioridad: TicketPriority.MEDIA,
            fecha_termino: new Date()
        });
        this.displayTicketModal = true;
    }

    saveTicket() {
        try {
            if (this.ticketForm.valid) {
                const formValue = this.ticketForm.value;
                const catalogsRaw = this.ticketService.catalogs();
                
                console.log('[HomeComponent] Debug Save - Iniciando guardado.');
                console.log('[HomeComponent] formValue:', formValue);
                console.log('[HomeComponent] catalogsRaw:', catalogsRaw);

                // Blindaje total contra estructuras inesperadas
                const estados = (catalogsRaw && typeof catalogsRaw === 'object' && 'estados' in catalogsRaw) ? (catalogsRaw as any).estados : [];
                const prioridades = (catalogsRaw && typeof catalogsRaw === 'object' && 'prioridades' in catalogsRaw) ? (catalogsRaw as any).prioridades : [];
                
                console.log('[HomeComponent] Listas procesadas:', { estados, prioridades });

                // Buscador inteligente que soporta múltiples nombres de propiedad (nombre, name, label, titulo)
                const findId = (arr: any[], searchVal: string) => {
                    const normalizedSearch = String(searchVal).toUpperCase();
                    return arr.find(item => {
                        const val = item.nombre || item.name || item.label || item.titulo || '';
                        return String(val).toUpperCase() === normalizedSearch;
                    })?.id;
                };

                const estado_id = findId(estados, TicketStatus.PENDIENTE);
                const targetPrioridad = (formValue.prioridad as any)?.value || formValue.prioridad || '';
                const prioridad_id = findId(prioridades, targetPrioridad);

                if (!estado_id || !prioridad_id) {
                    console.error('[HomeComponent] Error: No se encontraron los IDs de catálogo (UUIDs).', { estado_id, prioridad_id });
                    console.log('[HomeComponent] Estados disponibles:', estados.map((e: any) => e.nombre));
                    console.log('[HomeComponent] Prioridades disponibles:', prioridades.map((p: any) => p.nombre));
                    console.log('[HomeComponent] Buscando estado:', TicketStatus.PENDIENTE);
                    console.log('[HomeComponent] Buscando prioridad:', targetPrioridad);

                    this.messageService.add({ 
                        severity: 'warn', 
                        summary: 'Error de Configuración', 
                        detail: 'No se pudieron mapear los estados o prioridades. Revisa la consola para más detalles.' 
                    });
                    return;
                }

                if (!this.selectedGroupId || !this.userData?.id) {
                    this.messageService.add({ 
                        severity: 'error', 
                        summary: 'Error de Sesión', 
                        detail: 'No se pudo identificar al autor o al grupo. Por favor, reinicia sesión.' 
                    });
                    return;
                }

                const ticket: Partial<Ticket> = {
                    ...formValue,
                    id: formValue.id || undefined,
                    titulo: formValue.titulo || '',
                    grupo_id: this.selectedGroupId,
                    estado_id,
                    prioridad_id,
                    estado: TicketStatus.PENDIENTE,
                    prioridad: targetPrioridad,
                    fecha_termino: formValue.fecha_termino ? new Date(formValue.fecha_termino).toISOString() : undefined,
                    autor_id: this.userData.id
                } as any;
                
                console.log('[HomeComponent] Ticket final a enviar:', ticket);
                
                this.ticketService.upsertTicket(ticket).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Ticket guardado correctamente' });
                        this.displayTicketModal = false;
                        console.log('[HomeComponent] Guardado exitoso.');
                    },
                    error: (err) => {
                        console.error('[HomeComponent] Error en upsertTicket:', err);
                        this.messageService.add({ severity: 'error', summary: 'Error de API', detail: err.message || 'No se pudo guardar' });
                    }
                });
            }
        } catch (error: any) {
            console.error('[HomeComponent] CRASH en saveTicket:', error);
            alert('¡CRASH detectado en saveTicket!: ' + error.message);
        }
    }

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
        if (!ticket || !this.userData) return false;
        return this.permissionsService.hasPermission('tickets:edit');
    }

    canChangeStatus(ticket: Ticket | null): boolean {
        if (!ticket || !this.userData) return false;
        return this.permissionsService.hasPermission('tickets:edit');
    }

    canDelete(ticket: Ticket | null): boolean {
        if (!ticket || !this.userData) return false;
        return this.permissionsService.hasPermission('tickets:delete');
    }

    canDrag(ticket: Ticket): boolean {
        if (!this.userData) return false;
        // Los SuperAdmins (*) y usuarios con permiso de edición global pueden mover cualquier ticket
        if (this.permissionsService.isSuperAdmin() || this.permissionsService.hasPermission('tickets:edit')) {
            return true;
        }
        // De lo contrario, solo si el ticket está asignado específicamente a este usuario
        return ticket.asignado_id === this.userData.id;
    }

    updateTicket() {
        if (this.ticketForm.valid && this.selectedTicket) {
            const formValue = this.ticketForm.value;
            const catalogsRaw = this.ticketService.catalogs();
            const targetPrioridad = (formValue.prioridad as any)?.value || formValue.prioridad || '';
            const estados = (catalogsRaw && typeof catalogsRaw === 'object' && 'estados' in catalogsRaw) ? (catalogsRaw as any).estados : [];
            const prioridades = (catalogsRaw && typeof catalogsRaw === 'object' && 'prioridades' in catalogsRaw) ? (catalogsRaw as any).prioridades : [];

            const updatedTicket: Ticket = {
                ...this.selectedTicket,
                titulo: formValue.titulo ?? this.selectedTicket.titulo,
                descripcion: formValue.descripcion ?? this.selectedTicket.descripcion,
                asignado_id: formValue.asignado_id ?? this.selectedTicket.asignado_id,
                estado: formValue.estado ?? this.selectedTicket.estado,
                prioridad: targetPrioridad,
                estado_id: (estados || []).find((e: any) => e.nombre?.toUpperCase() === formValue.estado?.toUpperCase())?.id || this.selectedTicket.estado_id,
                prioridad_id: (prioridades || []).find((p: any) => p.nombre?.toUpperCase() === String(targetPrioridad).toUpperCase())?.id || this.selectedTicket.prioridad_id,
                fecha_termino: (formValue.fecha_termino instanceof Date ? formValue.fecha_termino.toISOString() : formValue.fecha_termino) as string | undefined || this.selectedTicket.fecha_termino,
                historial: [...(this.selectedTicket.historial || []), `Editado por ${this.userData?.nombre || 'Usuario'}`]
            };
            this.ticketService.upsertTicket(updatedTicket).subscribe({
                next: () => {
                    this.selectedTicket = updatedTicket;
                    this.isEditing.set(false);
                    this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Ticket actualizado con éxito' });
                }
            });
        }
    }

    addComment() {
        const comment = this.newComment();
        if (comment && comment.trim() && this.selectedTicket && this.userData) {
            this.ticketService.addComment(this.selectedTicket.id, this.userData.id, comment).subscribe({
                next: () => {
                    this.newComment.set('');
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Comentario guardado permanentemente' });
                    // El signal de tickets se actualiza solo por el tap en el servicio
                },
                error: (err) => {
                    console.error('Error al guardar comentario:', err);
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el comentario en la base de datos' });
                }
            });
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
                this.ticketService.addMember(this.selectedGroupId, email).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Miembro añadido correctamente' });
                        this.displayMemberModal = false;
                    },
                    error: (err) => {
                        console.error('[HomeComponent] Error al añadir miembro:', err);
                        const msg = err.error?.data?.[0]?.message || 'No se pudo encontrar al usuario o no tienes permisos';
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
                    }
                });
            }
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
                this.ticketService.removeMember(groupId, email).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Miembro eliminado con éxito' });
                    }
                });
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
        return this.filteredTickets().filter(t => t.estado === status);
    }

    onDrop(event: CdkDragDrop<Ticket[]>, newStatus: string) {
        if (event.previousContainer === event.container) {
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        } else {
            const ticket = event.previousContainer.data[event.previousIndex];
            
            // Sincronizar el estado_id (UUID) basado en el nombre del nuevo estado
            const catalogs = this.ticketService.catalogs();
            const estados = (catalogs as any).estados || [];
            const newStatusId = estados.find((e: any) => 
                (e.nombre || '').toUpperCase() === newStatus.toUpperCase()
            )?.id;

            const updatedTicket: Ticket = {
                ...ticket,
                estado: newStatus as TicketStatus,
                estado_id: newStatusId || ticket.estado_id, 
                historial: [...(ticket.historial || []), `Estatus cambiado a ${newStatus} por ${this.userData?.nombre || 'Usuario'}`]
            };
            
            console.log(`[HomeComponent] Moviendo ticket ${ticket.id} a ${newStatus} (ID: ${newStatusId})`);
            this.ticketService.upsertTicket(updatedTicket).subscribe({
                next: () => {
                    // Registrar historial persistente del cambio de estado
                    if (this.userData) {
                        this.ticketService.addHistory(
                            ticket.id, 
                            this.userData.id, 
                            `Cambio de estado: ${ticket.estado} -> ${newStatus}`,
                            { anterior: ticket.estado, nuevo: newStatus }
                        ).subscribe();
                    }
                },
                error: (err) => {
                    console.error('[HomeComponent] Error al mover ticket:', err);
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo mover el ticket. Revisa el servidor.' });
                }
            });
        }
    }

    applyFilter(filter: 'all' | 'mine' | 'unassigned' | 'high') {
        this.activeFilter.set(filter);
    }

    getStatusColor(status: TicketStatus | string): string {
        switch (status) {
            case TicketStatus.PENDIENTE: return '#eab308';
            case TicketStatus.EN_PROGRESO: return '#60a5fa';
            case TicketStatus.EN_REVISION: return '#a855f7';
            case TicketStatus.FINALIZADA: return '#22c55e';
            default: return '#93c5fd';
        }
    }

    getGroupTickets(groupId: string): Ticket[] {
        return this.filteredTickets().filter(t => t.grupo_id === groupId);
    }

    deleteTicket(): void {
        if (!this.selectedTicket) return;

        this.confirmationService.confirm({
            message: `¿Estás seguro de que deseas eliminar el ticket: "<b>${this.selectedTicket.titulo}</b>"?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            rejectButtonStyleClass: 'p-button-text',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.ticketService.deleteTicket(this.selectedTicket!.id).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Eliminado',
                            detail: 'El ticket ha sido borrado correctamente'
                        });
                        this.displayDetailModal = false;
                    },
                    error: (err: any) => {
                        console.error('Error al borrar ticket:', err);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'No se pudo eliminar el ticket'
                        });
                    }
                });
            }
        });
    }
}
import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../interfaces/api-response.interface';
import { Observable, tap } from 'rxjs';
import { Ticket, Group } from '../models/ticket.model';

@Injectable({
    providedIn: 'root'
})
export class TicketService {
    private http = inject(HttpClient);
    // Nota: El Gateway añade automáticamente /api al inicio de /tickets, /groups y /auth
    private ticketsUrl = `${environment.apiUrl}/tickets`;
    private groupsUrl = `${environment.apiUrl}/groups`;

    // State driven by Signals
    public groups = signal<Group[]>([]);
    public tickets = signal<Ticket[]>([]);
    public users = signal<any[]>([]);
    public catalogs = signal<{ estados: any[], prioridades: any[] }>({ estados: [], prioridades: [] });

    constructor() {}

    /**
     * Recupera los catálogos del sistema (UUIDs de estados y prioridades)
     */
    getCatalogs(): Observable<ApiResponse<any>> {
        return this.http.get<ApiResponse<any>>(`${this.ticketsUrl}/catalogs`).pipe(
            tap(res => {
                console.log('[TicketService] Respuesta de Catálogos RAW:', res);
                if (res.data) {
                    const data = Array.isArray(res.data) && res.data.length > 0 ? res.data[0] : res.data;
                    this.catalogs.set(data);
                }
            })
        );
    }

    /**
     * Recupera la lista de perfiles para asignación
     */
    getUsers(): Observable<ApiResponse<any>> {
        console.log('[TicketService] Cargando perfiles...');
        return this.http.get<ApiResponse<any>>(`${environment.apiUrl}/auth/profiles`).pipe(
            tap(res => {
                console.log('[TicketService] Perfiles recibidos:', res.data);
                if (res.data) this.users.set(res.data);
            })
        );
    }

    /**
     * Recupera las estadísticas globales para el Dashboard
     */
    getStats(): Observable<ApiResponse<any>> {
        return this.http.get<ApiResponse<any>>(`${this.ticketsUrl}/stats`);
    }

    /**
     * Recupera los grupos y actualiza la señal
     */
    getGroups(): Observable<ApiResponse<Group[]>> {
        return this.http.get<ApiResponse<Group[]>>(this.groupsUrl).pipe(
            tap(res => {
                if (res.data) this.groups.set(res.data);
            })
        );
    }

    /**
     * Recupera todos los tickets y actualiza la señal
     */
    getTickets(): Observable<ApiResponse<Ticket[]>> {
        return this.http.get<ApiResponse<Ticket[]>>(this.ticketsUrl).pipe(
            tap(res => {
                if (res.data && Array.isArray(res.data)) {
                    // Mapeo dinámico para aplanar objetos de Supabase y formatear historial/comentarios
                    const mappedTickets = res.data.map((t: any) => ({
                        ...t,
                        estado: t.estados?.nombre || t.estado,
                        prioridad: t.prioridades?.nombre || t.prioridad,
                        creador_id: t.autor?.nombre_completo || 'Usuario', // Mapeamos nombre real
                        fecha_termino: t.fecha_final || t.fecha_termino,  // Mapeamos fecha límite
                        asignado_nombre: t.asignado?.nombre_completo || 'Sin asignar',
                        // Convertir objetos de comentarios del backend a strings legibles para el UI actual
                        comentarios: (t.comentarios || []).map((c: any) => {
                            const name = c.profiles?.nombre_completo || c.profiles?.username || 'Usuario';
                            const date = new Date(c.creado_en).toLocaleString();
                            return `[${date}] ${name}: ${c.contenido}`;
                        }),
                        // Convertir objetos de historial a strings legibles
                        historial: (t.historial_tickets || []).map((h: any) => {
                            const name = h.profiles?.nombre_completo || h.profiles?.username || 'Usuario';
                            const date = new Date(h.creado_en).toLocaleString();
                            return `[${date}] ${name}: ${h.accion}`;
                        })
                    }));
                    this.tickets.set(mappedTickets);
                }
            })
        );
    }

    /**
     * Agrega un comentario persistente
     */
    addComment(ticketId: string, autor_id: string, contenido: string): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.ticketsUrl}/${ticketId}/comments`, { autor_id, contenido }).pipe(
            tap(() => this.getTickets().subscribe())
        );
    }

    /**
     * Agrega una entrada al historial persistente
     */
    addHistory(ticketId: string, usuario_id: string, accion: string, detalles: any = {}): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.ticketsUrl}/${ticketId}/history`, { usuario_id, accion, detalles }).pipe(
            tap(() => this.getTickets().subscribe())
        );
    }

    /**
     * Elimina un ticket
     */
    deleteTicket(ticketId: string): Observable<ApiResponse> {
        return this.http.delete<ApiResponse>(`${this.ticketsUrl}/${ticketId}`).pipe(
            tap(() => this.refreshAll())
        );
    }

    /**
     * Actualiza o crea un ticket
     */
    upsertTicket(ticket: Partial<Ticket>): Observable<ApiResponse<Ticket>> {
        const isUpdate = !!(ticket.id && ticket.id.length > 20); // UUID length check
        
        // Limpieza DEEP del payload:
        // 1. Solo enviamos lo que el backend/DB acepta
        // 2. Convertimos strings vacíos a null (importante para UUIDs opcionales)
        // 3. Mapeamos nombres de campos (fecha_termino -> fecha_final)
        const payload: any = {
            titulo: ticket.titulo || '',
            descripcion: ticket.descripcion || '',
            grupo_id: ticket.grupo_id,
            autor_id: ticket.autor_id,
            estado_id: ticket.estado_id,
            prioridad_id: ticket.prioridad_id
        };

        // El asignado puede ser null si se quita, pero no puede ser "" (error UUID en DB)
        payload.asignado_id = (ticket.asignado_id === '' || !ticket.asignado_id) ? null : ticket.asignado_id;

        // Mapeo de fecha (Frontend: fecha_termino | Backend: fecha_final)
        const rawFecha = (ticket as any).fecha_termino || (ticket as any).fecha_final;
        if (rawFecha) {
            payload.fecha_final = typeof rawFecha === 'object' && 'toISOString' in rawFecha 
                ? rawFecha.toISOString() 
                : rawFecha;
        }

        if (isUpdate) {
            console.log('[TicketService] Enviando PATCH sanitizado:', payload);
            return this.http.patch<ApiResponse<Ticket>>(`${this.ticketsUrl}/${ticket.id}`, payload).pipe(
                tap(() => this.getTickets().subscribe())
            );
        } else {
            console.log('[TicketService] Enviando POST sanitizado:', payload);
            return this.http.post<ApiResponse<Ticket>>(this.ticketsUrl, payload).pipe(
                tap(() => this.refreshAll())
            );
        }
    }

    /**
     * Crea o actualiza un grupo
     */
    upsertGroup(group: Partial<Group>): Observable<ApiResponse<Group>> {
        const isUpdate = group.id && group.id.length > 20;
        const obs = isUpdate
            ? this.http.patch<ApiResponse<Group>>(`${this.groupsUrl}/${group.id}`, group)
            : this.http.post<ApiResponse<Group>>(this.groupsUrl, group);
        
        return obs.pipe(tap(() => this.refreshAll()));
    }

    /**
     * Elimina un grupo
     */
    deleteGroup(groupId: string): Observable<ApiResponse> {
        return this.http.delete<ApiResponse>(`${this.groupsUrl}/${groupId}`).pipe(
            tap(() => this.refreshAll())
        );
    }

    /**
     * Añade un miembro a un grupo
     */
    addMember(groupId: string, email: string): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.groupsUrl}/assign`, { email, grupo_id: groupId }).pipe(
            tap(() => this.refreshAll())
        );
    }

    /**
     * Elimina un miembro de un grupo
     */
    removeMember(groupId: string, email: string): Observable<ApiResponse> {
        return this.http.delete<ApiResponse>(`${this.groupsUrl}/${groupId}/members/${email}`).pipe(
            tap(() => this.refreshAll())
        );
    }

    /**
     * Refresca todos los datos del sistema
     */
    private refreshAll() {
        this.getGroups().subscribe();
        this.getTickets().subscribe();
        this.getCatalogs().subscribe();
        this.getUsers().subscribe();
    }
}
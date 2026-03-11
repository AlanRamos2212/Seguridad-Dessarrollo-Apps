import { Injectable, signal } from '@angular/core';
import { Ticket, Group } from '../models/ticket.model';

@Injectable({
    providedIn: 'root'
})
export class TicketService {
    private readonly GROUPS_KEY = 'practica_grupos';
    private readonly TICKETS_KEY = 'practica_tickets';

    // State driven by Signals
    public groups = signal<Group[]>([]);
    public tickets = signal<Ticket[]>([]);
    public users = signal<string[]>(['Juan Pérez', 'Maria López', 'Alan P.', 'Erik M.', 'Soporte Técnico', 'Sin asignar']);

    constructor() {
        this.loadInitialData();
    }

    private loadInitialData() {
        if (typeof window !== 'undefined') {
            const savedGroups = localStorage.getItem(this.GROUPS_KEY);
            const savedTickets = localStorage.getItem(this.TICKETS_KEY);

            const initialGroups: Group[] = savedGroups ? JSON.parse(savedGroups) : [];

            const initialTickets: Ticket[] = savedTickets ? JSON.parse(savedTickets) : [];

            this.groups.set(initialGroups);
            this.tickets.set(initialTickets);
        }
    }

    // --- IMMUTABLE STATE UPDATES ---

    addMember(groupId: string, member: string) {
        this.groups.update(groups =>
            groups.map(g => g.id === groupId && !g.members.includes(member)
                ? { ...g, members: [...g.members, member] }
                : g
            )
        );
        this.saveGroups(this.groups());
    }

    removeMember(groupId: string, member: string) {
        this.groups.update(groups =>
            groups.map(g => g.id === groupId
                ? { ...g, members: g.members.filter(m => m !== member) }
                : g
            )
        );
        this.saveGroups(this.groups());
    }

    upsertGroup(group: Group) {
        this.groups.update(groups => {
            const exists = groups.some(g => g.id === group.id);
            return exists
                ? groups.map(g => g.id === group.id ? { ...group } : g)
                : [...groups, group];
        });
        this.saveGroups(this.groups());
    }

    deleteGroup(groupId: string) {
        // Cascade delete: remove tickets associated with this group
        this.tickets.update(tickets => tickets.filter(t => t.groupId !== groupId));
        this.saveTickets(this.tickets());

        // Delete the group
        this.groups.update(groups => groups.filter(g => g.id !== groupId));
        this.saveGroups(this.groups());
    }

    upsertTicket(ticket: Ticket) {
        this.tickets.update(tickets => {
            const exists = tickets.some(t => t.id === ticket.id);
            return exists
                ? tickets.map(t => t.id === ticket.id ? { ...ticket } : t)
                : [...tickets, ticket];
        });
        this.saveTickets(this.tickets());
    }

    deleteTicket(ticketId: string) {
        this.tickets.update(tickets => tickets.filter(t => t.id !== ticketId));
        this.saveTickets(this.tickets());
    }

    private saveGroups(groups: Group[]) {
        localStorage.setItem(this.GROUPS_KEY, JSON.stringify(groups));
    }

    private saveTickets(tickets: Ticket[]) {
        localStorage.setItem(this.TICKETS_KEY, JSON.stringify(tickets));
    }
}

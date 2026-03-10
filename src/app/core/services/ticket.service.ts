import { Injectable } from '@angular/core';
import { Ticket, Group } from '../models/ticket.model';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class TicketService {
    private readonly GROUPS_KEY = 'practica_grupos';
    private readonly TICKETS_KEY = 'practica_tickets';

    private groupsSubject = new BehaviorSubject<Group[]>([]);
    private ticketsSubject = new BehaviorSubject<Ticket[]>([]);

    constructor() {
        this.loadInitialData();
    }

    private loadInitialData() {
        if (typeof window !== 'undefined') {
            const savedGroups = localStorage.getItem(this.GROUPS_KEY);
            const savedTickets = localStorage.getItem(this.TICKETS_KEY);

            const initialGroups: Group[] = savedGroups ? JSON.parse(savedGroups) : [
                {
                    id: '1',
                    name: 'Grupo A',
                    level: 2,
                    description: 'Análisis de Redes',
                    responsible: 'Alan',
                    members: ['alan@correo.com', 'juan@correo.com']
                }
            ];

            const initialTickets: Ticket[] = savedTickets ? JSON.parse(savedTickets) : [];

            this.groupsSubject.next(initialGroups);
            this.ticketsSubject.next(initialTickets);
        }
    }

    getGroups(): Observable<Group[]> {
        return this.groupsSubject.asObservable();
    }

    getTickets(): Observable<Ticket[]> {
        return this.ticketsSubject.asObservable();
    }

    addMember(groupId: string, member: string) {
        const groups = this.groupsSubject.value;
        const group = groups.find(g => g.id === groupId);
        if (group && !group.members.includes(member)) {
            group.members.push(member);
            this.saveGroups(groups);
        }
    }

    removeMember(groupId: string, member: string) {
        const groups = this.groupsSubject.value;
        const group = groups.find(g => g.id === groupId);
        if (group) {
            group.members = group.members.filter(m => m !== member);
            this.saveGroups(groups);
        }
    }

    upsertGroup(group: Group) {
        const groups = this.groupsSubject.value;
        const index = groups.findIndex(g => g.id === group.id);
        if (index >= 0) {
            groups[index] = group;
        } else {
            groups.push(group);
        }
        this.saveGroups(groups);
    }

    deleteGroup(groupId: string) {
        const groups = this.groupsSubject.value.filter(g => g.id !== groupId);
        this.saveGroups(groups);
    }

    upsertTicket(ticket: Ticket) {
        const tickets = this.ticketsSubject.value;
        const index = tickets.findIndex(t => t.id === ticket.id);
        if (index >= 0) {
            tickets[index] = ticket;
        } else {
            tickets.push(ticket);
        }
        this.saveTickets(tickets);
    }

    private saveGroups(groups: Group[]) {
        this.groupsSubject.next([...groups]);
        localStorage.setItem(this.GROUPS_KEY, JSON.stringify(groups));
    }

    private saveTickets(tickets: Ticket[]) {
        this.ticketsSubject.next([...tickets]);
        localStorage.setItem(this.TICKETS_KEY, JSON.stringify(tickets));
    }
}

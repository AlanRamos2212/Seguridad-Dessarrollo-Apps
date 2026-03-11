import { TicketStatus, TicketPriority } from './enums';

export interface Ticket {
    id: string;
    groupId: string;
    title: string;
    description: string;
    status: TicketStatus;
    assignedTo: string;
    priority: TicketPriority;
    createdAt: Date;
    dueDate: Date;
    createdBy: string;
    comments: string[];
    history: string[];
}


export interface Group {
    id: string;
    name: string;
    level: number;
    description: string;
    responsible: string;
    members: string[]; // Email o username
    tickets?: number;
}

import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Ticket } from '../../../core/models/ticket.model';
import { TagModule } from 'primeng/tag';
import { TicketPriority, TicketStatus } from '../../../core/models/enums';

@Component({
    selector: 'app-ticket-card',
    standalone: true,
    imports: [CommonModule, TagModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './ticket-card.html',
    styleUrls: ['./ticket-card.css']
})
export class TicketCardComponent {
    @Input({ required: true }) ticket!: Ticket;
    @Output() cardClick = new EventEmitter<Ticket>();

    // Expose enums to template
    TicketPriority = TicketPriority;
    TicketStatus = TicketStatus;

    getPrioritySeverity(priority: TicketPriority): 'danger' | 'warn' | 'info' | 'contrast' | 'secondary' | 'success' {
        switch (priority) {
            case TicketPriority.ALTA: return 'danger';
            case TicketPriority.MEDIA: return 'warn';
            case TicketPriority.BAJA: return 'info';
            default: return 'info';
        }
    }

    onClick() {
        this.cardClick.emit(this.ticket);
    }
}

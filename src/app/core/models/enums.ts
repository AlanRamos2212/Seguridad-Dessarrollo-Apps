export enum TicketStatus {
    PENDIENTE = 'Pendiente',
    EN_PROGRESO = 'En Progreso',
    EN_REVISION = 'En Revisión',
    FINALIZADA = 'Finalizada'
}

export enum TicketPriority {
    ALTA = 'Alta',
    MEDIA = 'Media',
    BAJA = 'Baja',
}

export interface UserSession {
    id: string;      // UUID del usuario
    email: string;
    nombre: string;
    permisos?: string; // para futuros usos de permisos
}

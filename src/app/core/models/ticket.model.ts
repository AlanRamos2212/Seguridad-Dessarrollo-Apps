import { TicketStatus, TicketPriority } from './enums';

export interface Ticket {
    id: string;
    grupo_id: string;
    titulo: string;      // Coincide con backend
    descripcion: string;
    estado: TicketStatus;
    estado_id?: string;   // ID real del catálogo
    prioridad: TicketPriority;
    prioridad_id?: string; // ID real del catálogo
    asignado_id: string;  // ID o Email del usuario
    asignado?: any;        // Objeto de perfil unido (join)
    asignado_nombre?: string;
    creador_id: string;
    autor_id?: string;
    fecha_inicio?: string;
    fecha_termino?: string;
    creado_en: string;
    comentarios?: string[];
    historial?: string[];
}

export interface Group {
    id: string;
    nombre: string;
    descripcion: string;
    creador_id?: string;
    creado_en?: string;
    usuarios_grupos?: any[];
}

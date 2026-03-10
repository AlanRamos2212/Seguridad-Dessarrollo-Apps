export interface Ticket {
    id: string;
    groupId: string;
    title: string;
    description: string;
    status: 'Pendiente' | 'En Progreso' | 'En Revisión' | 'Finalizada';
    assignedTo: string;
    priority: 'Muy Alta' | 'Alta' | 'Media-Alta' | 'Media' | 'Media-Baja' | 'Baja' | 'Muy Baja';
    createdAt: Date;
    dueDate: Date;
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

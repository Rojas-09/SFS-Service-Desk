export type Priority = 'Crítica' | 'Alta' | 'Media' | 'Baja';

export type TicketStatus = 
  | 'Nuevo' 
  | 'Asignado' 
  | 'En progreso' 
  | 'En espera del cliente' 
  | 'Resuelto' 
  | 'Cerrado';

export type UserRole = 'cliente' | 'agente' | 'supervisor' | 'admin';

export type BandejaType = 'activos' | 'mios' | 'sin-asignar' | 'todos';

export type VistaType = 'tabla' | 'detalle' | 'kanban';

export type SeccionType = 'metricas' | 'anuncios' | 'empresas' | 'usuarios' | 'configuracion';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  avatar: string;
  company?: string;
  phone?: string;
  mustChangePassword?: boolean;
  passwordHash?: string;
}

export interface TicketMessage {
  id: string;
  senderName: string;
  senderRole: 'cliente' | 'soporte' | 'sistema';
  time: string;
  timestamp: number;
  content: string;
  isInternal?: boolean;
  attachment?: {
    name: string;
    size: string;
  };
}

export interface TicketHistoryEvent {
  id: string;
  action: string;
  detail: string;
  user: string;
  time: string;
  timestamp: number;
}

export interface Ticket {
  id: string;
  code: string; // e.g. '#SFS-1024'
  title: string;
  description: string;
  company: string;
  companyNit?: string;
  requesterName: string;
  requesterTitle?: string;
  requesterEmail?: string;
  requesterPhone?: string;
  module: string;
  category: string;
  tags: string[];
  priority: Priority;
  status: TicketStatus;
  assignedAgent?: {
    name: string;
    avatar: string;
    role: string;
  };
  createdAt: string;
  createdHoursAgo: string; // 'hace 2 h'
  slaLimit: string;
  slaMinutesRemaining: number;
  slaFormatted: string; // e.g. "2 h 15 min"
  slaRemainingPercent: number; // 0 to 100 (% of SLA remaining)
  isBreached?: boolean;
  resolutionTime?: string;
  messages: TicketMessage[];
  history: TicketHistoryEvent[];
}

export interface KPIStats {
  openToday: number;
  openTodayDelta: string;
  firstResponseTime: string;
  firstResponseTarget: string;
  slaCompliancePercent: number;
  criticalAtRisk: number;
  criticalAtRiskDetail: string;
}

export interface Announcement {
  id: string;
  title: string;
  category: string;
  content: string;
  date: string;
  author: string;
  priority: 'Alta' | 'Normal';
}

export interface NavigationFilters {
  bandeja: BandejaType;
  vista: VistaType;
  seccion?: SeccionType;
  ticketId?: string;
  empresa?: string;
  agente?: string;
  prioridad?: string;
  categoria?: string;
  sla?: string;
  filtroRapido?: 'urgentes' | 'sla_riesgo' | 'esperando' | '';
  busqueda?: string;
}

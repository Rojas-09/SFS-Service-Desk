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

// Categorías del brief
export type CategoriaTicket = 
  | 'Error del sistema'
  | 'Duda de uso'
  | 'Solicitud de cambio'
  | 'Acceso/usuarios'
  | 'Otro';

// Módulos / productos afectados
export type ModuloAfectado =
  | 'Portal Web Clientes'
  | 'Módulo ERP Facturación'
  | 'App Móvil Logística'
  | 'Básculas y Pesaje IoT'
  | 'API Integración Bancaria'
  | 'Reportes DIAN'
  | 'Infraestructura y Base de Datos'
  | 'General';

export interface Usuario {
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

export type User = Usuario;

export interface Empresa {
  id: string;
  name: string;
  nit: string;
  tier: string;
  sede: string;
  contact: string;
  contactEmail: string;
  contactPhone?: string;
  slaNotes?: string;
  activeTicketsCount?: number;
}

export interface Mensaje {
  id: string;
  senderName: string;
  senderRole: 'cliente' | 'soporte' | 'sistema';
  senderEmail?: string;
  time: string; // Formato amigable Bogotá (dd/mm/aaaa hh:mm a.m./p.m.)
  timestamp: number; // ms
  content: string;
  isInternal?: boolean;
  createdAtIso?: string; // ISO 8601
  attachment?: {
    name: string;
    size: string;
  };
}

export type TicketMessage = Mensaje;

export interface EventoTicket {
  id: string;
  action: string;
  detail: string;
  user: string;
  time: string; // Formato legible Bogotá
  timestamp: number;
  createdAtIso?: string;
}

export type TicketHistoryEvent = EventoTicket;

export interface Ticket {
  id: string;
  code: string; // e.g. '#SFS-1024'
  title: string;
  description: string;
  company: string; // Café Quindío S.A.S., Trilladora La Manuela, Exportadora del Eje, Almacafé S.A.
  companyNit?: string;
  requesterName: string;
  requesterTitle?: string;
  requesterEmail?: string;
  requesterPhone?: string;
  module: string; // Módulo o producto afectado
  category: string; // Error del sistema, Duda de uso, etc.
  tags: string[];
  priority: Priority;
  status: TicketStatus;
  assignedAgent?: {
    name: string;
    avatar: string;
    role: string;
    email?: string;
  };
  createdAt: string; // dd/mm/aaaa, hh:mm a. m.
  createdAtIso?: string; // ISO 8601
  createdHoursAgo: string; // Calculado relativo desde ISO
  slaLimit: string; // dd/mm/aaaa, hh:mm a. m.
  slaLimitIso?: string;
  slaFirstResponseLimitIso?: string;
  slaMinutesRemaining: number;
  slaFormatted: string; // e.g. "2 h 15 min"
  slaRemainingPercent: number; // 0 to 100 (% de SLA restante)
  isBreached?: boolean;
  firstResponseAtIso?: string;
  resolvedAtIso?: string;
  closedAtIso?: string;
  resolutionTime?: string;
  messages: Mensaje[];
  history: EventoTicket[];
}

export interface Anuncio {
  id: string;
  title: string;
  category: string;
  content: string;
  date: string;
  author: string;
  priority: 'Alta' | 'Normal';
  createdAtIso?: string;
}

export type Announcement = Anuncio;

export interface ReglaSLA {
  prioridad: Priority;
  primeraRespuestaHoras: number;
  solucionHoras: number;
  descripcion: string;
}

export interface Macro {
  id: string;
  label: string;
  text: string;
  categoria?: string;
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

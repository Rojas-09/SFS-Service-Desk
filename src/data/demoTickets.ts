import { Ticket } from '../types';

const demoDate = '2026-09-29T14:30:00-05:00';

const DEMO_TICKET_SEEDS: Ticket[] = [
  {
    id: 'demo-t-1001',
    code: '#SFS-1001',
    title: 'Error al emitir factura electrónica DIAN',
    description: 'El servicio de facturación no responde al emitir documentos.',
    company: 'Café Quindío S.A.S.',
    companyNit: '890.102.455-8',
    requesterName: 'Claudia Mendoza',
    requesterEmail: 'cliente@cafequindio.com',
    module: 'Módulo ERP Facturación',
    category: 'Error del sistema',
    tags: ['DIAN', 'Facturación'],
    priority: 'Crítica',
    status: 'En progreso',
    assignedAgent: {
      name: 'Laura Yepes',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
      role: 'Especialista L2 de soporte'
    },
    createdAt: '29/09/2026, 02:30 p. m.',
    createdAtIso: demoDate,
    createdHoursAgo: 'hace 1 d',
    slaLimit: '30/09/2026, 06:30 p. m.',
    slaLimitIso: '2026-09-30T18:30:00-05:00',
    slaMinutesRemaining: 120,
    slaFormatted: '2 h',
    slaRemainingPercent: 35,
    messages: [
      {
        id: 'demo-m-1001-1',
        senderName: 'Claudia Mendoza',
        senderRole: 'cliente',
        time: '29/09/2026, 02:30 p. m.',
        timestamp: new Date(demoDate).getTime(),
        createdAtIso: demoDate,
        content: 'El servicio de facturación no responde al emitir documentos.'
      },
      {
        id: 'demo-m-1001-2',
        senderName: 'Laura Yepes',
        senderRole: 'soporte',
        time: '29/09/2026, 03:00 p. m.',
        timestamp: new Date('2026-09-29T15:00:00-05:00').getTime(),
        createdAtIso: '2026-09-29T15:00:00-05:00',
        content: 'Estamos revisando la integración con DIAN.'
      },
      {
        id: 'demo-m-1001-internal',
        senderName: 'Laura Yepes',
        senderRole: 'soporte',
        time: '29/09/2026, 03:10 p. m.',
        timestamp: new Date('2026-09-29T15:10:00-05:00').getTime(),
        createdAtIso: '2026-09-29T15:10:00-05:00',
        content: 'Nota interna de demostración.',
        isInternal: true
      }
    ],
    history: []
  },
  {
    id: 'demo-t-1002',
    code: '#SFS-1002',
    title: 'Consulta sobre sincronización de remisiones',
    description: 'Solicitamos orientación para sincronizar remisiones sin conexión.',
    company: 'Trilladora La Manuela',
    companyNit: '800.231.908-1',
    requesterName: 'Juan Camilo Duque',
    requesterEmail: 'cliente@trilladoralamanuela.co',
    module: 'App Móvil Logística',
    category: 'Duda de uso',
    tags: ['Móvil', 'Logística'],
    priority: 'Media',
    status: 'Nuevo',
    createdAt: '28/09/2026, 09:15 a. m.',
    createdAtIso: '2026-09-28T09:15:00-05:00',
    createdHoursAgo: 'hace 2 d',
    slaLimit: '01/10/2026, 05:15 p. m.',
    slaLimitIso: '2026-10-01T17:15:00-05:00',
    slaMinutesRemaining: 900,
    slaFormatted: '15 h',
    slaRemainingPercent: 80,
    messages: [],
    history: []
  },
  {
    id: 'demo-t-1003',
    code: '#SFS-1003',
    title: 'Ajuste de reporte de medios magnéticos',
    description: 'Se requiere incorporar una columna en el reporte tributario.',
    company: 'Exportadora del Eje',
    companyNit: '900.551.402-3',
    requesterName: 'Sandra Milena Ortiz',
    requesterEmail: 'cliente@exportadoradeleje.com',
    module: 'Reportes DIAN',
    category: 'Solicitud de cambio',
    tags: ['DIAN', 'Reportes'],
    priority: 'Alta',
    status: 'Asignado',
    assignedAgent: {
      name: 'Felipe Castaño',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
      role: 'Especialista de soporte'
    },
    createdAt: '26/09/2026, 11:00 a. m.',
    createdAtIso: '2026-09-26T11:00:00-05:00',
    createdHoursAgo: 'hace 4 d',
    slaLimit: '30/09/2026, 11:00 a. m.',
    slaLimitIso: '2026-09-30T11:00:00-05:00',
    slaMinutesRemaining: 60,
    slaFormatted: '1 h',
    slaRemainingPercent: 12,
    messages: [],
    history: []
  },
  {
    id: 'demo-t-1004',
    code: '#SFS-1004',
    title: 'Pérdida de enlace con báscula camionera',
    description: 'La báscula no transmite lecturas al sistema central.',
    company: 'Almacafé S.A.',
    companyNit: '860.007.820-9',
    requesterName: 'Diego Fernando Rojas',
    requesterEmail: 'cliente@almacafe.com.co',
    module: 'Básculas y Pesaje IoT',
    category: 'Error del sistema',
    tags: ['IoT', 'Hardware'],
    priority: 'Alta',
    status: 'En espera del cliente',
    createdAt: '25/09/2026, 08:45 a. m.',
    createdAtIso: '2026-09-25T08:45:00-05:00',
    createdHoursAgo: 'hace 5 d',
    slaLimit: '30/09/2026, 04:45 p. m.',
    slaLimitIso: '2026-09-30T16:45:00-05:00',
    slaMinutesRemaining: 300,
    slaFormatted: '5 h',
    slaRemainingPercent: 45,
    messages: [],
    history: []
  },
  {
    id: 'demo-t-1005',
    code: '#SFS-1005',
    title: 'Solicitud de usuario para compras',
    description: 'Crear un perfil de consulta para un nuevo analista.',
    company: 'Café Quindío S.A.S.',
    companyNit: '890.102.455-8',
    requesterName: 'Claudia Mendoza',
    requesterEmail: 'cliente@cafequindio.com',
    module: 'Portal Web Clientes',
    category: 'Acceso/usuarios',
    tags: ['Accesos', 'Usuarios'],
    priority: 'Baja',
    status: 'Resuelto',
    createdAt: '20/09/2026, 10:20 a. m.',
    createdAtIso: '2026-09-20T10:20:00-05:00',
    createdHoursAgo: 'hace 9 d',
    slaLimit: '25/09/2026, 06:00 p. m.',
    slaLimitIso: '2026-09-25T18:00:00-05:00',
    slaMinutesRemaining: 0,
    slaFormatted: 'Cumplido',
    slaRemainingPercent: 100,
    messages: [],
    history: []
  },
  {
    id: 'demo-t-1006',
    code: '#SFS-1006',
    title: 'Optimización de consulta de liquidación',
    description: 'El reporte tarda más de tres minutos en generarse.',
    company: 'Trilladora La Manuela',
    companyNit: '800.231.908-1',
    requesterName: 'Juan Camilo Duque',
    requesterEmail: 'cliente@trilladoralamanuela.co',
    module: 'Módulo ERP Facturación',
    category: 'Otro',
    tags: ['Rendimiento', 'Base de datos'],
    priority: 'Media',
    status: 'Cerrado',
    createdAt: '12/09/2026, 03:40 p. m.',
    createdAtIso: '2026-09-12T15:40:00-05:00',
    createdHoursAgo: 'hace 18 d',
    slaLimit: '17/09/2026, 06:00 p. m.',
    slaLimitIso: '2026-09-17T18:00:00-05:00',
    slaMinutesRemaining: 0,
    slaFormatted: 'Cumplido',
    slaRemainingPercent: 100,
    messages: [],
    history: []
  }
];

const DEMO_COMPANIES = [
  { name: 'Café Quindío S.A.S.', nit: '890.102.455-8', requester: 'Claudia Mendoza', email: 'cliente@cafequindio.com' },
  { name: 'Trilladora La Manuela', nit: '800.231.908-1', requester: 'Juan Camilo Duque', email: 'cliente@trilladoralamanuela.co' },
  { name: 'Exportadora del Eje', nit: '900.551.402-3', requester: 'Sandra Milena Ortiz', email: 'cliente@exportadoradeleje.com' },
  { name: 'Almacafé S.A.', nit: '860.007.820-9', requester: 'Diego Fernando Rojas', email: 'cliente@almacafe.com.co' }
];

const DEMO_STATUSES: Ticket['status'][] = [
  ...Array(8).fill('Nuevo'),
  ...Array(10).fill('Asignado'),
  ...Array(12).fill('En progreso'),
  ...Array(6).fill('En espera del cliente'),
  ...Array(14).fill('Resuelto'),
  ...Array(10).fill('Cerrado')
];

const DEMO_AGENTS = ['Laura Yepes', 'Felipe Castaño', 'Valentina Ríos', 'Mateo Gómez', 'Daniel Ospina'];
const DEMO_TITLES = [
  'Validar integración del módulo con el sistema corporativo',
  'Consulta sobre el flujo de operación del portal',
  'Ajuste requerido en reporte operativo',
  'Error intermitente durante la operación',
  'Solicitud de acceso para nuevo usuario',
  'Revisión de tiempos de respuesta del servicio'
];

function buildGeneratedDemoTicket(index: number): Ticket {
  const company = DEMO_COMPANIES[index % DEMO_COMPANIES.length];
  const status = DEMO_STATUSES[index];
  const createdDate = new Date(Date.UTC(2026, 8, 30 - (index % 88), 13 + (index % 5), 15, 0));
  const createdAtIso = createdDate.toISOString();
  const assignedName = status === 'Nuevo' || status === 'En espera del cliente' ? undefined : DEMO_AGENTS[index % DEMO_AGENTS.length];
  const priority: Ticket['priority'] = index % 10 === 0 ? 'Crítica' : index % 4 === 0 ? 'Alta' : index % 3 === 0 ? 'Baja' : 'Media';
  const statusIsFinal = status === 'Resuelto' || status === 'Cerrado';
  const remaining = Math.max(30, 900 - index * 11);

  return {
    id: `demo-t-${1100 + index}`,
    code: `#SFS-${1100 + index}`,
    title: `${DEMO_TITLES[index % DEMO_TITLES.length]} #${index + 1}`,
    description: 'Caso de demostración generado desde la semilla local de la demo.',
    company: company.name,
    companyNit: company.nit,
    requesterName: company.requester,
    requesterEmail: company.email,
    module: index % 2 === 0 ? 'Portal Web Clientes' : 'Módulo ERP Facturación',
    category: ['Error del sistema', 'Duda de uso', 'Solicitud de cambio', 'Acceso/usuarios', 'Otro'][index % 5],
    tags: ['Demo', 'Soporte'],
    priority,
    status,
    assignedAgent: assignedName ? { name: assignedName, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80', role: 'Especialista de soporte' } : undefined,
    createdAt: createdDate.toLocaleDateString('es-CO') + ', ' + createdDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    createdAtIso,
    createdHoursAgo: `hace ${Math.max(1, index % 30)} d`,
    slaLimit: statusIsFinal ? 'Cumplido' : '30/09/2026, 06:00 p. m.',
    slaLimitIso: '2026-09-30T18:00:00-05:00',
    slaMinutesRemaining: statusIsFinal ? 0 : remaining,
    slaFormatted: statusIsFinal ? 'Cumplido' : `${Math.max(1, Math.floor(remaining / 60))} h`,
    slaRemainingPercent: statusIsFinal ? 100 : Math.max(5, 90 - index),
    isBreached: false,
    messages: [],
    history: []
  };
}

export const DEMO_TICKETS: Ticket[] = [
  ...DEMO_TICKET_SEEDS,
  ...Array.from({ length: 54 }, (_, index) => buildGeneratedDemoTicket(index + 6))
];

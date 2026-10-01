/**
 * Generador y almacén de datos semilla del servidor (server/data/seed.ts).
 * Módulo exclusivo del servidor para inicializar tickets, usuarios, empresas y catálogos.
 * 
 * Requisitos:
 * - 4 empresas cliente (Café Quindío S.A.S., Trilladora La Manuela, Exportadora del Eje, Almacafé S.A.).
 * - Sin Cooperativa del Huila ni empresa interna en clientes.
 * - 5 agentes SFS con cuenta real, 1 supervisor y 1 admin.
 * - ~60 tickets en los últimos 90 días (fechas ISO 8601, semilla fija) en los 6 estados.
 * - Categorías: Error del sistema, Duda de uso, Solicitud de cambio, Acceso/usuarios, Otro.
 * - Módulo/producto afectado como campo independiente.
 */

import {
  Ticket,
  TicketStatus,
  Priority,
  Empresa,
  Anuncio,
  Macro,
  Mensaje,
  EventoTicket,
  CategoriaTicket,
  ModuloAfectado
} from '../../src/types';
import { AuthUser } from '../../lib/auth/repositorio';
import { calcularVencimiento, MATRIZ_SLA } from '../../lib/sla/index';
import { formatFechaBogota, formatTiempoRelativo, calcularEstadoSLA } from '../../src/utils/fechas';

// Hash bcrypt de 'SFS2026!'
export const SEED_DEFAULT_PASSWORD_HASH = '$2b$10$z4PL1GbctducO9KNtn4.VOaucpxPLVtU.NKSXMMuidO0sFLA9Q3.2';

// --------------------------------------------------------------------------
// 1. EMPRESAS CLIENTE (Exactamente las 4 del brief)
// --------------------------------------------------------------------------
export const SEED_COMPANIES: Empresa[] = [
  {
    id: 'emp-1',
    name: 'Café Quindío S.A.S.',
    nit: '890.102.455-8',
    tier: 'Platinum SLA',
    sede: 'Armenia, Quindío',
    contact: 'Claudia Mendoza (Gerente de tecnología)',
    contactEmail: 'cmendoza@cafequindio.com',
    contactPhone: '+57 (6) 745-8900',
    slaNotes: 'Atención crítica 24/7 en época de cosecha, soporte estándar L-V 8am-6pm'
  },
  {
    id: 'emp-2',
    name: 'Trilladora La Manuela',
    nit: '800.231.908-1',
    tier: 'Gold SLA',
    sede: 'Manizales, Caldas',
    contact: 'Juan Camilo Duque (Jefe de logística)',
    contactEmail: 'cliente@trilladoralamanuela.co',
    contactPhone: '+57 (6) 880-1234',
    slaNotes: 'Monitoreo de básculas y pesaje IoT camionero'
  },
  {
    id: 'emp-3',
    name: 'Exportadora del Eje',
    nit: '900.551.402-3',
    tier: 'Platinum SLA',
    sede: 'Pereira, Risaralda',
    contact: 'Sandra Milena Ortiz (Directora administrativa)',
    contactEmail: 'sortiz@exportadoradeleje.com',
    contactPhone: '+57 (6) 313-5500',
    slaNotes: 'Prioridad alta en conciliación bancaria y facturación DIAN'
  },
  {
    id: 'emp-4',
    name: 'Almacafé S.A.',
    nit: '860.007.820-9',
    tier: 'Enterprise SLA',
    sede: 'Bogotá D.C. / Pereira',
    contact: 'Diego Fernando Rojas (Líder de infraestructura)',
    contactEmail: 'drojas@almacafe.com.co',
    contactPhone: '+57 (1) 742-5000',
    slaNotes: 'SLA crítico en enlaces con aduanas y puerto de Buenaventura'
  }
];

// Lista de nombres de empresas para selectores
export const SEED_COMPANIES_NAMES = SEED_COMPANIES.map(c => c.name);

// --------------------------------------------------------------------------
// 2. CATEGORÍAS Y MÓDULOS (Requirement 6)
// --------------------------------------------------------------------------
export const SEED_CATEGORIES: CategoriaTicket[] = [
  'Error del sistema',
  'Duda de uso',
  'Solicitud de cambio',
  'Acceso/usuarios',
  'Otro'
];

export const SEED_MODULES: ModuloAfectado[] = [
  'Portal Web Clientes',
  'Módulo ERP Facturación',
  'App Móvil Logística',
  'Básculas y Pesaje IoT',
  'API Integración Bancaria',
  'Reportes DIAN',
  'Infraestructura y Base de Datos'
];

// --------------------------------------------------------------------------
// 3. USUARIOS (5 agentes, 1 supervisor, 1 admin, 4 clientes)
// --------------------------------------------------------------------------
export const SEED_USERS: AuthUser[] = [
  // 5 AGENTES SFS
  {
    id: 'usr-agente-1',
    name: 'Laura Yepes',
    email: 'agente@sfs.co',
    role: 'agente',
    title: 'Especialista L2 de soporte',
    company: 'Software Factory and Services',
    phone: '+57 301 555 4321',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    mustChangePassword: false,
    passwordHash: SEED_DEFAULT_PASSWORD_HASH
  },
  {
    id: 'usr-agente-2',
    name: 'Felipe Castaño',
    email: 'felipe.castano@sfs.co',
    role: 'agente',
    title: 'Especialista en hardware e integraciones',
    company: 'Software Factory and Services',
    phone: '+57 311 222 3344',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    mustChangePassword: false,
    passwordHash: SEED_DEFAULT_PASSWORD_HASH
  },
  {
    id: 'usr-agente-3',
    name: 'Valentina Ríos',
    email: 'valentina.rios@sfs.co',
    role: 'agente',
    title: 'Ingeniera de soporte ERP y bases de datos',
    company: 'Software Factory and Services',
    phone: '+57 314 888 9911',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    mustChangePassword: false,
    passwordHash: SEED_DEFAULT_PASSWORD_HASH
  },
  {
    id: 'usr-agente-4',
    name: 'Mateo Gómez',
    email: 'mateo.gomez@sfs.co',
    role: 'agente',
    title: 'Analista de soporte financiero y contable',
    company: 'Software Factory and Services',
    phone: '+57 320 665 1122',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
    mustChangePassword: false,
    passwordHash: SEED_DEFAULT_PASSWORD_HASH
  },
  {
    id: 'usr-agente-5',
    name: 'Daniel Ospina',
    email: 'daniel.ospina@sfs.co',
    role: 'agente',
    title: 'Especialista en conectividad y DIAN',
    company: 'Software Factory and Services',
    phone: '+57 318 777 4455',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
    mustChangePassword: false,
    passwordHash: SEED_DEFAULT_PASSWORD_HASH
  },

  // 1 SUPERVISOR
  {
    id: 'usr-supervisor-1',
    name: 'Andrés Moreno',
    email: 'supervisor@sfs.co',
    role: 'supervisor',
    title: 'Supervisor de operaciones y SLA',
    company: 'Software Factory and Services',
    phone: '+57 310 444 8899',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    mustChangePassword: false,
    passwordHash: SEED_DEFAULT_PASSWORD_HASH
  },

  // 1 ADMIN
  {
    id: 'usr-admin-1',
    name: 'Carlos M. Restrepo',
    email: 'admin@sfs.co',
    role: 'admin',
    title: 'Administrador del sistema',
    company: 'Software Factory and Services',
    phone: '+57 300 123 4567',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80',
    mustChangePassword: false,
    passwordHash: SEED_DEFAULT_PASSWORD_HASH
  },

  // 4 CLIENTES DE LAS 4 EMPRESAS
  {
    id: 'usr-cliente-1',
    name: 'Juan Camilo Duque',
    email: 'cliente@trilladoralamanuela.co',
    role: 'cliente',
    title: 'Jefe de logística',
    company: 'Trilladora La Manuela',
    phone: '+57 (6) 880-1234',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    mustChangePassword: true, // Flujo de cambio de clave para auditoría
    passwordHash: SEED_DEFAULT_PASSWORD_HASH
  },
  {
    id: 'usr-cliente-2',
    name: 'Claudia Mendoza',
    email: 'cliente@cafequindio.com',
    role: 'cliente',
    title: 'Gerente de tecnología',
    company: 'Café Quindío S.A.S.',
    phone: '+57 (6) 745-8900',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    mustChangePassword: false,
    passwordHash: SEED_DEFAULT_PASSWORD_HASH
  },
  {
    id: 'usr-cliente-3',
    name: 'Sandra Milena Ortiz',
    email: 'cliente@exportadoradeleje.com',
    role: 'cliente',
    title: 'Directora administrativa',
    company: 'Exportadora del Eje',
    phone: '+57 (6) 313-5500',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
    mustChangePassword: false,
    passwordHash: SEED_DEFAULT_PASSWORD_HASH
  },
  {
    id: 'usr-cliente-4',
    name: 'Diego Fernando Rojas',
    email: 'cliente@almacafe.com.co',
    role: 'cliente',
    title: 'Líder de infraestructura',
    company: 'Almacafé S.A.',
    phone: '+57 (1) 742-5000',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80',
    mustChangePassword: false,
    passwordHash: SEED_DEFAULT_PASSWORD_HASH
  }
];

export const SEED_AGENTS = SEED_USERS.filter(u => u.role === 'agente');

// --------------------------------------------------------------------------
// 4. ANUNCIOS Y MACROS
// --------------------------------------------------------------------------
export const SEED_ANNOUNCEMENTS: Anuncio[] = [
  {
    id: 'ann-1',
    title: 'Ventana de mantenimiento preventivo base de datos ERP',
    category: 'Mantenimiento programado',
    content: 'Este sábado entre las 11:00 p. m. y las 2:00 a. m. se realizará la optimización de índices y balanceo de carga en los clústeres de base de datos. Los servicios web estarán en modo contingencia.',
    date: '28/09/2026, 09:00 a. m.',
    author: 'Carlos M. Restrepo (Administrador)',
    priority: 'Normal',
    createdAtIso: '2026-09-28T09:00:00-05:00'
  },
  {
    id: 'ann-2',
    title: 'Actualización obligatoria certificado de facturación DIAN',
    category: 'Aviso DIAN / Facturación',
    content: 'La DIAN programó un cambio de claves criptográficas para el próximo martes. Se solicita a todos los clientes validar la vigencia de su token corporativo en el portal de autoservicio.',
    date: '27/09/2026, 03:30 p. m.',
    author: 'Laura Yepes (Especialista soporte)',
    priority: 'Alta',
    createdAtIso: '2026-09-27T15:30:00-05:00'
  },
  {
    id: 'ann-3',
    title: 'Nueva versión 3.4 del conector de básculas y pesaje IoT',
    category: 'Nuevo servicio',
    content: 'Se encuentra disponible la librería de enlace directo con indicadores de peso Toledo y Rice Lake para básculas camioneras, reduciendo la latencia de pesaje a menos de 50 ms.',
    date: '25/09/2026, 10:15 a. m.',
    author: 'Felipe Castaño (Integraciones)',
    priority: 'Normal',
    createdAtIso: '2026-09-25T10:15:00-05:00'
  }
];

export const SEED_MACROS: Macro[] = [
  {
    id: 'm1',
    label: 'Recepción y análisis inicial',
    text: 'Estimado cliente, hemos recibido su reporte. El equipo de soporte técnico se encuentra validando los registros del sistema para emitir la solución en los tiempos pactados en el acuerdo de nivel de servicio.',
    categoria: 'Atención'
  },
  {
    id: 'm2',
    label: 'Solicitud de capturas y registros de error',
    text: 'Agradecemos compartir captura de pantalla completa del mensaje de error, archivo de registro (.log) y el identificador de usuario con el que se presentó el incidente.',
    categoria: 'Diagnóstico'
  },
  {
    id: 'm3',
    label: 'Pase a pruebas en entorno de contingencia',
    text: 'La corrección fue desplegada en el contenedor de pruebas. Por favor valide el comportamiento con su equipo operativo para proceder al cierre formal del caso.',
    categoria: 'Resolución'
  },
  {
    id: 'm4',
    label: 'Cierre y solución satisfactoria',
    text: 'Confirmamos la resolución del incidente. El servicio opera en parámetros nominales y el caso ha sido marcado como resuelto. Quedamos a su disposición.',
    categoria: 'Cierre'
  }
];

// --------------------------------------------------------------------------
// 5. GENERADOR DETERMINISTA DE ~60 TICKETS (ÚLTIMOS 90 DÍAS)
// --------------------------------------------------------------------------
// Generador pseudo-aleatorio con semilla fija (Mulberry32)
function createRng(seed: number) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = createRng(20260930);

const ESTADOS: TicketStatus[] = [
  'Nuevo',
  'Asignado',
  'En progreso',
  'En espera del cliente',
  'Resuelto',
  'Cerrado'
];

const PRIORIDADES: Priority[] = ['Crítica', 'Alta', 'Media', 'Baja'];

const PLANTILLAS_CASOS: {
  categoria: CategoriaTicket;
  modulo: ModuloAfectado;
  titulo: string;
  descripcion: string;
  tags: string[];
}[] = [
  {
    categoria: 'Error del sistema',
    modulo: 'Módulo ERP Facturación',
    titulo: 'Error HTTP 500 al emitir factura electrónica con validación previa DIAN',
    descripcion: 'El servicio de timbrado no responde tras la actualización. No podemos despachar pedidos de exportación a puerto sin el comprobante legal emitido.',
    tags: ['Facturación', 'DIAN', 'XML']
  },
  {
    categoria: 'Error del sistema',
    modulo: 'Básculas y Pesaje IoT',
    titulo: 'Pérdida de enlace serial con indicador Toledo en báscula camionera #2',
    descripcion: 'La lectura de pesaje de camiones de café pergamino queda congelada en cero. El pesaje manual duplica los tiempos de despacho.',
    tags: ['Básculas', 'IoT', 'Hardware']
  },
  {
    categoria: 'Solicitud de cambio',
    modulo: 'Portal Web Clientes',
    titulo: 'Habilitar descarga masiva de certificados de origen en formato PDF',
    descripcion: 'Los compradores internacionales requieren descargar los certificados fitosanitarios y de origen en un solo archivo comprimido.',
    tags: ['Portal', 'Exportación', 'PDF']
  },
  {
    categoria: 'Duda de uso',
    modulo: 'App Móvil Logística',
    titulo: 'Guía para sincronización offline de remisiones en zonas de baja cobertura',
    descripcion: 'Los transportadores solicitan capacitación sobre el almacenamiento de firmas digitales en ruta sin conexión 4G.',
    tags: ['Móvil', 'Offline', 'Logística']
  },
  {
    categoria: 'Acceso/usuarios',
    modulo: 'Portal Web Clientes',
    titulo: 'Reinicio de credenciales y asignación de perfil de compras a nuevo analista',
    descripcion: 'Se integró un nuevo analista de abastecimiento y requiere permisos para consulta de inventarios y estado de pedidos.',
    tags: ['Accesos', 'Usuarios', 'Seguridad']
  },
  {
    categoria: 'Error del sistema',
    modulo: 'API Integración Bancaria',
    titulo: 'Fallo de conexión API con el banco para conciliación automática de pagos',
    descripcion: 'El webservice SOAP del banco retorna error de timeout durante el procesamiento del lote de pagos quincenales.',
    tags: ['Bancos', 'Conciliación', 'API']
  },
  {
    categoria: 'Solicitud de cambio',
    modulo: 'Reportes DIAN',
    titulo: 'Ajuste en reporte de medios magnéticos para retención en la fuente',
    descripcion: 'Se requiere incorporar las tarifas diferenciales para proveedores de café especial según la nueva resolución tributaria.',
    tags: ['Tributario', 'DIAN', 'Reportes']
  },
  {
    categoria: 'Otro',
    modulo: 'Infraestructura y Base de Datos',
    titulo: 'Optimización de consultas lentas en módulo de liquidación de fletes',
    descripcion: 'El reporte de liquidación tarda más de 3 minutos en generarse al consultar rangos superiores a 30 días.',
    tags: ['Base de datos', 'Rendimiento', 'SQL']
  },
  {
    categoria: 'Duda de uso',
    modulo: 'Módulo ERP Facturación',
    titulo: 'Procedimiento para anulación de notas crédito asociadas a remisiones de café',
    descripcion: 'El equipo contable necesita confirmar el flujo correcto para revocar una nota crédito sin afectar el consecutivo fiscal.',
    tags: ['Facturación', 'Contabilidad', 'Notas']
  },
  {
    categoria: 'Error del sistema',
    modulo: 'Portal Web Clientes',
    titulo: 'Error de carga en panel de seguimiento de lotes de exportación',
    descripcion: 'Al filtrar por fecha de embarque el navegador muestra mensaje de script no responde y bloquea la interfaz.',
    tags: ['Portal', 'Frontend', 'Lotes']
  }
];

export function generarTicketsSemilla(): Ticket[] {
  const tickets: Ticket[] = [];
  const TOTAL_TICKETS = 60;
  // Fecha de referencia: 30 de Septiembre de 2026, 17:00 hora de Bogotá
  const fechaRef = new Date('2026-09-30T17:00:00-05:00');

  // Asegurar distribución equilibrada de estados
  // Nuevo: ~8, Asignado: ~10, En progreso: ~12, En espera: ~6, Resuelto: ~14, Cerrado: ~10
  const estadosDistribucion: TicketStatus[] = [
    ...Array(8).fill('Nuevo'),
    ...Array(10).fill('Asignado'),
    ...Array(12).fill('En progreso'),
    ...Array(6).fill('En espera del cliente'),
    ...Array(14).fill('Resuelto'),
    ...Array(10).fill('Cerrado')
  ];

  for (let i = 0; i < TOTAL_TICKETS; i++) {
    const codeNum = 1001 + i;
    const code = `#SFS-${codeNum}`;
    const id = `t-${codeNum}`;

    // Empresa (una de las 4 empresas clientes)
    const empresa = SEED_COMPANIES[i % SEED_COMPANIES.length];

    // Plantilla
    const plantilla = PLANTILLAS_CASOS[i % PLANTILLAS_CASOS.length];

    // Prioridad (distribución: 10% Crítica, 25% Alta, 45% Media, 20% Baja)
    const randPrio = rng();
    const priority: Priority =
      randPrio < 0.12 ? 'Crítica' : randPrio < 0.38 ? 'Alta' : randPrio < 0.80 ? 'Media' : 'Baja';

    const status = estadosDistribucion[i] || 'En progreso';

    // Fecha de creación: distribuida en los últimos 90 días
    // Tickets recientes para hoy y días previos, y más antiguos hacia el inicio
    let diasAtras: number;
    if (i < 5) {
      // Muy recientes (hoy y ayer: entre 0.05 y 1.5 días atrás)
      diasAtras = 0.05 + rng() * 1.2;
    } else if (i < 20) {
      // Últimos 14 días
      diasAtras = 2 + rng() * 12;
    } else {
      // 15 a 88 días atrás
      diasAtras = 15 + rng() * 73;
    }

    const createdTimeMs = fechaRef.getTime() - Math.round(diasAtras * 24 * 60 * 60 * 1000);
    const createdDate = new Date(createdTimeMs);
    const createdAtIso = createdDate.toISOString();
    const createdAtFormatted = formatFechaBogota(createdDate, true);
    const createdHoursAgo = formatTiempoRelativo(createdDate, fechaRef);

    // Calcular SLA estricto con el nuevo módulo hábil de Colombia (Requirement 7)
    const reglaSla = MATRIZ_SLA[priority];
    const slaFirstResponseLimitDate = calcularVencimiento(createdDate, reglaSla.primeraRespuestaHoras);
    const slaSolutionLimitDate = calcularVencimiento(createdDate, reglaSla.solucionHoras);

    const isResolvedOrClosed = status === 'Resuelto' || status === 'Cerrado';
    const slaEstado = calcularEstadoSLA(createdAtIso, slaSolutionLimitDate.toISOString(), isResolvedOrClosed, fechaRef);

    // Agente asignado (excepto para algunos tickets nuevos)
    let assignedAgent: Ticket['assignedAgent'] | undefined = undefined;
    if (status !== 'Nuevo' || i % 3 === 0) {
      const agente = SEED_AGENTS[i % SEED_AGENTS.length];
      assignedAgent = {
        name: agente.name,
        avatar: agente.avatar,
        role: agente.title,
        email: agente.email
      };
    }

    // Historial y mensajes
    const messages: Mensaje[] = [
      {
        id: `msg-${id}-1`,
        senderName: empresa.contact.split(' (')[0],
        senderRole: 'cliente',
        senderEmail: empresa.contactEmail,
        time: createdAtFormatted,
        timestamp: createdTimeMs,
        createdAtIso: createdAtIso,
        content: plantilla.descripcion
      }
    ];

    const history: EventoTicket[] = [
      {
        id: `evt-${id}-1`,
        action: 'Ticket creado',
        detail: `Ticket registrado con prioridad ${priority} y categoría "${plantilla.categoria}"`,
        user: empresa.contact.split(' (')[0],
        time: createdAtFormatted,
        timestamp: createdTimeMs,
        createdAtIso: createdAtIso
      }
    ];

    if (assignedAgent) {
      const assignTimeMs = createdTimeMs + 15 * 60 * 1000;
      const assignDate = new Date(assignTimeMs);
      history.push({
        id: `evt-${id}-2`,
        action: 'Agente asignado',
        detail: `Ticket asignado a ${assignedAgent.name}`,
        user: 'Sistema SFS',
        time: formatFechaBogota(assignDate, true),
        timestamp: assignTimeMs,
        createdAtIso: assignDate.toISOString()
      });

      // Mensaje de respuesta del soporte
      const replyTimeMs = createdTimeMs + 28 * 60 * 1000;
      const replyDate = new Date(replyTimeMs);
      messages.push({
        id: `msg-${id}-2`,
        senderName: assignedAgent.name,
        senderRole: 'soporte',
        senderEmail: assignedAgent.email,
        time: formatFechaBogota(replyDate, true),
        timestamp: replyTimeMs,
        createdAtIso: replyDate.toISOString(),
        content: `Hola. He recibido su solicitud respecto a "${plantilla.titulo}". Nuestro equipo se encuentra validando el comportamiento en los entornos de producción.`
      });

      // Nota interna (solo para el equipo interno, no visible para clientes)
      const noteTimeMs = createdTimeMs + 45 * 60 * 1000;
      const noteDate = new Date(noteTimeMs);
      messages.push({
        id: `msg-${id}-3`,
        senderName: assignedAgent.name,
        senderRole: 'soporte',
        senderEmail: assignedAgent.email,
        time: formatFechaBogota(noteDate, true),
        timestamp: noteTimeMs,
        createdAtIso: noteDate.toISOString(),
        isInternal: true,
        content: `[Nota interna de soporte]: Se verificó la traza de logs en los servidores de ${empresa.name}. Revisando si se requiere parche de emergencia o reinicio del microservicio.`
      });
    }

    if (isResolvedOrClosed) {
      const resolveTimeMs = createdTimeMs + (rng() * reglaSla.solucionHoras * 0.8 * 3600 * 1000);
      const resolveDate = new Date(resolveTimeMs);
      history.push({
        id: `evt-${id}-3`,
        action: 'Ticket resuelto',
        detail: `Incidente resuelto satisfactoriamente por ${assignedAgent?.name || 'Soporte SFS'}`,
        user: assignedAgent?.name || 'Soporte SFS',
        time: formatFechaBogota(resolveDate, true),
        timestamp: resolveTimeMs,
        createdAtIso: resolveDate.toISOString()
      });
    }

    const ticket: Ticket = {
      id,
      code,
      title: plantilla.titulo,
      description: plantilla.descripcion,
      company: empresa.name,
      companyNit: empresa.nit,
      requesterName: empresa.contact.split(' (')[0],
      requesterTitle: empresa.contact.includes('(') ? empresa.contact.split('(')[1].replace(')', '') : 'Coordinador',
      requesterEmail: empresa.contactEmail,
      requesterPhone: empresa.contactPhone,
      module: plantilla.modulo,
      category: plantilla.categoria,
      tags: plantilla.tags,
      priority,
      status,
      assignedAgent,
      createdAt: createdAtFormatted,
      createdAtIso,
      createdHoursAgo,
      slaLimit: formatFechaBogota(slaSolutionLimitDate, true),
      slaLimitIso: slaSolutionLimitDate.toISOString(),
      slaFirstResponseLimitIso: slaFirstResponseLimitDate.toISOString(),
      slaMinutesRemaining: slaEstado.slaMinutesRemaining,
      slaFormatted: slaEstado.slaFormatted,
      slaRemainingPercent: slaEstado.slaRemainingPercent,
      isBreached: slaEstado.isBreached,
      resolutionTime: isResolvedOrClosed ? 'Resuelto en SLA' : undefined,
      messages,
      history
    };

    tickets.push(ticket);
  }

  return tickets;
}

// Almacén en memoria de tickets del servidor
export let SERVER_TICKETS_DATABASE: Ticket[] = generarTicketsSemilla();

export function obtenerTicketsServidor(): Ticket[] {
  return SERVER_TICKETS_DATABASE;
}

export function reiniciarTicketsServidor(): void {
  SERVER_TICKETS_DATABASE = generarTicketsSemilla();
}

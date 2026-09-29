import { Ticket, User, KPIStats, Announcement } from '../types';

export const INITIAL_USERS: Record<string, User> = {
  cliente: {
    id: 'usr-cliente-1',
    name: 'Juan Camilo Duque',
    email: 'cliente@trilladoralamanuela.co',
    role: 'cliente',
    title: 'Jefe de logística',
    company: 'Trilladora La Manuela',
    phone: '+57 (6) 880-1234',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    mustChangePassword: true,
  },
  agente: {
    id: 'usr-agente-1',
    name: 'Laura Yepes',
    email: 'agente@sfs.co',
    role: 'agente',
    title: 'Especialista L2 de soporte',
    company: 'Software Factory and Services',
    phone: '+57 (4) 444-1234',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    mustChangePassword: false,
  },
  supervisor: {
    id: 'usr-supervisor-1',
    name: 'Andrés Moreno',
    email: 'supervisor@sfs.co',
    role: 'supervisor',
    title: 'Supervisor de soporte y SLA',
    company: 'Software Factory and Services',
    phone: '+57 (1) 742-9900',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
    mustChangePassword: false,
  },
  admin: {
    id: 'usr-admin-1',
    name: 'Carlos M. Restrepo',
    email: 'admin@sfs.co',
    role: 'admin',
    title: 'Administrador del sistema',
    company: 'Software Factory and Services',
    phone: '+57 (1) 745-0000',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
    mustChangePassword: false,
  }
};

export const INITIAL_KPIS: KPIStats = {
  openToday: 14,
  openTodayDelta: '+2 respecto a ayer',
  firstResponseTime: '18 min 40 s',
  firstResponseTarget: 'Meta: <30 min',
  slaCompliancePercent: 96.8,
  criticalAtRisk: 3,
  criticalAtRiskDetail: '< 1 h SLA'
};

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Ventana de mantenimiento preventivo base de datos ERP',
    category: 'Mantenimiento programado',
    content: 'Este sábado entre las 11:00 p. m. y las 2:00 a. m. se realizará la optimización de índices y balanceo de carga en los clústeres de base de datos. Los servicios web estarán en modo contingencia.',
    date: 'Hoy 9:00 a. m.',
    author: 'Carlos M. Restrepo (Supervisor SFS)',
    priority: 'Normal'
  },
  {
    id: 'ann-2',
    title: 'Actualización obligatoria certificado de facturación DIAN',
    category: 'Aviso DIAN / Facturación',
    content: 'La DIAN programó un cambio de claves criptográficas para el próximo martes. Se solicita a todos los clientes validar la vigencia de su token corporativo en el portal de autoservicio.',
    date: 'Ayer 3:30 p. m.',
    author: 'Laura Yepes (DBA y soporte)',
    priority: 'Alta'
  },
  {
    id: 'ann-3',
    title: 'Nueva versión 3.4 del conector de básculas y pesaje IoT',
    category: 'Nuevo servicio',
    content: 'Se encuentra disponible la librería de enlace directo con indicadores de peso Toledo y Rice Lake para básculas camioneras, reduciendo la latencia de pesaje a menos de 50 ms.',
    date: 'Hace 2 d',
    author: 'Felipe Castaño (Integraciones)',
    priority: 'Normal'
  }
];

export const INITIAL_TICKETS: Ticket[] = [
  {
    id: 't-1024',
    code: '#SFS-1024',
    title: 'Error crítico 500 al emitir factura electrónica DIAN en módulo ERP',
    description: 'El servicio de timbrado no responde tras la actualización nocturna. No podemos despachar camiones con pedidos de exportación a puerto sin el comprobante legal emitido.',
    company: 'Café Quindío S.A.S.',
    companyNit: '890.102.455-8',
    requesterName: 'Claudia Mendoza',
    requesterTitle: 'Gerente de tecnología',
    requesterEmail: 'cmendoza@cafequindio.com',
    requesterPhone: '+57 (6) 745-8900',
    module: 'ERP Core',
    category: 'Facturación electrónica',
    tags: ['DIAN', 'ERP', 'Facturación'],
    priority: 'Crítica',
    status: 'En progreso',
    assignedAgent: {
      name: 'Andrés Moreno',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      role: 'Especialista L2 de soporte'
    },
    createdAt: 'Hoy 9:10 a. m.',
    createdHoursAgo: 'hace 2 h',
    slaLimit: 'Hoy a las 11:45 a. m.',
    slaMinutesRemaining: 38,
    slaFormatted: '38 min',
    slaRemainingPercent: 18, // < 20% -> Red
    messages: [
      {
        id: 'm-1',
        senderName: 'Claudia Mendoza (Cliente)',
        senderRole: 'cliente',
        time: '9:12 a. m.',
        timestamp: Date.now() - 32 * 60 * 1000,
        content: 'Adjunto captura de la pantalla de error HTTP 500 generada al momento de enviar el paquete de facturación al webservice de la DIAN. Varios camiones de carga de café verde no pueden salir de bodega Armenia sin este comprobante legal emitido. Urge solución.',
        attachment: {
          name: 'error_dian_payload.log',
          size: '12 KB'
        }
      },
      {
        id: 'm-2',
        senderName: 'Andrés Moreno (SFS Soporte)',
        senderRole: 'soporte',
        time: '9:25 a. m.',
        timestamp: Date.now() - 19 * 60 * 1000,
        content: 'Buenos días Claudia. Estamos revisando el tiempo de espera en el token de autenticación del certificado digital con el servidor de la DIAN. En 15 minutos emitimos la actualización correctiva.'
      }
    ],
    history: [
      {
        id: 'h-1',
        action: 'Ticket creado',
        detail: 'Radicado por Claudia Mendoza vía correo corporativo',
        user: 'Sistema',
        time: '9:10 a. m.',
        timestamp: Date.now() - 35 * 60 * 1000
      },
      {
        id: 'h-2',
        action: 'Prioridad asignada',
        detail: 'Clasificado como prioridad Crítica por impacto operativo',
        user: 'Carlos M. Restrepo',
        time: '9:12 a. m.',
        timestamp: Date.now() - 33 * 60 * 1000
      },
      {
        id: 'h-3',
        action: 'Asignación de agente',
        detail: 'Asignado a Andrés Moreno para atención inmediata',
        user: 'Carlos M. Restrepo',
        time: '9:15 a. m.',
        timestamp: Date.now() - 30 * 60 * 1000
      }
    ]
  },
  {
    id: 't-1025',
    code: '#SFS-1025',
    title: 'Inconsistencia en cálculo de liquidación de fletes cafeteros',
    description: 'La tarifa base de transporte desde Manizales a Buenaventura no toma el descuento por volumen acordado en la última licitación de transporte multimodal.',
    company: 'Trilladora La Manuela',
    companyNit: '800.231.908-1',
    requesterName: 'Juan Camilo Duque',
    requesterTitle: 'Jefe de logística',
    requesterEmail: 'jduque@lamanuela.com',
    requesterPhone: '+57 (6) 887-2100',
    module: 'Logística y acopio',
    category: 'Logística y fletes',
    tags: ['Fletes', 'Liquidación', 'Transporte'],
    priority: 'Alta',
    status: 'Asignado',
    assignedAgent: {
      name: 'Laura Yepes',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
      role: 'Especialista DBA y soporte'
    },
    createdAt: 'Hoy 8:30 a. m.',
    createdHoursAgo: 'hace 3 h',
    slaLimit: 'Hoy a las 2:30 p. m.',
    slaMinutesRemaining: 135,
    slaFormatted: '2 h 15 min',
    slaRemainingPercent: 42, // 20% - 50% -> Amber
    messages: [
      {
        id: 'm-25-1',
        senderName: 'Juan Camilo Duque (Cliente)',
        senderRole: 'cliente',
        time: '8:30 a. m.',
        timestamp: Date.now() - 3 * 3600 * 1000,
        content: 'En la corrida de las 8:00 a. m. los fletes hacia Buenaventura liquidaron a tarifa plana sin el 12 % por volumen en viajes de más de 30 toneladas.'
      }
    ],
    history: [
      {
        id: 'h-25-1',
        action: 'Ticket creado',
        detail: 'Radicado por Juan Camilo Duque',
        user: 'Sistema',
        time: '8:30 a. m.',
        timestamp: Date.now() - 3 * 3600 * 1000
      },
      {
        id: 'h-25-2',
        action: 'Asignación',
        detail: 'Asignado a Laura Yepes',
        user: 'Carlos M. Restrepo',
        time: '8:45 a. m.',
        timestamp: Date.now() - 2.8 * 3600 * 1000
      }
    ]
  },
  {
    id: 't-1026',
    code: '#SFS-1026',
    title: 'Bloqueo de acceso usuario supervisor por intentos fallidos de autenticación',
    description: 'Usuario de gerencia de operaciones reporta cuenta bloqueada sin recibir el correo de restablecimiento del token multifactor.',
    company: 'Exportadora del Eje',
    companyNit: '900.551.402-3',
    requesterName: 'Sandra Milena Ortiz',
    requesterTitle: 'Coordinadora administrativa',
    requesterEmail: 'sortiz@exportadoradeleje.com',
    requesterPhone: '+57 (6) 731-4560',
    module: 'Seguridad y portal',
    category: 'Seguridad y accesos',
    tags: ['MFA', 'Accesos', 'Autenticación'],
    priority: 'Media',
    status: 'Nuevo',
    createdAt: 'Hoy 10:15 a. m.',
    createdHoursAgo: 'hace 45 min',
    slaLimit: 'Hoy a las 4:00 p. m.',
    slaMinutesRemaining: 340,
    slaFormatted: '5 h 40 min',
    slaRemainingPercent: 78, // > 50% -> Green
    messages: [
      {
        id: 'm-26-1',
        senderName: 'Sandra Milena Ortiz (Cliente)',
        senderRole: 'cliente',
        time: '10:15 a. m.',
        timestamp: Date.now() - 45 * 60 * 1000,
        content: 'El usuario supervisor de planta tiene la sesión bloqueada y requiere autorizar pedidos urgentes antes de las 11:00 a. m.'
      }
    ],
    history: [
      {
        id: 'h-26-1',
        action: 'Ticket creado',
        detail: 'Ingresado por formulario web de clientes',
        user: 'Sistema',
        time: '10:15 a. m.',
        timestamp: Date.now() - 45 * 60 * 1000
      }
    ]
  },
  {
    id: 't-1023',
    code: '#SFS-1023',
    title: 'Consulta sobre integración Webhook para pesaje en báscula de recibo',
    description: 'Solicitud de especificación técnica del payload para el pesaje automático con sensores en patio de recibo de café pergamino.',
    company: 'Almacafé S.A.',
    companyNit: '860.007.820-9',
    requesterName: 'Diego Fernando Rojas',
    requesterTitle: 'Ingeniero de automatización',
    requesterEmail: 'drojas@almacafe.com.co',
    requesterPhone: '+57 (1) 294-0000',
    module: 'API y conectores',
    category: 'Conectividad hardware',
    tags: ['Báscula', 'Webhook', 'API'],
    priority: 'Baja',
    status: 'En espera del cliente',
    assignedAgent: {
      name: 'Felipe Castaño',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
      role: 'Consultor de integraciones'
    },
    createdAt: 'Ayer 4:30 p. m.',
    createdHoursAgo: 'ayer',
    slaLimit: 'Mañana a las 10:00 a. m.',
    slaMinutesRemaining: 900,
    slaFormatted: '15 h 00 min',
    slaRemainingPercent: 65, // > 50% -> Green
    messages: [
      {
        id: 'm-23-1',
        senderName: 'Felipe Castaño (SFS Soporte)',
        senderRole: 'soporte',
        time: 'Ayer 5:10 p. m.',
        timestamp: Date.now() - 20 * 3600 * 1000,
        content: 'Hola Diego, enviamos la especificación OpenAPI v3. Quedamos atentos al archivo de captura serial del indicador digital.'
      }
    ],
    history: [
      {
        id: 'h-23-1',
        action: 'Cambio de estado',
        detail: 'Puesto en espera de respuesta técnica del cliente',
        user: 'Felipe Castaño',
        time: 'Ayer 5:10 p. m.',
        timestamp: Date.now() - 20 * 3600 * 1000
      }
    ]
  },
  {
    id: 't-1020',
    code: '#SFS-1020',
    title: 'Solicitud de nuevo reporte personalizado de trazabilidad y catación de exportación',
    description: 'Generación de vista agregada con lotes de catación superior a 84 puntos agrupados por finca y municipio de procedencia.',
    company: 'Café Quindío S.A.S.',
    companyNit: '890.102.455-8',
    requesterName: 'Marcela Gómez',
    requesterTitle: 'Líder de calidad',
    requesterEmail: 'mgomez@cafequindio.com',
    requesterPhone: '+57 (6) 745-8900',
    module: 'Business Intelligence',
    category: 'Reportes BI',
    tags: ['BI', 'Catación', 'Exportación'],
    priority: 'Media',
    status: 'En progreso',
    assignedAgent: {
      name: 'Felipe Castaño',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
      role: 'Consultor de integraciones'
    },
    createdAt: 'Ayer 9:00 a. m.',
    createdHoursAgo: 'ayer',
    slaLimit: 'Mañana a las 1:00 p. m.',
    slaMinutesRemaining: 1680,
    slaFormatted: '28 h 00 min',
    slaRemainingPercent: 62, // > 50% -> Green
    messages: [
      {
        id: 'm-20-1',
        senderName: 'Marcela Gómez (Cliente)',
        senderRole: 'cliente',
        time: 'Ayer 9:00 a. m.',
        timestamp: Date.now() - 26 * 3600 * 1000,
        content: 'Necesitamos incluir la calificación por catador certificado en la columna F del exportable en Excel.'
      }
    ],
    history: [
      {
        id: 'h-20-1',
        action: 'Ticket asignado',
        detail: 'Asignado a Felipe Castaño para diseño de consulta SQL',
        user: 'Carlos M. Restrepo',
        time: 'Ayer 9:30 a. m.',
        timestamp: Date.now() - 25.5 * 3600 * 1000
      }
    ]
  },
  {
    id: 't-1018',
    code: '#SFS-1018',
    title: 'Lentitud intermitente severa en consulta de inventario bodega Manizales',
    description: 'Los tiempos de respuesta superan los 45 segundos al consultar saldos de sacos de café excelso en la sede Manizales durante el pico de despacho.',
    company: 'Trilladora La Manuela',
    companyNit: '800.231.908-1',
    requesterName: 'Germán Pardo',
    requesterTitle: 'Administrador de planta',
    requesterEmail: 'gpardo@lamanuela.com',
    requesterPhone: '+57 (6) 887-2100',
    module: 'Base de datos',
    category: 'Infraestructura',
    tags: ['Base de datos', 'Inventario', 'Rendimiento'],
    priority: 'Alta',
    status: 'En progreso',
    isBreached: true,
    assignedAgent: {
      name: 'Laura Yepes',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
      role: 'Especialista DBA y soporte'
    },
    createdAt: 'Hoy 7:00 a. m.',
    createdHoursAgo: 'hace 4 h',
    slaLimit: 'Venció hace 45 min',
    slaMinutesRemaining: -45,
    slaFormatted: 'SLA vencido',
    slaRemainingPercent: 0, // Red
    messages: [
      {
        id: 'm-18-1',
        senderName: 'Germán Pardo (Cliente)',
        senderRole: 'cliente',
        time: '7:00 a. m.',
        timestamp: Date.now() - 4 * 3600 * 1000,
        content: 'El módulo de inventario se queda congelado cuando 5 auxiliares intentan leer códigos de barras simultáneamente.'
      },
      {
        id: 'm-18-2',
        senderName: 'Laura Yepes (SFS Soporte)',
        senderRole: 'soporte',
        time: '8:15 a. m.',
        timestamp: Date.now() - 2.5 * 3600 * 1000,
        content: 'Identificamos un bloqueo en la tabla de movimientos kardex por un índice fragmentado. Reindexando ahora.'
      }
    ],
    history: [
      {
        id: 'h-18-1',
        action: 'Alerta SLA vencido',
        detail: 'El tiempo acordado para resolución fue superado',
        user: 'Sistema SLA',
        time: '10:00 a. m.',
        timestamp: Date.now() - 45 * 60 * 1000
      }
    ]
  },
  {
    id: 't-1017',
    code: '#SFS-1017',
    title: 'Error de sincronización con servidor de pesas Toledo en puerto serial COM3',
    description: 'La báscula camionera pierde enlace periódicamente al recibir paquetes de peso bruto en el puente de pesaje.',
    company: 'Cooperativa del Huila',
    companyNit: '891.100.320-4',
    requesterName: 'Mauricio Valdés',
    requesterTitle: 'Jefe de sistemas',
    requesterEmail: 'mvaldes@coophuila.com.co',
    requesterPhone: '+57 (8) 871-3300',
    module: 'Hardware e IoT',
    category: 'Conectividad hardware',
    tags: ['Serial', 'Báscula', 'Hardware'],
    priority: 'Alta',
    status: 'En progreso',
    assignedAgent: {
      name: 'Andrés Moreno',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      role: 'Especialista L2 de soporte'
    },
    createdAt: 'Hoy 8:00 a. m.',
    createdHoursAgo: 'hace 3 h',
    slaLimit: 'Hoy a las 3:00 p. m.',
    slaMinutesRemaining: 190,
    slaFormatted: '3 h 10 min',
    slaRemainingPercent: 48, // 20-50% -> Amber
    messages: [
      {
        id: 'm-17-1',
        senderName: 'Mauricio Valdés (Cliente)',
        senderRole: 'cliente',
        time: '8:00 a. m.',
        timestamp: Date.now() - 3.5 * 3600 * 1000,
        content: 'El driver virtual COM pierde la tasa de baudios tras reiniciar el equipo de cómputo en caseta.'
      }
    ],
    history: []
  },
  {
    id: 't-1015',
    code: '#SFS-1015',
    title: 'Actualización de certificado digital para firma de guías de movilización',
    description: 'Reemplazo del certificado TLS .p12 para el portal de guías sanitarias de transporte cafetero.',
    company: 'Almacafé S.A.',
    companyNit: '860.007.820-9',
    requesterName: 'Javier Bedoya',
    requesterTitle: 'Oficial de seguridad TI',
    requesterEmail: 'jbedoya@almacafe.com.co',
    requesterPhone: '+57 (1) 294-0000',
    module: 'Seguridad digital',
    category: 'Seguridad y accesos',
    tags: ['Certificado', 'Seguridad', 'Firma'],
    priority: 'Baja',
    status: 'Resuelto',
    resolutionTime: 'Resuelto en 45 min',
    assignedAgent: {
      name: 'Laura Yepes',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
      role: 'Especialista DBA y soporte'
    },
    createdAt: 'Hoy 7:30 a. m.',
    createdHoursAgo: 'hace 4 h',
    slaLimit: 'Cumplido',
    slaMinutesRemaining: 0,
    slaFormatted: '45 min',
    slaRemainingPercent: 100,
    messages: [
      {
        id: 'm-15-1',
        senderName: 'Laura Yepes (SFS Soporte)',
        senderRole: 'soporte',
        time: '8:15 a. m.',
        timestamp: Date.now() - 3 * 3600 * 1000,
        content: 'Certificado instalado exitosamente en el almacén de claves de producción.'
      }
    ],
    history: []
  },
  {
    id: 't-1014',
    code: '#SFS-1014',
    title: 'Bloqueo en cálculo automático de liquidación de retenciones en la fuente',
    description: 'El módulo financiero arrojó error de división por cero al procesar compras a proveedores no responsables de IVA.',
    company: 'Café Quindío S.A.S.',
    companyNit: '890.102.455-8',
    requesterName: 'Carlos Mario López',
    requesterTitle: 'Contador General',
    requesterEmail: 'clopez@cafequindio.com',
    requesterPhone: '+57 (6) 745-8900',
    module: 'Módulo Financiero',
    category: 'Finanzas y contabilidad',
    tags: ['Impuestos', 'Retenciones', 'Finanzas'],
    priority: 'Alta',
    status: 'En progreso',
    assignedAgent: {
      name: 'Carlos M. Restrepo',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      role: 'Supervisor de soporte y SLA'
    },
    createdAt: 'Hoy 9:00 a. m.',
    createdHoursAgo: 'hace 2 h',
    slaLimit: 'Hoy a las 1:30 p. m.',
    slaMinutesRemaining: 120,
    slaFormatted: '2 h 00 min',
    slaRemainingPercent: 40, // Amber
    messages: [],
    history: []
  },
  {
    id: 't-1011',
    code: '#SFS-1011',
    title: 'Fallo de conexión API con el banco para conciliación automática',
    description: 'El webservice SOAP del banco retorna error de timeout durante el lote de transferencias de nómina quincenal.',
    company: 'Trilladora La Manuela',
    companyNit: '800.231.908-1',
    requesterName: 'Ana María Giraldo',
    requesterTitle: 'Tesorera',
    requesterEmail: 'agiraldo@lamanuela.com',
    requesterPhone: '+57 (6) 887-2100',
    module: 'Integraciones bancarias',
    category: 'Finanzas y contabilidad',
    tags: ['Bancos', 'Conciliación', 'SOAP'],
    priority: 'Crítica',
    status: 'Nuevo',
    createdAt: 'Hoy 10:30 a. m.',
    createdHoursAgo: 'hace 30 min',
    slaLimit: 'Hoy a las 11:30 a. m.',
    slaMinutesRemaining: 40,
    slaFormatted: '40 min',
    slaRemainingPercent: 19, // < 20% -> Red
    messages: [],
    history: []
  },
  {
    id: 't-1009',
    code: '#SFS-1009',
    title: 'Cierre fiscal mensual de inventario bloqueado por documento sin contabilizar',
    description: 'Una remisión de traslado de bodega Armenia a bodega Pereira quedó en estado pendiente impidiendo el corte contable.',
    company: 'Café Quindío S.A.S.',
    companyNit: '890.102.455-8',
    requesterName: 'Claudia Mendoza',
    requesterTitle: 'Gerente de tecnología',
    requesterEmail: 'cmendoza@cafequindio.com',
    requesterPhone: '+57 (6) 745-8900',
    module: 'Contabilidad general',
    category: 'Finanzas y contabilidad',
    tags: ['Cierre mensual', 'Inventario'],
    priority: 'Media',
    status: 'Resuelto',
    resolutionTime: 'Resuelto en 24 min',
    assignedAgent: {
      name: 'Laura Yepes',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
      role: 'Especialista DBA y soporte'
    },
    createdAt: 'Hoy 9:40 a. m.',
    createdHoursAgo: 'hace 1 h',
    slaLimit: 'Cumplido',
    slaMinutesRemaining: 0,
    slaFormatted: '24 min',
    slaRemainingPercent: 100,
    messages: [],
    history: []
  },
  {
    id: 't-1012',
    code: '#SFS-1012',
    title: 'Actualización de certificado SSL en subdominio portal clientes',
    description: 'Renovación de certificado digital comodín para el portal de autoservicio de clientes.',
    company: 'Café Quindío S.A.S.',
    companyNit: '890.102.455-8',
    requesterName: 'Claudia Mendoza',
    requesterTitle: 'Gerente de tecnología',
    requesterEmail: 'cmendoza@cafequindio.com',
    requesterPhone: '+57 (6) 745-8900',
    module: 'Infraestructura web',
    category: 'Seguridad y accesos',
    tags: ['SSL', 'Seguridad', 'Portal'],
    priority: 'Baja',
    status: 'Cerrado',
    resolutionTime: 'Resuelto en 45 min',
    assignedAgent: {
      name: 'Andrés Moreno',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      role: 'Especialista L2 de soporte'
    },
    createdAt: 'Hoy 8:15 a. m.',
    createdHoursAgo: 'hace 3 h',
    slaLimit: 'Cumplido',
    slaMinutesRemaining: 0,
    slaFormatted: '45 min',
    slaRemainingPercent: 100,
    messages: [],
    history: []
  }
];

export const COMPANIES_LIST = [
  'Café Quindío S.A.S.',
  'Trilladora La Manuela',
  'Almacafé S.A.',
  'Exportadora del Eje',
  'Cooperativa del Huila',
  'Infraestructura Core'
];

export const CATEGORIES_LIST = [
  'Facturación electrónica',
  'Logística y fletes',
  'Seguridad y accesos',
  'Conectividad hardware',
  'Reportes BI',
  'Infraestructura',
  'Finanzas y contabilidad'
];

export const AGENTS_LIST = [
  'Andrés Moreno',
  'Laura Yepes',
  'Felipe Castaño',
  'Carlos M. Restrepo'
];

export const MACROS_PREDEFINIDAS = [
  {
    id: 'm1',
    label: 'Recepción y análisis inicial',
    text: 'Estimado cliente, hemos recibido su reporte. El equipo de soporte técnico se encuentra validando los registros del sistema para emitir la solución en los tiempos pactados en el acuerdo de nivel de servicio.'
  },
  {
    id: 'm2',
    label: 'Solicitud de capturas y registros de error',
    text: 'Agradecemos compartir captura de pantalla completa del mensaje de error, archivo de registro (.log) y el identificador de usuario con el que se presentó el incidente.'
  },
  {
    id: 'm3',
    label: 'Pase a pruebas en entorno de contingencia',
    text: 'La corrección fue desplegada en el contenedor de pruebas. Por favor valide el comportamiento con su equipo operativo para proceder al cierre formal del caso.'
  },
  {
    id: 'm4',
    label: 'Cierre y solución satisfactoria',
    text: 'Confirmamos la resolución del incidente. El servicio opera en parámetros nominales y el caso ha sido marcado como resuelto. Quedamos a su disposición.'
  }
];

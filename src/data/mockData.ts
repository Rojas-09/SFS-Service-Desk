/**
 * Constantes visuales y catálogos de apoyo para la interfaz cliente.
 * 
 * NOTA DE ARQUITECTURA (Requirement 1):
 * Los tickets, usuarios e histórico fueron migrados a server/data/seed.ts.
 * El frontend consume exclusivamente la API protegida del servidor y no almacena
 * datos simulados en memoria local.
 */

import { Macro, Anuncio, Empresa } from '../types';

// Las 4 empresas cliente activas según el brief (sin cooperativas ni empresa interna)
export const COMPANIES_LIST: string[] = [
  'Café Quindío S.A.S.',
  'Trilladora La Manuela',
  'Exportadora del Eje',
  'Almacafé S.A.'
];

// Detalle de empresas cliente vinculadas
export const EMPRESAS_CATALOGO: Empresa[] = [
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

// Las 5 categorías requeridas del brief
export const CATEGORIES_LIST: string[] = [
  'Error del sistema',
  'Duda de uso',
  'Solicitud de cambio',
  'Acceso/usuarios',
  'Otro'
];

// Módulos y productos afectados (campo independiente según requirement 6)
export const MODULES_LIST: string[] = [
  'Portal Web Clientes',
  'Módulo ERP Facturación',
  'App Móvil Logística',
  'Básculas y Pesaje IoT',
  'API Integración Bancaria',
  'Reportes DIAN',
  'Infraestructura y Base de Datos'
];

// Los 5 agentes de soporte con cuenta real
export const AGENTS_LIST: string[] = [
  'Laura Yepes',
  'Felipe Castaño',
  'Valentina Ríos',
  'Mateo Gómez',
  'Daniel Ospina'
];

// Macros predefinidas para respuestas rápidas
export const MACROS_PREDEFINIDAS: Macro[] = [
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

// Anuncios informativos para la vista de comunicados
export const INITIAL_ANNOUNCEMENTS: Anuncio[] = [
  {
    id: 'ann-1',
    title: 'Ventana de mantenimiento preventivo base de datos ERP',
    category: 'Mantenimiento programado',
    content: 'Este sábado entre las 11:00 p. m. y las 2:00 a. m. se realizará la optimización de índices y balanceo de carga en los clústeres de base de datos. Los servicios web estarán en modo contingencia.',
    date: '28/09/2026, 09:00 a. m.',
    author: 'Carlos M. Restrepo (Administrador)',
    priority: 'Normal'
  },
  {
    id: 'ann-2',
    title: 'Actualización obligatoria certificado de facturación DIAN',
    category: 'Aviso DIAN / Facturación',
    content: 'La DIAN programó un cambio de claves criptográficas para el próximo martes. Se solicita a todos los clientes validar la vigencia de su token corporativo en el portal de autoservicio.',
    date: '27/09/2026, 03:30 p. m.',
    author: 'Laura Yepes (Especialista soporte)',
    priority: 'Alta'
  },
  {
    id: 'ann-3',
    title: 'Nueva versión 3.4 del conector de básculas y pesaje IoT',
    category: 'Nuevo servicio',
    content: 'Se encuentra disponible la librería de enlace directo con indicadores de peso Toledo y Rice Lake para básculas camioneras, reduciendo la latencia de pesaje a menos de 50 ms.',
    date: '25/09/2026, 10:15 a. m.',
    author: 'Felipe Castaño (Integraciones)',
    priority: 'Normal'
  }
];

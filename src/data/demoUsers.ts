import { User } from '../types';

const avatar = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80';

const definitions: Array<[string, string, User['role'], string]> = [
  ['Laura Yepes', 'agente@sfs.co', 'agente', 'Especialista L2 de soporte'],
  ['Felipe Castaño', 'felipe.castano@sfs.co', 'agente', 'Especialista en hardware e integraciones'],
  ['Valentina Ríos', 'valentina.rios@sfs.co', 'agente', 'Ingeniera de soporte ERP'],
  ['Mateo Gómez', 'mateo.gomez@sfs.co', 'agente', 'Analista de soporte financiero'],
  ['Daniel Ospina', 'daniel.ospina@sfs.co', 'agente', 'Especialista en conectividad'],
  ['Andrés Moreno', 'supervisor@sfs.co', 'supervisor', 'Supervisor de operaciones y SLA'],
  ['Carlos M. Restrepo', 'admin@sfs.co', 'admin', 'Administrador del sistema'],
  ['Claudia Mendoza', 'cliente@cafequindio.com', 'cliente', 'Gerente de tecnología'],
  ['Juan Camilo Duque', 'cliente@trilladoralamanuela.co', 'cliente', 'Jefe de logística'],
  ['Sandra Milena Ortiz', 'cliente@exportadoradeleje.com', 'cliente', 'Directora administrativa'],
  ['Diego Fernando Rojas', 'cliente@almacafe.com.co', 'cliente', 'Líder de infraestructura']
];

export const DEMO_USERS: User[] = definitions.map(([name, email, role, title], index) => ({
  id: `demo-user-${index + 1}`,
  name,
  email,
  role,
  title,
  avatar,
  company: role === 'cliente' ? undefined : 'Software Factory and Services'
}));

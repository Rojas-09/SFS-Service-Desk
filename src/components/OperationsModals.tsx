import React, { useState } from 'react';
import { Ticket, Announcement } from '../types';

interface MetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickets: Ticket[];
}

export const MetricsModal: React.FC<MetricsModalProps> = ({ isOpen, onClose, tickets }) => {
  if (!isOpen) return null;

  const total = tickets.length;
  const resolved = tickets.filter(t => t.status === 'Resuelto' || t.status === 'Cerrado').length;
  const breached = tickets.filter(t => t.isBreached || t.slaMinutesRemaining <= 0).length;
  const inProgress = tickets.filter(t => t.status === 'En progreso' || t.status === 'Asignado').length;
  const compliance = total > 0 ? (((total - breached) / total) * 100).toFixed(1) : '100';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-2xl">analytics</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Métricas operativas y acuerdos SLA
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Panel analítico en tiempo real · Software Factory and Services
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* 4 Indicadores Principales */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Total incidentes
              </span>
              <span className="text-2xl font-bold font-mono text-slate-900 block mt-1">
                {total}
              </span>
              <span className="text-xs text-blue-600 font-semibold">100 % monitoreados</span>
            </div>

            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                Cumplimiento SLA
              </span>
              <span className="text-2xl font-bold font-mono text-emerald-700 block mt-1">
                {compliance}%
              </span>
              <span className="text-xs text-emerald-600 font-semibold">Meta &gt; 96.0 %</span>
            </div>

            <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-200">
              <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block">
                En atención activa
              </span>
              <span className="text-2xl font-bold font-mono text-blue-700 block mt-1">
                {inProgress}
              </span>
              <span className="text-xs text-blue-600 font-semibold">{resolved} resueltos</span>
            </div>

            <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200">
              <span className="text-xs font-bold text-rose-800 uppercase tracking-wider block">
                Casos en riesgo
              </span>
              <span className="text-2xl font-bold font-mono text-rose-700 block mt-1">
                {breached}
              </span>
              <span className="text-xs text-rose-600 font-semibold">&lt; 20 % o vencido</span>
            </div>
          </div>

          {/* Desglose por Niveles de Severidad */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Distribución por nivel de severidad (Acuerdos de servicio)
            </h4>
            <div className="space-y-2 text-xs">
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-rose-700">Crítica (SLA: 45 min)</span>
                  <span className="font-mono text-slate-700">
                    {tickets.filter(t => t.priority === 'Crítica').length} casos
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-rose-600 h-2 rounded-full" style={{ width: '25%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-orange-700">Alta (SLA: 2 h 00 min)</span>
                  <span className="font-mono text-slate-700">
                    {tickets.filter(t => t.priority === 'Alta').length} casos
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-[#F37021] h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-blue-700">Media (SLA: 6 h 00 min)</span>
                  <span className="font-mono text-slate-700">
                    {tickets.filter(t => t.priority === 'Media').length} casos
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-slate-700">Baja (SLA: 24 h 00 min)</span>
                  <span className="font-mono text-slate-700">
                    {tickets.filter(t => t.priority === 'Baja').length} casos
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-slate-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

// ================= MODAL ANUNCIOS (BRIEF REQUIREMENT 6) =================
interface AnnouncementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcements: Announcement[];
  onAddAnnouncement: (announcement: Announcement) => void;
}

export const AnnouncementsModal: React.FC<AnnouncementsModalProps> = ({
  isOpen,
  onClose,
  announcements,
  onAddAnnouncement
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Mantenimiento programado');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'Alta' | 'Normal'>('Normal');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onAddAnnouncement({
      id: `ann-${Date.now()}`,
      title: title.trim(),
      category,
      content: content.trim(),
      date: 'Hoy 10:00 a. m.',
      author: 'Carlos M. Restrepo (Supervisor SFS)',
      priority
    });
    setTitle('');
    setContent('');
    setShowCreateForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-2xl">campaign</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Anuncios y comunicados oficiales
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Difusión operativa a clientes y equipo técnico SFS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Barra de cabecera con botón crear */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Comunicados activos ({announcements.length})
            </span>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-semibold border border-blue-200 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">
                {showCreateForm ? 'close' : 'add'}
              </span>
              <span>{showCreateForm ? 'Cancelar' : 'Publicar anuncio'}</span>
            </button>
          </div>

          {/* Formulario para publicar nuevo anuncio */}
          {showCreateForm && (
            <form onSubmit={handleSubmit} className="p-4 rounded-2xl border border-blue-200 bg-blue-50/30 space-y-3 animate-in fade-in duration-150">
              <h4 className="text-xs font-bold text-slate-900">Nuevo comunicado operativo</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Título del anuncio</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej. Ventana de mantenimiento nocturno ERP"
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Categoría</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="Mantenimiento programado">Mantenimiento programado</option>
                    <option value="Actualización de seguridad">Actualización de seguridad</option>
                    <option value="Aviso DIAN / Facturación">Aviso DIAN / Facturación</option>
                    <option value="Nuevo servicio">Nuevo servicio</option>
                  </select>
                </div>
              </div>

              <div className="text-xs">
                <label className="block text-slate-600 font-medium mb-1">Mensaje para clientes y agentes</label>
                <textarea
                  required
                  rows={3}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Detalles sobre el alcance, horarios y servicios afectados..."
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={priority === 'Alta'}
                    onChange={(e) => setPriority(e.target.checked ? 'Alta' : 'Normal')}
                    className="rounded text-blue-600"
                  />
                  <span>Marcar con prioridad alta (Aviso crítico)</span>
                </label>

                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Publicar ahora
                </button>
              </div>
            </form>
          )}

          {/* Lista de Anuncios */}
          <div className="space-y-3">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        ann.priority === 'Alta'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {ann.category}
                    </span>
                    {ann.priority === 'Alta' && (
                      <span className="text-xs font-bold text-rose-600 uppercase flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-xs">warning</span>
                        Prioridad alta
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 font-medium">{ann.date}</span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 leading-snug">{ann.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{ann.content}</p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>Publicado por: {ann.author}</span>
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                    Activo
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

// ================= MODAL EMPRESAS CLIENTE =================
interface CompaniesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFilterByCompany: (company: string) => void;
}

export const CompaniesModal: React.FC<CompaniesModalProps> = ({ isOpen, onClose, onFilterByCompany }) => {
  if (!isOpen) return null;

  const companies = [
    {
      name: 'Café Quindío S.A.S.',
      nit: '890.102.455-8',
      tier: 'Platinum SLA',
      sede: 'Armenia, Quindío',
      activeTickets: 5,
      contact: 'Claudia Mendoza (Gerente de tecnología)'
    },
    {
      name: 'Trilladora La Manuela',
      nit: '800.231.908-1',
      tier: 'Gold SLA',
      sede: 'Manizales, Caldas',
      activeTickets: 3,
      contact: 'Juan Camilo Duque (Logística)'
    },
    {
      name: 'Almacafé S.A.',
      nit: '860.007.820-9',
      tier: 'Enterprise SLA',
      sede: 'Bogotá D.C. / Pereira',
      activeTickets: 2,
      contact: 'Diego Fernando Rojas (Básculas)'
    },
    {
      name: 'Exportadora del Eje',
      nit: '900.551.402-3',
      tier: 'Platinum SLA',
      sede: 'Pereira, Risaralda',
      activeTickets: 2,
      contact: 'Sandra Milena Ortiz (Administración)'
    },
    {
      name: 'Cooperativa del Huila',
      nit: '891.100.320-4',
      tier: 'Gold SLA',
      sede: 'Neiva, Huila',
      activeTickets: 1,
      contact: 'Mauricio Valdés (Sistemas)'
    },
    {
      name: 'Infraestructura Core',
      nit: '901.442.110-0',
      tier: 'Internal SLA 99.99%',
      sede: 'Medellín / Cloud',
      activeTickets: 1,
      contact: 'Andrés Moreno (SysAdmin)'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-2xl">corporate_fare</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Empresas cliente con convenio SLA
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cartera de cuentas corporativas activas en Software Factory and Services
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="p-6 space-y-3 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {companies.map((c) => (
            <div
              key={c.name}
              className="p-4 rounded-2xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/20 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-slate-900">{c.name}</h4>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    {c.tier}
                  </span>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-3">
                  <span>NIT: <strong className="font-mono text-slate-700">{c.nit}</strong></span>
                  <span>·</span>
                  <span>{c.sede}</span>
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  Contacto: {c.contact}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-mono font-bold">
                  {c.activeTickets} tickets
                </span>
                <button
                  onClick={() => {
                    onFilterByCompany(c.name);
                    onClose();
                  }}
                  className="px-3 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Ver casos
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

// ================= MODAL USUARIOS Y AGENTES =================
interface UsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchUser: (role: any) => void;
}

export const UsersModal: React.FC<UsersModalProps> = ({ isOpen, onClose, onSwitchUser }) => {
  if (!isOpen) return null;

  const usersList = [
    {
      name: 'Carlos M. Restrepo',
      role: 'supervisor',
      roleLabel: 'Supervisor de soporte y SLA',
      email: 'carlos.restrepo@sfs.com.co',
      status: 'En línea',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      activeCases: 4
    },
    {
      name: 'Andrés Moreno',
      role: 'agente',
      roleLabel: 'Especialista L2 de soporte',
      email: 'andres.moreno@sfs.com.co',
      status: 'En línea',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      activeCases: 6
    },
    {
      name: 'Laura Yepes',
      role: 'agente',
      roleLabel: 'Especialista DBA y soporte',
      email: 'laura.yepes@sfs.com.co',
      status: 'En línea',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
      activeCases: 3
    },
    {
      name: 'Felipe Castaño',
      role: 'agente',
      roleLabel: 'Consultor funcional de ERP y BI',
      email: 'felipe.castano@sfs.com.co',
      status: 'En descanso',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
      activeCases: 3
    },
    {
      name: 'Claudia Mendoza',
      role: 'cliente',
      roleLabel: 'Gerente de tecnología (Café Quindío)',
      email: 'claudia.mendoza@cafequindio.com',
      status: 'Cliente activo',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
      activeCases: 2
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-2xl">group</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Directorio de usuarios y agentes de soporte
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Equipo técnico activo en la mesa operativa de Software Factory and Services
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="p-6 space-y-3 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {usersList.map((u) => (
            <div
              key={u.email}
              className="p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all flex items-center justify-between gap-3 shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={u.avatar}
                    alt={u.name}
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-blue-100"
                  />
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-white ${
                      u.status === 'En línea'
                        ? 'bg-emerald-500'
                        : u.status === 'En descanso'
                        ? 'bg-amber-500'
                        : 'bg-blue-500'
                    }`}
                  ></span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{u.name}</h4>
                  <span className="text-xs text-slate-600 block">{u.roleLabel}</span>
                  <span className="text-xs text-slate-400 block font-mono">{u.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">
                  {u.activeCases} asignados
                </span>
                <button
                  onClick={() => {
                    onSwitchUser(u.role);
                    onClose();
                  }}
                  className="px-3 py-1 bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-blue-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cambiar
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};

// ================= MODAL CONFIGURACIÓN =================
interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveToast: (msg: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSaveToast }) => {
  const [criticalSound, setCriticalSound] = useState(true);
  const [slaWarningHours, setSlaWarningHours] = useState('1');
  const [autoAssignment, setAutoAssignment] = useState(true);
  const [autoEmailNotify, setAutoEmailNotify] = useState(true);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveToast('Configuración operativa actualizada correctamente');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-2xl">settings</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Configuración del sistema
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Parámetros de SLA, alertas y canales de notificación
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <span className="font-bold text-slate-800 block text-xs">
                Alertas sonoras para incidentes críticos
              </span>
              <span className="text-xs text-slate-500">
                Emitir aviso acústico ante nuevos tickets de prioridad crítica
              </span>
            </div>
            <input
              type="checkbox"
              checked={criticalSound}
              onChange={(e) => setCriticalSound(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <span className="font-bold text-slate-800 block text-xs">
                Umbral de advertencia pre-vencimiento SLA
              </span>
              <span className="text-xs text-slate-500">
                Tiempo antes de expiración para activar el semáforo rojo
              </span>
            </div>
            <select
              value={slaWarningHours}
              onChange={(e) => setSlaWarningHours(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 font-semibold text-slate-800"
            >
              <option value="0.5">30 minutos</option>
              <option value="1">1 hora</option>
              <option value="2">2 horas</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <span className="font-bold text-slate-800 block text-xs">
                Asignación automática inteligente
              </span>
              <span className="text-xs text-slate-500">
                Distribuir automáticamente casos nuevos entre agentes disponibles
              </span>
            </div>
            <input
              type="checkbox"
              checked={autoAssignment}
              onChange={(e) => setAutoAssignment(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <span className="font-bold text-slate-800 block text-xs">
                Notificaciones por correo a clientes
              </span>
              <span className="text-xs text-slate-500">
                Enviar correo automático ante cambios de estado o respuestas
              </span>
            </div>
            <input
              type="checkbox"
              checked={autoEmailNotify}
              onChange={(e) => setAutoEmailNotify(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 cursor-pointer"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">Software Factory and Services</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 text-slate-600 hover:bg-slate-200 rounded-xl font-semibold cursor-pointer text-xs"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              Guardar cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

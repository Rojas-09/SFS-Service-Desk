import React from 'react';
import { useTickets } from '../../context/TicketsContext';
import { UserRole } from '../../types';
import { INITIAL_USERS } from '../../data/mockData';

interface UsersViewProps {
  onBackToConsole: () => void;
  onSwitchUser: (role: UserRole) => void;
}

export const UsersView: React.FC<UsersViewProps> = ({ onBackToConsole, onSwitchUser }) => {
  const { tickets, currentUser } = useTickets();

  const teamMembers = [
    {
      user: INITIAL_USERS.supervisor,
      role: 'supervisor' as UserRole,
      status: 'En línea',
      specialty: 'Gestión de acuerdos SLA y escalamiento de incidentes críticos'
    },
    {
      user: INITIAL_USERS.agente,
      role: 'agente' as UserRole,
      status: 'En línea',
      specialty: 'Atención L2, bases de datos y soporte funcional de aplicaciones'
    },
    {
      user: INITIAL_USERS.cliente,
      role: 'cliente' as UserRole,
      status: 'Cliente activo',
      specialty: 'Interlocutor corporativo de Café Quindío S.A.S.'
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#F5F7FB] p-6 custom-scrollbar select-none">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToConsole}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none"
              title="Volver a la consola"
            >
              <span className="material-symbols-outlined text-lg leading-none">arrow_back</span>
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Directorio de usuarios y agentes
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Equipo técnico activo en la mesa operativa de Software Factory and Services
              </p>
            </div>
          </div>

          <span className="text-xs text-slate-600 font-medium">
            Usuario actual: <strong className="text-slate-900 font-bold">{currentUser?.name || ''}</strong>
          </span>
        </div>

        {/* Lista de Miembros */}
        <div className="space-y-4">
          {teamMembers.map((member) => {
            const isCurrent = currentUser?.role === member.role;
            const assignedTickets = tickets.filter(
              t => t.assignedAgent?.name.toLowerCase().includes(member.user.name.split(' ')[0].toLowerCase()) &&
                t.status !== 'Resuelto' && t.status !== 'Cerrado'
            );

            return (
              <div
                key={member.user.id}
                className={`p-5 rounded-3xl border bg-white shadow-2xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isCurrent ? 'border-blue-600 ring-2 ring-blue-600/10' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={member.user.avatar}
                      alt={member.user.name}
                      className="w-13 h-13 rounded-full object-cover ring-2 ring-blue-100"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full ring-2 ring-white ${
                        member.status === 'En línea' ? 'bg-emerald-500' : 'bg-blue-500'
                      }`}
                    ></span>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-slate-900">{member.user.name}</h2>
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          Tú
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 font-medium">{member.user.title}</p>
                    <p className="text-xs text-slate-400 font-mono">{member.user.email}</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-md">{member.specialty}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  {member.role !== 'cliente' && (
                    <span className="px-3 py-1 bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200">
                      {assignedTickets.length} activos
                    </span>
                  )}

                  {!isCurrent && (
                    <button
                      onClick={() => onSwitchUser(member.role)}
                      className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold border border-blue-200 transition-colors cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    >
                      Cambiar a este perfil
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

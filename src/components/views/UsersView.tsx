import React, { useEffect, useState } from 'react';
import { useTickets } from '../../context/TicketsContext';
import { User, UserRole } from '../../types';
import { DEMO_USERS } from '../../data/demoUsers';

interface UsersViewProps {
  onBackToConsole: () => void;
  onSwitchUser: (user: User) => void;
}

export const UsersView: React.FC<UsersViewProps> = ({ onBackToConsole, onSwitchUser }) => {
  const { tickets, currentUser } = useTickets();
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.users)) {
            setUsersList(data.users);
          }
        } else if (currentUser?.id.startsWith('demo-')) {
          setUsersList(DEMO_USERS);
        }
      } catch {
        if (currentUser?.id.startsWith('demo-')) setUsersList(DEMO_USERS);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

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
                Directorio de usuarios y equipo SFS
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Equipo técnico activo y usuarios autorizados en la plataforma
              </p>
            </div>
          </div>

          <span className="text-xs text-slate-600 font-medium">
            Usuario actual: <strong className="text-slate-900 font-bold">{currentUser?.name || ''}</strong>
          </span>
        </div>

        {/* Lista de Miembros */}
        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {usersList.map((member) => {
              const isCurrent = currentUser?.id === member.id || currentUser?.email === member.email;
              const assignedTickets = tickets.filter(
                t =>
                  t.assignedAgent?.name.toLowerCase().includes(member.name.split(' ')[0].toLowerCase()) &&
                  t.status !== 'Resuelto' &&
                  t.status !== 'Cerrado'
              );

              return (
                <div
                  key={member.id}
                  className={`p-5 rounded-3xl border bg-white shadow-2xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isCurrent ? 'border-blue-600 ring-2 ring-blue-600/10' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={member.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'}
                        alt={member.name}
                        className="w-13 h-13 rounded-full object-cover ring-2 ring-blue-100"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full ring-2 ring-white ${
                          member.role === 'cliente' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                      ></span>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-slate-900">{member.name}</h2>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Tú
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                          {member.role}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">{member.title} &bull; {member.company || 'SFS'}</p>
                      <p className="text-xs text-slate-400 font-mono">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    {member.role !== 'cliente' && (
                      <span className="px-3 py-1 bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200">
                        {assignedTickets.length} activos
                      </span>
                    )}

                    {!isCurrent && import.meta.env.DEV && (
                      <button
                        onClick={() => onSwitchUser(member)}
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
        )}
      </div>
    </div>
  );
};

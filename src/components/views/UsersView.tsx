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
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#F5F7FB] dark:bg-[#081B3A] text-slate-800 dark:text-[#E8EEF9] p-3 sm:p-6 custom-scrollbar select-none transition-colors duration-200">
      <div className="max-w-5xl mx-auto w-full space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onBackToConsole}
              className="p-2 rounded-xl bg-white dark:bg-[#0E2A52] border border-slate-200 dark:border-[#1E3F73] text-slate-600 dark:text-[#E8EEF9] hover:text-blue-700 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-[#081B3A] transition-colors shadow-2xs cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none"
              title="Volver a la consola"
            >
              <span className="material-symbols-outlined text-lg leading-none">arrow_back</span>
            </button>
            <div>
              <h1 className="text-base sm:text-xl font-bold text-slate-900 dark:text-[#E8EEF9] tracking-tight">
                Directorio de usuarios y equipo SFS
              </h1>
              <p className="text-xs text-slate-500 dark:text-[#94A9CC] mt-0.5">
                Equipo técnico activo y usuarios autorizados en la plataforma
              </p>
            </div>
          </div>

          <span className="text-xs text-slate-600 dark:text-[#94A9CC] font-medium">
            Usuario actual: <strong className="text-slate-900 dark:text-[#E8EEF9] font-bold">{currentUser?.name || ''}</strong>
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
                  className={`p-4 sm:p-5 rounded-3xl border bg-white dark:bg-[#0E2A52] shadow-2xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 ${
                    isCurrent ? 'border-blue-600 ring-2 ring-blue-600/10 dark:ring-blue-400/20' : 'border-slate-200 dark:border-[#1E3F73] hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="relative flex-shrink-0">
                      <img
                        src={member.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'}
                        alt={member.name}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-100 dark:ring-blue-900"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full ring-2 ring-white dark:ring-[#0E2A52] ${
                          member.role === 'cliente' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                      ></span>
                    </div>

                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-[#E8EEF9]">{member.name}</h2>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                            Tú
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-[#081B3A] text-slate-700 dark:text-[#E8EEF9]">
                          {member.role}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-[#94A9CC] font-medium">{member.title} &bull; {member.company || 'SFS'}</p>
                      <p className="text-xs text-slate-400 dark:text-[#94A9CC]/70 font-mono">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 self-stretch sm:self-center justify-end flex-wrap">
                    {member.role !== 'cliente' && (
                      <span className="px-3 py-1 bg-slate-50 dark:bg-[#081B3A] text-slate-700 dark:text-[#E8EEF9] text-xs font-semibold rounded-xl border border-slate-200 dark:border-[#1E3F73]">
                        {assignedTickets.length} activos
                      </span>
                    )}

                    {!isCurrent && import.meta.env.DEV && (
                      <button
                        onClick={() => onSwitchUser(member)}
                        className="px-3.5 py-1.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold border border-blue-200 dark:border-blue-800/60 transition-colors cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none"
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

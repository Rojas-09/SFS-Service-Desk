import React from 'react';
import { useTickets } from '../../context/TicketsContext';
import { EMPRESAS_CATALOGO } from '../../data/mockData';

interface CompaniesViewProps {
  onBackToConsole: () => void;
  onFilterByCompany: (companyName: string) => void;
}

export const CompaniesView: React.FC<CompaniesViewProps> = ({ onBackToConsole, onFilterByCompany }) => {
  const { tickets } = useTickets();
  const companiesData = EMPRESAS_CATALOGO;

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#F5F7FB] dark:bg-[#081B3A] text-slate-800 dark:text-[#E8EEF9] p-3 sm:p-6 custom-scrollbar select-none transition-colors duration-200">
      <div className="max-w-6xl mx-auto w-full space-y-4 sm:space-y-6">
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
                Empresas cliente con convenio SLA
              </h1>
              <p className="text-xs text-slate-500 dark:text-[#94A9CC] mt-0.5">
                Cuentas corporativas activas gestionadas por Software Factory and Services
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
            {companiesData.length} empresas vinculadas
          </span>
        </div>

        {/* Grid de Empresas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {companiesData.map((c) => {
            const companyTickets = tickets.filter(t => t.company === c.name);
            const activeCompanyTickets = companyTickets.filter(t => t.status !== 'Resuelto' && t.status !== 'Cerrado');

            return (
              <div
                key={c.name}
                className="bg-white dark:bg-[#0E2A52] rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-[#1E3F73] hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-2xs flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-[#E8EEF9]">{c.name}</h2>
                      <p className="text-xs text-slate-500 dark:text-[#94A9CC] font-mono">NIT: {c.nit}</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                      {c.tier}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-[#E8EEF9] space-y-1 bg-slate-50 dark:bg-[#081B3A] p-3 rounded-2xl border border-slate-100 dark:border-[#1E3F73]">
                    <p className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-slate-400 dark:text-[#94A9CC]">location_on</span>
                      <span>{c.sede}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-slate-400 dark:text-[#94A9CC]">person</span>
                      <span>{c.contact}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-slate-400 dark:text-[#94A9CC]">mail</span>
                      <a href={`mailto:${c.contactEmail}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                        {c.contactEmail}
                      </a>
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-[#1E3F73] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-[#94A9CC]">Tickets activos:</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-[#E8EEF9] font-mono bg-slate-100 dark:bg-[#081B3A] px-2 py-0.5 rounded-lg border border-transparent dark:border-[#1E3F73]">
                      {activeCompanyTickets.length}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-[#94A9CC]/70">({companyTickets.length} total)</span>
                  </div>

                  <button
                    onClick={() => onFilterByCompany(c.name)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none flex items-center gap-1.5"
                  >
                    <span>Ver tickets</span>
                    <span className="material-symbols-outlined text-sm leading-none">arrow_forward</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

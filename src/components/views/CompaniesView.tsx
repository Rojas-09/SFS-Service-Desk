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
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#F5F7FB] p-6 custom-scrollbar select-none">
      <div className="max-w-6xl mx-auto w-full space-y-6">
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
                Empresas cliente con convenio SLA
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Cuentas corporativas activas gestionadas por Software Factory and Services
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
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
                className="bg-white rounded-3xl p-5 border border-slate-200 hover:border-slate-300 transition-all shadow-2xs flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">{c.name}</h2>
                      <p className="text-xs text-slate-500 font-mono">NIT: {c.nit}</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {c.tier}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <p className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-slate-400">location_on</span>
                      {c.sede}
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-slate-400">person</span>
                      {c.contact}
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-slate-400">mail</span>
                      <a href={`mailto:${c.contactEmail}`} className="text-blue-600 hover:underline">
                        {c.contactEmail}
                      </a>
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Tickets activos:</span>
                    <span className="text-xs font-bold text-slate-900 font-mono bg-slate-100 px-2 py-0.5 rounded-lg">
                      {activeCompanyTickets.length}
                    </span>
                    <span className="text-xs text-slate-400">({companyTickets.length} total)</span>
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

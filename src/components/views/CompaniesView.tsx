import React from 'react';
import { useTickets } from '../../context/TicketsContext';

interface CompaniesViewProps {
  onBackToConsole: () => void;
  onFilterByCompany: (companyName: string) => void;
}

export const CompaniesView: React.FC<CompaniesViewProps> = ({ onBackToConsole, onFilterByCompany }) => {
  const { tickets } = useTickets();

  const companiesData = [
    {
      name: 'Café Quindío S.A.S.',
      nit: '890.102.455-8',
      tier: 'Platinum SLA',
      sede: 'Armenia, Quindío',
      contact: 'Claudia Mendoza (Gerente de tecnología)',
      contactEmail: 'cmendoza@cafequindio.com'
    },
    {
      name: 'Trilladora La Manuela',
      nit: '800.231.908-1',
      tier: 'Gold SLA',
      sede: 'Manizales, Caldas',
      contact: 'Juan Camilo Duque (Jefe de logística)',
      contactEmail: 'jduque@lamanuela.com'
    },
    {
      name: 'Almacafé S.A.',
      nit: '860.007.820-9',
      tier: 'Enterprise SLA',
      sede: 'Bogotá D.C. / Pereira',
      contact: 'Diego Fernando Rojas (Básculas y pesaje)',
      contactEmail: 'drojas@almacafe.com.co'
    },
    {
      name: 'Exportadora del Eje',
      nit: '900.551.402-3',
      tier: 'Platinum SLA',
      sede: 'Pereira, Risaralda',
      contact: 'Sandra Milena Ortiz (Administración)',
      contactEmail: 'sortiz@exportadoradeleje.com'
    },
    {
      name: 'Cooperativa del Huila',
      nit: '891.100.320-4',
      tier: 'Gold SLA',
      sede: 'Neiva, Huila',
      contact: 'Mauricio Valdés (Jefe de sistemas)',
      contactEmail: 'mvaldes@coophuila.com.co'
    },
    {
      name: 'Infraestructura Core',
      nit: '901.442.110-0',
      tier: 'Internal SLA 99.99%',
      sede: 'Medellín / Cloud',
      contact: 'Andrés Moreno (SysAdmin)',
      contactEmail: 'andres.moreno@sfs.com.co'
    }
  ];

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
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 leading-snug">{c.name}</h2>
                      <span className="text-xs text-slate-400 font-mono">NIT: {c.nit}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {c.tier}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 pt-1">
                    <p className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-xs text-slate-400">location_on</span>
                      <span>{c.sede}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-xs text-slate-400">person</span>
                      <span>{c.contact}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <span className="font-semibold text-slate-700">
                    {activeCompanyTickets.length} {activeCompanyTickets.length === 1 ? 'ticket activo' : 'tickets activos'}
                  </span>
                  <button
                    onClick={() => onFilterByCompany(c.name)}
                    className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold transition-colors cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    Ver casos de {c.name.split(' ')[0]}
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

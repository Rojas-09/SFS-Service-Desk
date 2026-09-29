import React, { useState } from 'react';
import { Priority, Ticket } from '../types';
import { COMPANIES_LIST, CATEGORIES_LIST } from '../data/mockData';

export const MODULES_LIST = [
  'ERP Core',
  'Facturación electrónica DIAN',
  'Logística y despacho',
  'Básculas y pesaje IoT',
  'Business Intelligence y reportes',
  'Infraestructura y seguridad'
];

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newTicket: Ticket) => void;
  defaultCompany?: string;
  defaultRequester?: string;
}

export const NewTicketModal: React.FC<NewTicketModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultCompany,
  defaultRequester
}) => {
  const [company, setCompany] = useState(defaultCompany || COMPANIES_LIST[0]);
  const [requesterName, setRequesterName] = useState(defaultRequester || 'Claudia Mendoza');
  const [requesterEmail, setRequesterEmail] = useState('cmendoza@cafequindio.com');
  const [moduleName, setModuleName] = useState(MODULES_LIST[0]);
  const [category, setCategory] = useState(CATEGORIES_LIST[0]);
  const [priority, setPriority] = useState<Priority>('Alta');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const randomNum = Math.floor(1030 + Math.random() * 50);
    const newCode = `#SFS-${randomNum}`;

    let slaMinutes = 240;
    let slaFormatted = '4 h 00 min';
    let slaRemainingPercent = 85;

    if (priority === 'Crítica') {
      slaMinutes = 45;
      slaFormatted = '45 min';
      slaRemainingPercent = 18;
    } else if (priority === 'Alta') {
      slaMinutes = 120;
      slaFormatted = '2 h 00 min';
      slaRemainingPercent = 40;
    } else if (priority === 'Baja') {
      slaMinutes = 480;
      slaFormatted = '8 h 00 min';
      slaRemainingPercent = 90;
    }

    const createdTicket: Ticket = {
      id: `t-${randomNum}`,
      code: newCode,
      title: title.trim(),
      description: description.trim(),
      company,
      companyNit: '890.102.455-8',
      requesterName,
      requesterTitle: 'Gerente de operaciones',
      requesterEmail,
      requesterPhone: '+57 (6) 745-8900',
      module: moduleName,
      category,
      tags: ['Soporte', moduleName.split(' ')[0]],
      priority,
      status: 'Nuevo',
      createdAt: 'Hoy ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdHoursAgo: 'hace 1 min',
      slaLimit: 'Hoy ' + new Date(Date.now() + slaMinutes * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      slaMinutesRemaining: slaMinutes,
      slaFormatted,
      slaRemainingPercent,
      messages: [
        {
          id: `m-init-${Date.now()}`,
          senderName: `${requesterName} (Cliente)`,
          senderRole: 'cliente',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now(),
          content: description.trim(),
          attachment: attachedFileName
            ? {
                name: attachedFileName,
                size: '24 KB'
              }
            : undefined
        }
      ],
      history: [
        {
          id: `h-init-${Date.now()}`,
          action: 'Ticket creado',
          detail: `Radicado por ${requesterName} con prioridad ${priority}`,
          user: requesterName,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now()
        }
      ]
    };

    onSubmit(createdTicket);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F37021] text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-xl leading-none">add_circle</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Registrar nuevo ticket de soporte
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Software Factory and Services · Mesa de ayuda operativa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none"
          >
            <span className="material-symbols-outlined text-lg leading-none">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Empresa */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Empresa cliente</label>
              <select
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
              >
                {COMPANIES_LIST.map((comp) => (
                  <option key={comp} value={comp}>
                    {comp}
                  </option>
                ))}
              </select>
            </div>

            {/* Módulo Afectado */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Módulo del sistema</label>
              <select
                value={moduleName}
                onChange={(e) => setModuleName(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
              >
                {MODULES_LIST.map((mod) => (
                  <option key={mod} value={mod}>
                    {mod}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Categoría */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
              >
                {CATEGORIES_LIST.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Prioridad */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nivel de prioridad</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
              >
                <option value="Crítica">Crítica (SLA: 45 min)</option>
                <option value="Alta">Alta (SLA: 2 h 00 min)</option>
                <option value="Media">Media (SLA: 6 h 00 min)</option>
                <option value="Baja">Baja (SLA: 24 h 00 min)</option>
              </select>
            </div>
          </div>

          {/* Solicitante */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del solicitante</label>
              <input
                type="text"
                required
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none font-sans"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Correo electrónico</label>
              <input
                type="email"
                required
                value={requesterEmail}
                onChange={(e) => setRequesterEmail(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Asunto */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Asunto del ticket / Resumen del incidente
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Error 500 al emitir facturación electrónica o bloqueo de acceso..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none font-sans"
            />
          </div>

          {/* Descripción Detallada */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Descripción detallada del incidente
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explique el comportamiento observado, pasos para reproducir o impacto en la operación..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none resize-none font-sans"
            />
          </div>

          {/* Adjuntar Archivo */}
          <div className="p-3.5 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-slate-400 text-2xl">attach_file</span>
              <div>
                <span className="text-xs font-semibold text-slate-700 block">
                  {attachedFileName || 'Adjuntar logs, capturas de pantalla o evidencias'}
                </span>
                <span className="text-xs text-slate-400">PDF, PNG, JPG, LOG hasta 25 MB</span>
              </div>
            </div>
            {attachedFileName ? (
              <button
                type="button"
                onClick={() => setAttachedFileName(null)}
                className="text-xs text-rose-600 hover:underline cursor-pointer font-medium"
              >
                Quitar
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setAttachedFileName('registro_error_sistema.log')}
                className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-700 shadow-2xs cursor-pointer transition-colors"
              >
                Examinar
              </button>
            )}
          </div>

          {/* Botones de Acción */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-[#F37021] hover:bg-[#d95d13] rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center gap-1.5 cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              <span className="material-symbols-outlined text-base leading-none">check</span>
              <span>Crear ticket</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

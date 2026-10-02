import React, { useEffect, useState } from 'react';
import { Priority, Ticket } from '../types';
import { COMPANIES_LIST, CATEGORIES_LIST, MODULES_LIST } from '../data/mockData';
import { calcularVencimiento, MATRIZ_SLA } from '../utils/sla';
import { formatFechaBogota, calcularEstadoSLA } from '../utils/fechas';

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newTicket: Ticket) => void;
  defaultCompany?: string;
  defaultRequester?: string;
  defaultRequesterEmail?: string;
  isClient?: boolean;
}

export const NewTicketModal: React.FC<NewTicketModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultCompany,
  defaultRequester,
  defaultRequesterEmail,
  isClient = false
}) => {
  const [company, setCompany] = useState(defaultCompany || COMPANIES_LIST[0]);
  const [requesterName, setRequesterName] = useState(defaultRequester || 'Claudia Mendoza');
  const [requesterEmail, setRequesterEmail] = useState(
    defaultRequesterEmail || 'cmendoza@cafequindio.com'
  );
  const [moduleName, setModuleName] = useState(MODULES_LIST[0]);
  const [category, setCategory] = useState(CATEGORIES_LIST[0]);
  const [priority, setPriority] = useState<Priority>('Media');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);

  useEffect(() => {
    if (defaultCompany) setCompany(defaultCompany);
    if (defaultRequester) setRequesterName(defaultRequester);
    if (defaultRequesterEmail) setRequesterEmail(defaultRequesterEmail);
  }, [defaultCompany, defaultRequester, defaultRequesterEmail]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const randomNum = Math.floor(1061 + Math.random() * 50);
    const newCode = `#SFS-${randomNum}`;

    const now = new Date();
    const createdAtIso = now.toISOString();
    const createdAtFormatted = formatFechaBogota(now, true);

    const reglaSla = MATRIZ_SLA[priority] || MATRIZ_SLA.Media;
    const slaLimitDate = calcularVencimiento(now, reglaSla.solucionHoras);
    const slaFirstResponseDate = calcularVencimiento(now, reglaSla.primeraRespuestaHoras);
    const slaLimitIso = slaLimitDate.toISOString();
    const slaLimitFormatted = formatFechaBogota(slaLimitDate, true);

    const slaEstado = calcularEstadoSLA(createdAtIso, slaLimitIso, false, now);

    const createdTicket: Ticket = {
      id: `t-${randomNum}`,
      code: newCode,
      title: title.trim(),
      description: description.trim(),
      company,
      companyNit: '890.102.455-8',
      requesterName,
      requesterTitle: 'Coordinador de área',
      requesterEmail,
      requesterPhone: '+57 (6) 745-8900',
      module: moduleName,
      category,
      tags: ['Soporte', moduleName.split(' ')[0]],
      priority,
      status: 'Nuevo',
      createdAt: createdAtFormatted,
      createdAtIso,
      createdHoursAgo: 'hace un momento',
      slaLimit: slaLimitFormatted,
      slaLimitIso,
      slaFirstResponseLimitIso: slaFirstResponseDate.toISOString(),
      slaMinutesRemaining: slaEstado.slaMinutesRemaining,
      slaFormatted: slaEstado.slaFormatted,
      slaRemainingPercent: slaEstado.slaRemainingPercent,
      isBreached: false,
      messages: [
        {
          id: `m-init-${Date.now()}`,
          senderName: `${requesterName} (Cliente)`,
          senderRole: 'cliente',
          time: createdAtFormatted,
          timestamp: now.getTime(),
          createdAtIso,
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
          detail: `Registrado con prioridad ${priority}, categoría "${category}" y módulo "${moduleName}"`,
          user: requesterName,
          time: createdAtFormatted,
          timestamp: now.getTime(),
          createdAtIso
        }
      ]
    };

    onSubmit(createdTicket);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs select-none">
      <div className="bg-white dark:bg-[#0E2A52] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-[#1E3F73] max-w-2xl w-full max-h-[95dvh] sm:max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 transition-colors duration-200">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-linear-to-r from-[#0B2A5B] to-[#1565C0] text-white flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <span className="material-symbols-outlined text-lg text-[#F37021]">add_circle</span>
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Crear nuevo ticket de soporte</h2>
              <p className="text-xs text-blue-100">Registro oficial con asignación de SLA en horario hábil</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg leading-none">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs custom-scrollbar pb-safe">
          {/* Empresa y Solicitante */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-[#E8EEF9] mb-1">
                Empresa cliente vinculada <span className="text-rose-500">*</span>
              </label>
              {isClient ? (
                <input
                  value={company}
                  readOnly
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E3F73] bg-slate-100 dark:bg-[#081B3A]/60 font-medium text-slate-700 dark:text-[#94A9CC]"
                />
              ) : (
                <select
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E3F73] bg-slate-50 dark:bg-[#081B3A] focus:bg-white dark:focus:bg-[#081B3A] focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium text-slate-900 dark:text-[#E8EEF9]"
                >
                  {COMPANIES_LIST.map((c) => (
                    <option key={c} value={c} className="bg-white dark:bg-[#081B3A] text-slate-900 dark:text-[#E8EEF9]">
                      {c}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-[#E8EEF9] mb-1">
                Nombre del solicitante <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E3F73] bg-slate-50 dark:bg-[#081B3A] focus:bg-white dark:focus:bg-[#081B3A] focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium text-slate-900 dark:text-[#E8EEF9] placeholder-slate-400 dark:placeholder-[#94A9CC]/60"
                placeholder="Ej. Claudia Mendoza"
              />
            </div>
          </div>

          {/* Correo y Prioridad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-[#E8EEF9] mb-1">
                Correo corporativo <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={requesterEmail}
                readOnly={isClient}
                onChange={(e) => setRequesterEmail(e.target.value)}
                required
                className={`w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E3F73] focus:bg-white dark:focus:bg-[#081B3A] focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono text-slate-900 dark:text-[#E8EEF9] placeholder-slate-400 dark:placeholder-[#94A9CC]/60 ${
                  isClient ? 'bg-slate-100 dark:bg-[#081B3A]/60 text-slate-700 dark:text-[#94A9CC]' : 'bg-slate-50 dark:bg-[#081B3A]'
                }`}
                placeholder="correo@empresa.com"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-[#E8EEF9] mb-1">
                Nivel de prioridad SLA <span className="text-rose-500">*</span>
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E3F73] bg-slate-50 dark:bg-[#081B3A] focus:bg-white dark:focus:bg-[#081B3A] focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold text-slate-900 dark:text-[#E8EEF9]"
              >
                <option value="Crítica" className="bg-white dark:bg-[#081B3A] text-slate-900 dark:text-[#E8EEF9]">Crítica (1 h resp. / 4 h solución)</option>
                <option value="Alta" className="bg-white dark:bg-[#081B3A] text-slate-900 dark:text-[#E8EEF9]">Alta (4 h resp. / 1 día solución)</option>
                <option value="Media" className="bg-white dark:bg-[#081B3A] text-slate-900 dark:text-[#E8EEF9]">Media (8 h resp. / 3 días solución)</option>
                <option value="Baja" className="bg-white dark:bg-[#081B3A] text-slate-900 dark:text-[#E8EEF9]">Baja (1 día resp. / 5 días solución)</option>
              </select>
            </div>
          </div>

          {/* Categoría y Módulo Afectado (Requirement 6: campo independiente) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-[#E8EEF9] mb-1">
                Categoría del caso <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E3F73] bg-slate-50 dark:bg-[#081B3A] focus:bg-white dark:focus:bg-[#081B3A] focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium text-slate-900 dark:text-[#E8EEF9]"
              >
                {CATEGORIES_LIST.map((cat) => (
                  <option key={cat} value={cat} className="bg-white dark:bg-[#081B3A] text-slate-900 dark:text-[#E8EEF9]">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-[#E8EEF9] mb-1">
                Módulo o producto afectado <span className="text-rose-500">*</span>
              </label>
              <select
                value={moduleName}
                onChange={(e) => setModuleName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E3F73] bg-slate-50 dark:bg-[#081B3A] focus:bg-white dark:focus:bg-[#081B3A] focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium text-slate-900 dark:text-[#E8EEF9]"
              >
                {MODULES_LIST.map((mod) => (
                  <option key={mod} value={mod} className="bg-white dark:bg-[#081B3A] text-slate-900 dark:text-[#E8EEF9]">
                    {mod}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Título o Asunto */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-[#E8EEF9] mb-1">
              Asunto descriptivo del incidente <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E3F73] bg-slate-50 dark:bg-[#081B3A] focus:bg-white dark:focus:bg-[#081B3A] focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium text-slate-900 dark:text-[#E8EEF9] placeholder-slate-400 dark:placeholder-[#94A9CC]/60"
              placeholder="Ej. Error 500 al timbrar factura con validación DIAN"
            />
          </div>

          {/* Descripción Detallada */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-[#E8EEF9] mb-1">
              Descripción y pasos para reproducir <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E3F73] bg-slate-50 dark:bg-[#081B3A] focus:bg-white dark:focus:bg-[#081B3A] focus:ring-2 focus:ring-blue-600 focus:outline-none font-normal text-slate-900 dark:text-[#E8EEF9] placeholder-slate-400 dark:placeholder-[#94A9CC]/60 resize-none"
              placeholder="Explica qué ocurrió, qué acción realizabas y el mensaje de error arrojado..."
            />
          </div>

          {/* Adjunto Simulado */}
          <div className="pt-1">
            <label className="block font-bold text-slate-700 dark:text-[#E8EEF9] mb-1">
              Adjuntar evidencia técnica o captura (opcional)
            </label>
            <div className="flex items-center gap-3">
              <label className="px-3 py-2 rounded-xl border border-slate-300 dark:border-[#1E3F73] bg-slate-100 dark:bg-[#081B3A] hover:bg-slate-200 dark:hover:bg-[#1E3F73]/50 text-slate-700 dark:text-[#E8EEF9] font-semibold cursor-pointer transition-colors flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">attach_file</span>
                <span>{attachedFileName ? 'Cambiar archivo' : 'Seleccionar archivo (.log, .png, .pdf)'}</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setAttachedFileName(file.name);
                  }}
                />
              </label>
              {attachedFileName && (
                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  {attachedFileName}
                </span>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-[#1E3F73] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#1E3F73] hover:bg-slate-100 dark:hover:bg-[#081B3A] text-slate-700 dark:text-[#94A9CC] font-semibold cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">send</span>
              <span>Registrar ticket</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

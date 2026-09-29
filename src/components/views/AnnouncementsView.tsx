import React, { useState } from 'react';
import { useTickets } from '../../context/TicketsContext';
import { Announcement } from '../../types';

interface AnnouncementsViewProps {
  onBackToConsole: () => void;
}

export const AnnouncementsView: React.FC<AnnouncementsViewProps> = ({ onBackToConsole }) => {
  const { announcements, addAnnouncement, currentUser } = useTickets();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Mantenimiento programado');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'Alta' | 'Normal'>('Normal');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      title: title.trim(),
      category,
      content: content.trim(),
      date: 'Hoy ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      author: currentUser ? `${currentUser.name} (${currentUser.title})` : 'SFS Oficial',
      priority
    };

    addAnnouncement(newAnn);
    setTitle('');
    setContent('');
    setShowCreateForm(false);
  };

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
                Anuncios y comunicados oficiales
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Canal de difusión de novedades operativas a clientes y equipo técnico SFS
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none"
          >
            <span className="material-symbols-outlined text-sm">
              {showCreateForm ? 'close' : 'add'}
            </span>
            <span>{showCreateForm ? 'Cancelar' : 'Publicar anuncio'}</span>
          </button>
        </div>

        {/* Formulario para publicar nuevo anuncio */}
        {showCreateForm && (
          <form
            onSubmit={handleSubmit}
            className="p-5 rounded-3xl border border-blue-200 bg-white shadow-md space-y-4 animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-sm font-bold text-slate-900">Redactar nuevo comunicado oficial</h2>
              <span className="text-xs text-slate-400">Software Factory and Services</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Título del anuncio</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Ventana de mantenimiento preventivo base de datos"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Categoría</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none"
                >
                  <option value="Mantenimiento programado">Mantenimiento programado</option>
                  <option value="Actualización de seguridad">Actualización de seguridad</option>
                  <option value="Aviso DIAN / Facturación">Aviso DIAN / Facturación</option>
                  <option value="Nuevo servicio">Nuevo servicio</option>
                </select>
              </div>
            </div>

            <div className="text-xs">
              <label className="block text-slate-700 font-semibold mb-1">Mensaje para clientes y agentes</label>
              <textarea
                required
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Detalles sobre el alcance, horarios y servicios afectados..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={priority === 'Alta'}
                  onChange={(e) => setPriority(e.target.checked ? 'Alta' : 'Normal')}
                  className="rounded text-blue-600 w-3.5 h-3.5"
                />
                <span>Marcar con prioridad alta (Aviso crítico)</span>
              </label>

              <button
                type="submit"
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                Publicar ahora
              </button>
            </div>
          </form>
        )}

        {/* Lista de Comunicados */}
        <div className="space-y-3.5">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className="p-5 rounded-3xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-2xs space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
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

              <h2 className="text-base font-bold text-slate-900 leading-snug">{ann.title}</h2>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{ann.content}</p>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>Publicado por: {ann.author}</span>
                <span className="text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Activo
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

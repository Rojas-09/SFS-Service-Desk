import { useState, useEffect } from 'react';
import { User, UserRole, Ticket } from './types';
import { TicketsProvider, useTickets } from './context/TicketsContext';
import { useNavigationUrl } from './hooks/useNavigationUrl';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { TableView } from './components/TableView';
import { MasterDetailView } from './components/MasterDetailView';
import { KanbanView } from './components/KanbanView';
import { LoginView } from './components/LoginView';
import { ChangePasswordView } from './components/ChangePasswordView';
import { ForbiddenView } from './components/ForbiddenView';
import { NewTicketModal } from './components/NewTicketModal';
import { ClientPortalView } from './components/ClientPortalView';
import { MetricsView } from './components/views/MetricsView';
import { AnnouncementsView } from './components/views/AnnouncementsView';
import { CompaniesView } from './components/views/CompaniesView';
import { UsersView } from './components/views/UsersView';
import { SettingsView } from './components/views/SettingsView';

function AppContent() {
  const {
    pathname,
    filters,
    navigateToPath,
    setBandeja,
    setVista,
    setFiltroRapido,
    setFilterParam,
    clearAllFilters,
    getVistaHref
  } = useNavigationUrl();

  const {
    tickets,
    currentUser,
    setCurrentUser,
    isAuthLoaded,
    logout,
    counts,
    kpis,
    toast,
    showToast,
    clearToast,
    createTicket
  } = useTickets();

  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);

  // ================= MIDDLEWARE Y PROTECCIÓN DE RUTAS (Requirements 1, 4 & 5) =================
  useEffect(() => {
    if (!isAuthLoaded) return;

    // 1. SIN SESIÓN ACTIVA
    if (!currentUser) {
      if (
        pathname.startsWith('/consola') ||
        pathname.startsWith('/portal') ||
        pathname === '/cambiar-contrasena'
      ) {
        navigateToPath(`/login?next=${encodeURIComponent(pathname)}`, { replace: true });
        return;
      }
      if (pathname === '/') {
        navigateToPath('/login', { replace: true });
        return;
      }
      return;
    }

    // 2. CON SESIÓN Y DEBE CAMBIAR CONTRASEÑA (mustChangePassword = true)
    if (currentUser.mustChangePassword) {
      if (pathname !== '/cambiar-contrasena') {
        navigateToPath('/cambiar-contrasena', { replace: true });
        return;
      }
      return;
    }

    // 3. CON SESIÓN Y ACCEDIENDO A /login O /
    if (pathname === '/login' || pathname === '/') {
      if (currentUser.role === 'cliente') {
        navigateToPath('/portal', { replace: true });
      } else {
        navigateToPath('/consola/bandeja', { replace: true });
      }
      return;
    }

    // 4. POLÍTICAS POR ROL: CLIENTE (Solo puede estar en /portal/* o /cambiar-contrasena)
    if (currentUser.role === 'cliente') {
      if (pathname.startsWith('/consola')) {
        navigateToPath('/portal', { replace: true });
        return;
      }
    }

    // 5. POLÍTICAS POR ROL: AGENTE, SUPERVISOR, ADMIN (Si entra a /portal/* va a consola)
    if (currentUser.role !== 'cliente') {
      if (pathname.startsWith('/portal')) {
        navigateToPath('/consola/bandeja', { replace: true });
        return;
      }
    }
  }, [pathname, currentUser, navigateToPath, isAuthLoaded]);

  if (!isAuthLoaded) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-[#F5F7FB]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#1565C0] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario y estamos en /login
  if (!currentUser) {
    return (
      <>
        {toast && (
          <div
            className={`fixed top-4 right-6 z-50 px-4 py-2.5 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-4 text-xs font-semibold select-none ${
              toast.type === 'error'
                ? 'bg-rose-950 text-white border-rose-700/50'
                : 'bg-[#0B2A5B] text-white border-white/20'
            }`}
          >
            <span
              className={`material-symbols-outlined text-base ${
                toast.type === 'error' ? 'text-rose-400' : 'text-[#F37021]'
              }`}
            >
              {toast.type === 'error' ? 'error' : 'info'}
            </span>
            <span>{toast.message}</span>
            <button
              onClick={clearToast}
              className="text-white/60 hover:text-white ml-1 p-0.5 rounded cursor-pointer"
            >
              <span className="material-symbols-outlined text-xs leading-none">close</span>
            </button>
          </div>
        )}
        <LoginView
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            showToast(`Bienvenido, ${user.name}`);

            if (user.mustChangePassword) {
              navigateToPath('/cambiar-contrasena', { replace: true });
              return;
            }

            const searchParams = new URLSearchParams(window.location.search);
            const nextPath = searchParams.get('next');
            if (nextPath && nextPath !== '/login') {
              navigateToPath(decodeURIComponent(nextPath), { replace: true });
            } else if (user.role === 'cliente') {
              navigateToPath('/portal', { replace: true });
            } else {
              navigateToPath('/consola/bandeja', { replace: true });
            }
          }}
          onShowToast={(msg) => showToast(msg, { type: 'info' })}
        />
      </>
    );
  }

  // ================= PANTALLA: CAMBIAR CONTRASEÑA (/cambiar-contrasena) =================
  if (pathname === '/cambiar-contrasena') {
    return (
      <>
        {toast && (
          <div className="fixed top-4 right-6 z-50 px-4 py-2.5 rounded-2xl shadow-2xl border bg-[#0B2A5B] text-white border-white/20 flex items-center gap-3 animate-in fade-in text-xs font-semibold">
            <span>{toast.message}</span>
          </div>
        )}
        <ChangePasswordView
          currentUser={currentUser}
          onPasswordChanged={(updatedUser) => {
            setCurrentUser(updatedUser);
            showToast('Contraseña actualizada exitosamente', { type: 'success' });
            if (updatedUser.role === 'cliente') {
              navigateToPath('/portal', { replace: true });
            } else {
              navigateToPath('/consola/bandeja', { replace: true });
            }
          }}
          onCancel={
            !currentUser.mustChangePassword
              ? () => {
                  if (currentUser.role === 'cliente') {
                    navigateToPath('/portal');
                  } else {
                    navigateToPath('/consola/bandeja');
                  }
                }
              : undefined
          }
        />
      </>
    );
  }

  // ================= PANTALLA: PORTAL DEL CLIENTE (/portal/*) =================
  if (pathname.startsWith('/portal')) {
    let subPath: 'inicio' | 'nuevo' | 'tickets' | 'detalle' = 'inicio';
    let ticketIdParam: string | undefined = undefined;

    if (pathname === '/portal/nuevo') {
      subPath = 'nuevo';
    } else if (pathname === '/portal/tickets') {
      subPath = 'tickets';
    } else if (pathname.startsWith('/portal/tickets/')) {
      subPath = 'detalle';
      ticketIdParam = pathname.replace('/portal/tickets/', '');
    }

    return (
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#F5F7FB]">
        {toast && (
          <div className="fixed top-4 right-6 z-50 px-4 py-2.5 rounded-2xl shadow-2xl border bg-[#0B2A5B] text-white border-white/20 flex items-center gap-3 animate-in fade-in text-xs font-semibold">
            <span>{toast.message}</span>
          </div>
        )}

        <ClientPortalView
          currentUser={currentUser}
          tickets={tickets}
          subPath={subPath}
          ticketIdParam={ticketIdParam}
          onNavigate={(p) => navigateToPath(p)}
          onOpenNewTicket={() => setIsNewTicketModalOpen(true)}
          onLogout={async () => {
            await logout();
            navigateToPath('/login', { replace: true });
          }}
          onNavigateToChangePassword={() => navigateToPath('/cambiar-contrasena')}
        />

        <NewTicketModal
          isOpen={isNewTicketModalOpen || subPath === 'nuevo'}
          onClose={() => {
            setIsNewTicketModalOpen(false);
            if (subPath === 'nuevo') navigateToPath('/portal');
          }}
          onSubmit={(newTicket: Ticket) => {
            createTicket(newTicket);
            setIsNewTicketModalOpen(false);
            navigateToPath(`/portal/tickets/${newTicket.id}`);
          }}
          defaultCompany={currentUser.company}
          defaultRequester={currentUser.name}
          defaultRequesterEmail={currentUser.email}
          isClient={currentUser.role === 'cliente'}
        />
      </div>
    );
  }

  // ================= VALIDACIÓN DE ACCESO 403 PARA CONSOLA (Requirement 7) =================
  // Agente bloqueado en Métricas, Anuncios, Empresas, Usuarios, Configuración
  // Supervisor y Admin tienen acceso a todas estas secciones operativas
  const isAgenteBlocked =
    currentUser.role === 'agente' &&
    (pathname === '/consola/metricas' ||
      pathname === '/consola/anuncios' ||
      pathname === '/consola/empresas' ||
      pathname === '/consola/usuarios' ||
      pathname === '/consola/configuracion');

  const isForbidden = isAgenteBlocked;
  const forbiddenReason =
    'Acceso no autorizado para tu rol de Agente. Las secciones de métricas, comunicados, empresas, usuarios y configuración requieren permisos de Supervisor o Administrador.';

  return (
    <div className="h-screen w-screen flex flex-row overflow-hidden bg-[#F5F7FB] font-sans antialiased text-slate-800">
      {/* Toast Notification Container con Deshacer */}
      {toast && (
        <div
          className={`fixed top-4 right-6 z-50 px-4 py-2.5 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-4 text-xs font-semibold select-none ${
            toast.type === 'error'
              ? 'bg-rose-950 text-white border-rose-700/50'
              : 'bg-[#0B2A5B] text-white border-white/20'
          }`}
        >
          <span
            className={`material-symbols-outlined text-base ${
              toast.type === 'error' ? 'text-rose-400' : 'text-[#F37021]'
            }`}
          >
            {toast.type === 'error' ? 'error' : 'info'}
          </span>
          <span>{toast.message}</span>

          {toast.undoAction && (
            <button
              onClick={() => {
                if (toast.undoAction) toast.undoAction();
                clearToast();
              }}
              className="ml-2 px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold text-[11px] cursor-pointer transition-colors active:scale-95 focus:ring-2 focus:ring-blue-400 focus:outline-none"
            >
              {toast.undoLabel || 'Deshacer'}
            </button>
          )}

          <button
            onClick={clearToast}
            className="text-white/60 hover:text-white ml-1 p-0.5 rounded cursor-pointer"
            title="Cerrar notificación"
          >
            <span className="material-symbols-outlined text-xs leading-none">close</span>
          </button>
        </div>
      )}

      {/* Sidebar Izquierdo con control estricto de roles (Requirement 6) */}
      <Sidebar
        currentUser={currentUser}
        currentPath={pathname}
        onNavigate={(p) => navigateToPath(p)}
        onOpenNewTicket={() => setIsNewTicketModalOpen(true)}
        counts={counts}
      />

      {/* Zona Principal (Main Viewport) */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        <Topbar
          currentUser={currentUser}
          onLogout={async () => {
            await logout();
            navigateToPath('/login', { replace: true });
          }}
          onSwitchUser={async (newRole: UserRole) => {
            if (!import.meta.env.DEV) return;
            try {
              const res = await fetch('/api/users');
              if (res.ok) {
                const data = await res.json();
                const target = data.users?.find((u: User) => u.role === newRole);
                if (target) {
                  setCurrentUser(target);
                  showToast(`Perfil cambiado a: ${target.name} (${target.role})`);
                  if (target.role === 'cliente') {
                    navigateToPath('/portal', { replace: true });
                  } else {
                    navigateToPath('/consola/bandeja', { replace: true });
                  }
                }
              }
            } catch {}
          }}
          searchQuery={filters.busqueda || ''}
          onSearchChange={(q) => setFilterParam('busqueda', q)}
          onNavigateToChangePassword={() => navigateToPath('/cambiar-contrasena')}
        />

        {/* Dynamic Viewport */}
        {isForbidden ? (
          <ForbiddenView
            currentUser={currentUser}
            reason={forbiddenReason}
            onBackToConsole={() => navigateToPath('/consola/bandeja')}
          />
        ) : pathname === '/consola/metricas' ? (
          <MetricsView onBackToConsole={() => navigateToPath('/consola/bandeja')} />
        ) : pathname === '/consola/anuncios' ? (
          <AnnouncementsView onBackToConsole={() => navigateToPath('/consola/bandeja')} />
        ) : pathname === '/consola/empresas' ? (
          <CompaniesView
            onBackToConsole={() => navigateToPath('/consola/bandeja')}
            onFilterByCompany={(companyName) => {
              setFilterParam('empresa', companyName);
              navigateToPath('/consola/bandeja');
            }}
          />
        ) : pathname === '/consola/usuarios' ? (
          <UsersView
            onBackToConsole={() => navigateToPath('/consola/bandeja')}
            onSwitchUser={(targetUser) => {
              if (!import.meta.env.DEV) return;
              setCurrentUser(targetUser);
              showToast(`Perfil cambiado a: ${targetUser.name} (${targetUser.role})`);
              if (targetUser.role === 'cliente') {
                navigateToPath('/portal', { replace: true });
              } else {
                navigateToPath('/consola/bandeja', { replace: true });
              }
            }}
          />
        ) : pathname === '/consola/configuracion' ? (
          <SettingsView onBackToConsole={() => navigateToPath('/consola/bandeja')} />
        ) : filters.vista === 'tabla' && !pathname.startsWith('/consola/tickets/') ? (
          <TableView
            kpis={kpis}
            filters={filters}
            onSetVista={setVista}
            onSetFiltroRapido={setFiltroRapido}
            onSetFilterParam={setFilterParam}
            onClearAllFilters={clearAllFilters}
            getVistaHref={getVistaHref}
          />
        ) : filters.vista === 'detalle' || pathname.startsWith('/consola/tickets/') ? (
          <MasterDetailView
            filters={filters}
            onSetVista={setVista}
            onSetFiltroRapido={setFiltroRapido}
            onSetFilterParam={setFilterParam}
            onClearAllFilters={clearAllFilters}
            getVistaHref={getVistaHref}
          />
        ) : (
          <KanbanView
            filters={filters}
            onSetVista={setVista}
            onSetFiltroRapido={setFiltroRapido}
            onSetFilterParam={setFilterParam}
            onClearAllFilters={clearAllFilters}
            getVistaHref={getVistaHref}
          />
        )}
      </div>

      {/* Modal para Registrar Nuevo Ticket */}
      <NewTicketModal
        isOpen={isNewTicketModalOpen}
        onClose={() => setIsNewTicketModalOpen(false)}
        onSubmit={createTicket}
        defaultCompany={currentUser.company}
        defaultRequester={currentUser.name}
        defaultRequesterEmail={currentUser.email}
        isClient={currentUser.role === 'cliente'}
      />
    </div>
  );
}

export default function App() {
  return (
    <TicketsProvider>
      <AppContent />
    </TicketsProvider>
  );
}

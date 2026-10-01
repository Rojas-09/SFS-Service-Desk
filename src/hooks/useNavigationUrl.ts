import { useState, useEffect, useCallback } from 'react';
import { BandejaType, VistaType, SeccionType, NavigationFilters } from '../types';

export const useNavigationUrl = () => {
  const getFiltersFromLocation = (): NavigationFilters & { pathname: string } => {
    if (typeof window === 'undefined') {
      return {
        pathname: '/login',
        bandeja: 'activos',
        vista: 'tabla',
        seccion: undefined,
        ticketId: undefined,
        empresa: '',
        agente: '',
        prioridad: '',
        categoria: '',
        sla: '',
        filtroRapido: '',
        busqueda: ''
      };
    }

    let pathname = window.location.pathname;
    const params = new URLSearchParams(window.location.search);

    // Normalizar raíz '/' según el estado de la sesión
    if (pathname === '/') {
      try {
        const cachedUserStr = localStorage.getItem('sfs_user');
        if (!cachedUserStr) {
          pathname = '/login';
          window.history.replaceState({}, '', '/login');
        } else {
          const cachedUser = JSON.parse(cachedUserStr);
          if (cachedUser && cachedUser.role === 'cliente') {
            pathname = '/portal';
            window.history.replaceState({}, '', '/portal');
          } else {
            pathname = '/consola/bandeja';
            window.history.replaceState({}, '', '/consola/bandeja');
          }
        }
      } catch {
        pathname = '/login';
        window.history.replaceState({}, '', '/login');
      }
    }

    // Mapear pathname real a bandeja o sección
    let bandeja: BandejaType = 'activos';
    let seccion: SeccionType | undefined = undefined;
    let ticketId: string | undefined = undefined;

    if (pathname === '/consola/mis-tickets') {
      bandeja = 'mios';
    } else if (pathname === '/consola/sin-asignar') {
      bandeja = 'sin-asignar';
    } else if (pathname === '/consola/todos') {
      bandeja = 'todos';
    } else if (pathname === '/consola/bandeja') {
      bandeja = 'activos';
    } else if (pathname.startsWith('/consola/tickets/')) {
      ticketId = pathname.replace('/consola/tickets/', '');
    } else if (pathname === '/consola/metricas') {
      seccion = 'metricas';
    } else if (pathname === '/consola/anuncios') {
      seccion = 'anuncios';
    } else if (pathname === '/consola/empresas') {
      seccion = 'empresas';
    } else if (pathname === '/consola/usuarios') {
      seccion = 'usuarios';
    } else if (pathname === '/consola/configuracion') {
      seccion = 'configuracion';
    } else {
      // Fallback para query params tradicionales
      const rawBandeja = params.get('bandeja');
      if (rawBandeja === 'mios' || rawBandeja === 'sin-asignar' || rawBandeja === 'todos') {
        bandeja = rawBandeja;
      }
      const rawSeccion = params.get('seccion');
      if (
        rawSeccion === 'metricas' ||
        rawSeccion === 'anuncios' ||
        rawSeccion === 'empresas' ||
        rawSeccion === 'usuarios' ||
        rawSeccion === 'configuracion'
      ) {
        seccion = rawSeccion;
      }
    }

    // Vista: tabla | detalle | kanban
    let vista: VistaType = 'tabla';
    if (ticketId || pathname.startsWith('/consola/tickets/')) {
      vista = 'detalle';
    } else {
      const rawVista = params.get('vista');
      if (rawVista === 'detalle' || rawVista === 'kanban') {
        vista = rawVista;
      }
    }

    if (!ticketId) {
      ticketId = params.get('ticketId') || undefined;
    }

    const rawFiltroRapido = params.get('filtro_rapido');
    const filtroRapido =
      rawFiltroRapido === 'urgentes' ||
      rawFiltroRapido === 'sla_riesgo' ||
      rawFiltroRapido === 'esperando'
        ? rawFiltroRapido
        : '';

    return {
      pathname,
      bandeja,
      vista,
      seccion,
      ticketId,
      empresa: params.get('empresa') || '',
      agente: params.get('agente') || '',
      prioridad: params.get('prioridad') || '',
      categoria: params.get('categoria') || '',
      sla: params.get('sla') || '',
      filtroRapido,
      busqueda: params.get('busqueda') || ''
    };
  };

  const [filters, setFilters] = useState(getFiltersFromLocation);

  // Escuchar cambios de historial (navegador atrás/adelante)
  useEffect(() => {
    const handlePopState = () => {
      setFilters(getFiltersFromLocation());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToPath = useCallback((newPath: string, options?: { replace?: boolean }) => {
    if (options?.replace) {
      window.history.replaceState({}, '', newPath);
    } else {
      window.history.pushState({}, '', newPath);
    }
    setFilters(getFiltersFromLocation());
  }, []);

  const updateUrl = useCallback((newFilters: Partial<NavigationFilters>) => {
    const current = getFiltersFromLocation();
    const updated: NavigationFilters = { ...current, ...newFilters };

    // Determinar nuevo pathname base
    let basePath = '/consola/bandeja';
    if (updated.seccion) {
      basePath = `/consola/${updated.seccion}`;
    } else if (updated.ticketId && updated.vista === 'detalle') {
      basePath = `/consola/tickets/${updated.ticketId}`;
    } else if (updated.bandeja === 'mios') {
      basePath = '/consola/mis-tickets';
    } else if (updated.bandeja === 'sin-asignar') {
      basePath = '/consola/sin-asignar';
    } else if (updated.bandeja === 'todos') {
      basePath = '/consola/todos';
    } else {
      basePath = '/consola/bandeja';
    }

    const params = new URLSearchParams();
    // Guardar vista si no es detalle por ticket o si es kanban
    if (updated.vista && !basePath.startsWith('/consola/tickets/')) {
      params.set('vista', updated.vista);
    }
    if (updated.empresa) params.set('empresa', updated.empresa);
    if (updated.agente) params.set('agente', updated.agente);
    if (updated.prioridad) params.set('prioridad', updated.prioridad);
    if (updated.categoria) params.set('categoria', updated.categoria);
    if (updated.sla) params.set('sla', updated.sla);
    if (updated.filtroRapido) params.set('filtro_rapido', updated.filtroRapido);
    if (updated.busqueda) params.set('busqueda', updated.busqueda);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const fullUrl = `${basePath}${queryStr}`;

    window.history.pushState({}, '', fullUrl);
    setFilters(getFiltersFromLocation());
  }, []);

  // Helper methods
  const setBandeja = useCallback((bandeja: BandejaType) => {
    let target = '/consola/bandeja';
    if (bandeja === 'mios') target = '/consola/mis-tickets';
    if (bandeja === 'sin-asignar') target = '/consola/sin-asignar';
    if (bandeja === 'todos') target = '/consola/todos';

    const current = getFiltersFromLocation();
    const params = new URLSearchParams();
    if (current.vista) params.set('vista', current.vista);
    if (current.empresa) params.set('empresa', current.empresa);
    if (current.agente) params.set('agente', current.agente);
    if (current.prioridad) params.set('prioridad', current.prioridad);
    if (current.categoria) params.set('categoria', current.categoria);
    if (current.sla) params.set('sla', current.sla);
    if (current.filtroRapido) params.set('filtro_rapido', current.filtroRapido);
    if (current.busqueda) params.set('busqueda', current.busqueda);

    const fullUrl = `${target}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.pushState({}, '', fullUrl);
    setFilters(getFiltersFromLocation());
  }, []);

  const setVista = useCallback((vista: VistaType, ticketId?: string) => {
    updateUrl({ vista, ticketId, seccion: undefined });
  }, [updateUrl]);

  const setSeccion = useCallback((seccion: SeccionType) => {
    const target = `/consola/${seccion}`;
    window.history.pushState({}, '', target);
    setFilters(getFiltersFromLocation());
  }, []);

  const closeSeccion = useCallback(() => {
    const target = '/consola/bandeja';
    window.history.pushState({}, '', target);
    setFilters(getFiltersFromLocation());
  }, []);

  const setFiltroRapido = useCallback((filtroRapido: 'urgentes' | 'sla_riesgo' | 'esperando' | '') => {
    updateUrl({ filtroRapido });
  }, [updateUrl]);

  const setFilterParam = useCallback((key: keyof NavigationFilters, value: string) => {
    updateUrl({ [key]: value });
  }, [updateUrl]);

  const clearAllFilters = useCallback(() => {
    updateUrl({
      empresa: '',
      agente: '',
      prioridad: '',
      categoria: '',
      sla: '',
      filtroRapido: '',
      busqueda: ''
    });
  }, [updateUrl]);

  const getBandejaHref = useCallback((bandeja: BandejaType) => {
    let target = '/consola/bandeja';
    if (bandeja === 'mios') target = '/consola/mis-tickets';
    if (bandeja === 'sin-asignar') target = '/consola/sin-asignar';
    if (bandeja === 'todos') target = '/consola/todos';

    const current = getFiltersFromLocation();
    const params = new URLSearchParams();
    if (current.vista) params.set('vista', current.vista);
    if (current.empresa) params.set('empresa', current.empresa);
    if (current.agente) params.set('agente', current.agente);
    if (current.prioridad) params.set('prioridad', current.prioridad);
    if (current.categoria) params.set('categoria', current.categoria);
    if (current.sla) params.set('sla', current.sla);
    if (current.filtroRapido) params.set('filtro_rapido', current.filtroRapido);
    if (current.busqueda) params.set('busqueda', current.busqueda);

    return `${target}${params.toString() ? `?${params.toString()}` : ''}`;
  }, []);

  const getVistaHref = useCallback((vista: VistaType) => {
    const current = getFiltersFromLocation();
    let basePath = current.pathname;
    if (basePath.startsWith('/consola/tickets/')) {
      basePath = '/consola/bandeja';
    }

    const params = new URLSearchParams();
    params.set('vista', vista);
    if (current.empresa) params.set('empresa', current.empresa);
    if (current.agente) params.set('agente', current.agente);
    if (current.prioridad) params.set('prioridad', current.prioridad);
    if (current.categoria) params.set('categoria', current.categoria);
    if (current.sla) params.set('sla', current.sla);
    if (current.filtroRapido) params.set('filtro_rapido', current.filtroRapido);
    if (current.busqueda) params.set('busqueda', current.busqueda);

    return `${basePath}?${params.toString()}`;
  }, []);

  return {
    pathname: filters.pathname,
    filters,
    navigateToPath,
    setBandeja,
    setVista,
    setSeccion,
    closeSeccion,
    setFiltroRapido,
    setFilterParam,
    clearAllFilters,
    getBandejaHref,
    getVistaHref
  };
};

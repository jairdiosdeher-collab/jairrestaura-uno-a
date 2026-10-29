/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — PLATAFORMA JURÍDICA INTELIGENTE ENTERPRISE
 * Aplicación principal con enrutamiento de vistas y sincronización persistente.
 */

import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DashboardView } from './views/DashboardView';
import { ClientesView } from './views/ClientesView';
import { ExpedientesView } from './views/ExpedientesView';
import { AsistenteIAView } from './views/AsistenteIAView';
import { InvestigacionView } from './views/InvestigacionView';
import { RedaccionView } from './views/RedaccionView';
import { TerminosView } from './views/TerminosView';
import { AnalisisDocumentalView } from './views/AnalisisDocumentalView';
import { HonorariosView } from './views/HonorariosView';
import { SeguridadView } from './views/SeguridadView';
import type { 
  Usuario, 
  Cliente, 
  Expediente, 
  TerminoAgenda, 
  DocumentoLegal, 
  RegistroHonorario, 
  RegistroAuditoria 
} from './types/legal';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('jairrestaura_theme');
      if (saved) return saved === 'dark';
    } catch {}
    return true; // Predeterminado modo oscuro premium
  });

  // Manejo reactivo de clase dark en html y body con persistencia
  useEffect(() => {
    try {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
        localStorage.setItem('jairrestaura_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
        localStorage.setItem('jairrestaura_theme', 'light');
      }
    } catch (e) {
      console.error(e);
    }
  }, [isDarkMode]);

  // Estado del usuario activo
  const [usuarioActivo, setUsuarioActivo] = useState<Usuario>({
    id: 'usr-jair-01',
    nombre: 'Dr. Jair (Director Jurídico)',
    email: 'jairdiosdeher@gmail.com',
    tarjetaProfesional: 'T.P. No. 284.910 del C.S.J.',
    rol: 'ADMIN_TITULAR',
    organizacionId: 'org-jairrestaura-001',
    organizacionNombre: 'JairRestaura Uno A & Asociados — Firma Jurídica',
    fechaCreacion: '2026-01-10T08:00:00Z',
    ultimoAcceso: new Date().toISOString(),
  });
  const [usuariosDisponibles, setUsuariosDisponibles] = useState<Usuario[]>([usuarioActivo]);
  const [organizacion, setOrganizacion] = useState({
    id: 'org-jairrestaura-001',
    nombre: 'JairRestaura Uno A & Asociados — Firma Jurídica',
  });

  // Datos de negocio
  const [stats, setStats] = useState({
    totalClientes: 3,
    expedientesActivos: 3,
    terminosPendientesTotal: 3,
    terminosCriticosTotal: 2,
    totalDocumentos: 1,
    totalHonorariosPactados: 67000000,
    totalHonorariosRecaudados: 17000000,
    saldoPorCobrar: 50000000,
  });
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [terminos, setTerminos] = useState<TerminoAgenda[]>([]);
  const [documentos, setDocumentos] = useState<DocumentoLegal[]>([]);
  const [honorarios, setHonorarios] = useState<RegistroHonorario[]>([]);
  const [auditoria, setAuditoria] = useState<RegistroAuditoria[]>([]);

  // Expediente seleccionado para vista detallada o contextual en IA
  const [expedienteSeleccionadoId, setExpedienteSeleccionadoId] = useState<string | null>(null);

  // Mensaje flotante de notificación (Toast)
  const [notificacion, setNotificacion] = useState<{ texto: string; tipo: 'exito' | 'error' } | null>(null);

  const mostrarNotificacion = (texto: string, tipo: 'exito' | 'error' = 'exito') => {
    setNotificacion({ texto, tipo });
    setTimeout(() => setNotificacion(null), 3500);
  };

  // Cargar datos iniciales desde el backend Express
  const cargarDatos = async () => {
    try {
      // 1. Sesión y usuarios
      const resAuth = await fetch('/api/auth/me', {
        headers: { 'x-user-id': usuarioActivo.id },
      });
      if (resAuth.ok) {
        const dataAuth = await resAuth.json();
        if (dataAuth.usuario) setUsuarioActivo(dataAuth.usuario);
        if (dataAuth.usuariosDisponibles) setUsuariosDisponibles(dataAuth.usuariosDisponibles);
        if (dataAuth.organizacion) setOrganizacion(dataAuth.organizacion);
      }

      // 2. Dashboard Stats
      const resStats = await fetch('/api/dashboard/stats');
      if (resStats.ok) {
        const dataStats = await resStats.json();
        setStats(dataStats);
      }

      // 3. Clientes
      const resClientes = await fetch('/api/clientes');
      if (resClientes.ok) {
        const dataClientes = await resClientes.json();
        setClientes(dataClientes.clientes || []);
      }

      // 4. Expedientes
      const resExp = await fetch('/api/expedientes');
      if (resExp.ok) {
        const dataExp = await resExp.json();
        setExpedientes(dataExp.expedientes || []);
      }

      // 5. Términos
      const resTerm = await fetch('/api/terminos');
      if (resTerm.ok) {
        const dataTerm = await resTerm.json();
        setTerminos(dataTerm.terminos || []);
      }

      // 6. Documentos
      const resDoc = await fetch('/api/documentos');
      if (resDoc.ok) {
        const dataDoc = await resDoc.json();
        setDocumentos(dataDoc.documentos || []);
      }

      // 7. Honorarios
      const resHon = await fetch('/api/honorarios');
      if (resHon.ok) {
        const dataHon = await resHon.json();
        setHonorarios(dataHon.honorarios || []);
      }

      // 8. Auditoría
      const resAud = await fetch('/api/audit-log');
      if (resAud.ok) {
        const dataAud = await resAud.json();
        setAuditoria(dataAud.auditoria || []);
      }
    } catch (err) {
      console.warn('Backend aún iniciando, reintentando carga...', err);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Cambiar usuario / rol
  const handleSwitchUser = async (userId: string) => {
    try {
      const res = await fetch('/api/auth/switch-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        const data = await res.json();
        setUsuarioActivo(data.usuario);
        mostrarNotificacion(`Sesión activa cambiada a: ${data.usuario.nombre}`);
        cargarDatos();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Acciones Rápidas
  const handleQuickAction = (action: string) => {
    if (action === 'nuevo_cliente') {
      setCurrentView('clientes');
    } else if (action === 'nuevo_expediente') {
      setCurrentView('expedientes');
      setExpedienteSeleccionadoId(null);
    } else if (action === 'ver_terminos') {
      setCurrentView('terminos');
    }
  };

  // Handlers de Clientes
  const handleCrearCliente = async (clienteData: Partial<Cliente>) => {
    const res = await fetch('/api/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clienteData),
    });
    if (res.ok) {
      mostrarNotificacion('Cliente registrado con autorización de Habeas Data');
      cargarDatos();
    } else {
      const err = await res.json();
      alert(err.error || 'Error al crear cliente');
    }
  };

  const handleEditarCliente = async (id: string, clienteData: Partial<Cliente>) => {
    const res = await fetch(`/api/clientes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clienteData),
    });
    if (res.ok) {
      mostrarNotificacion('Datos del cliente actualizados');
      cargarDatos();
    }
  };

  const handleArchivarCliente = async (id: string) => {
    const res = await fetch(`/api/clientes/${id}/archive`, { method: 'POST' });
    if (res.ok) {
      mostrarNotificacion('Estado del cliente modificado');
      cargarDatos();
    }
  };

  // Handlers de Expedientes
  const handleCrearExpediente = async (expData: Partial<Expediente>) => {
    const res = await fetch('/api/expedientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expData),
    });
    if (res.ok) {
      mostrarNotificacion('Expediente judicial abierto exitosamente');
      cargarDatos();
    } else {
      const err = await res.json();
      alert(err.error || 'Error al crear expediente');
    }
  };

  const handleRegistrarActuacion = async (expedienteId: string, actuacionData: any) => {
    const res = await fetch(`/api/expedientes/${expedienteId}/actuaciones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actuacionData),
    });
    if (res.ok) {
      mostrarNotificacion('Actuación procesal registrada en la cronología');
      cargarDatos();
    }
  };

  // Handlers de Términos
  const handleCrearTermino = async (terminoData: Partial<TerminoAgenda>) => {
    const res = await fetch('/api/terminos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(terminoData),
    });
    if (res.ok) {
      mostrarNotificacion('Término programado con cómputo legal');
      cargarDatos();
    }
  };

  const handleConfirmarTermino = async (id: string) => {
    const res = await fetch(`/api/terminos/${id}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ abogadoNombre: usuarioActivo.nombre }),
    });
    if (res.ok) {
      mostrarNotificacion('Cómputo verificado y confirmado por el abogado titular');
      cargarDatos();
    }
  };

  const handleCompletarTermino = async (id: string) => {
    const res = await fetch(`/api/terminos/${id}/complete`, { method: 'POST' });
    if (res.ok) {
      mostrarNotificacion('Término marcado como cumplido en agenda');
      cargarDatos();
    }
  };

  // Handlers de Documentos
  const handleGuardarDocumento = async (docData: Partial<DocumentoLegal>) => {
    const res = await fetch('/api/documentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(docData),
    });
    if (res.ok) {
      mostrarNotificacion('Borrador jurídico guardado correctamente');
      cargarDatos();
    }
  };

  const handleActualizarDocumento = async (id: string, docData: Partial<DocumentoLegal>) => {
    const res = await fetch(`/api/documentos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(docData),
    });
    if (res.ok) {
      mostrarNotificacion('Nueva versión del documento guardada');
      cargarDatos();
    }
  };

  // Handlers de Honorarios
  const handleCrearHonorario = async (honData: Partial<RegistroHonorario>) => {
    const res = await fetch('/api/honorarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(honData),
    });
    if (res.ok) {
      mostrarNotificacion('Acuerdo de honorarios registrado');
      cargarDatos();
    }
  };

  const handleRegistrarPago = async (honorarioId: string, pagoData: any) => {
    const res = await fetch(`/api/honorarios/${honorarioId}/pagos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pagoData),
    });
    if (res.ok) {
      mostrarNotificacion('Abono registrado en cartera de honorarios');
      cargarDatos();
    }
  };

  // Restaurar base de datos
  const handleRestaurarDatos = async () => {
    const res = await fetch('/api/system/restore-default', { method: 'POST' });
    if (res.ok) {
      mostrarNotificacion('Datos semilla restaurados con éxito');
      cargarDatos();
    }
  };

  const expedienteActivo = expedientes.find((e) => e.id === expedienteSeleccionadoId);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* Toast Notificación */}
      {notificacion && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xl border bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-950 border-slate-700 dark:border-amber-500 animate-in fade-in slide-in-from-bottom-2">
          {notificacion.texto}
        </div>
      )}

      {/* Sidebar de Navegación Lateral */}
      <Sidebar
        currentView={currentView}
        onSelectView={(v) => {
          setCurrentView(v);
          if (v === 'expedientes') setExpedienteSeleccionadoId(null);
        }}
        terminosCount={stats.terminosCriticosTotal}
        expedientesCount={stats.expedientesActivos}
        organizacionNombre={organizacion.nombre}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />

      {/* Viewport Principal */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar
          currentView={currentView}
          usuarioActivo={usuarioActivo}
          usuariosDisponibles={usuariosDisponibles}
          onSwitchUser={handleSwitchUser}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          onQuickAction={handleQuickAction}
          terminosCriticosCount={stats.terminosCriticosTotal}
        />

        <main className="flex-1 overflow-y-auto px-6 py-6">
          {currentView === 'dashboard' && (
            <DashboardView
              stats={stats}
              proximosTerminos={terminos.filter((t) => t.estado !== 'CUMPLIDO').slice(0, 5)}
              expedientesRecientes={expedientes.slice(0, 5)}
              actividadReciente={auditoria}
              onNavigate={(v, contextId) => {
                setCurrentView(v);
                if (contextId) setExpedienteSeleccionadoId(contextId);
              }}
              onQuickAction={handleQuickAction}
              onConfirmTerm={handleConfirmarTermino}
            />
          )}

          {currentView === 'clientes' && (
            <ClientesView
              clientes={clientes}
              onCrearCliente={handleCrearCliente}
              onEditarCliente={handleEditarCliente}
              onArchivarCliente={handleArchivarCliente}
              onVerExpediente={(expId) => {
                setExpedienteSeleccionadoId(expId);
                setCurrentView('expedientes');
              }}
            />
          )}

          {currentView === 'expedientes' && (
            <ExpedientesView
              expedientes={expedientes}
              clientes={clientes}
              selectedExpedienteId={expedienteSeleccionadoId}
              onSelectExpediente={setExpedienteSeleccionadoId}
              onCrearExpediente={handleCrearExpediente}
              onRegistrarActuacion={handleRegistrarActuacion}
              onAbrirAsistenteIA={(exp) => {
                setExpedienteSeleccionadoId(exp.id);
                setCurrentView('asistente_ia');
              }}
              onRedactarDocumento={(exp) => {
                setExpedienteSeleccionadoId(exp.id);
                setCurrentView('redaccion');
              }}
            />
          )}

          {currentView === 'asistente_ia' && (
            <AsistenteIAView
              expedienteActivo={expedienteActivo}
              onRedactarDocumento={(tipoDoc, contexto) => {
                setCurrentView('redaccion');
              }}
            />
          )}

          {currentView === 'investigacion' && <InvestigacionView />}

          {currentView === 'redaccion' && (
            <RedaccionView
              expedientes={expedientes}
              clientes={clientes}
              documentosGuardados={documentos}
              onGuardarDocumento={handleGuardarDocumento}
              onActualizarDocumento={handleActualizarDocumento}
            />
          )}

          {currentView === 'terminos' && (
            <TerminosView
              terminos={terminos}
              expedientes={expedientes}
              onCrearTermino={handleCrearTermino}
              onConfirmarTermino={handleConfirmarTermino}
              onCompletarTermino={handleCompletarTermino}
            />
          )}

          {currentView === 'analisis_documentos' && <AnalisisDocumentalView />}

          {currentView === 'honorarios' && (
            <HonorariosView
              honorarios={honorarios}
              expedientes={expedientes}
              clientes={clientes}
              onCrearHonorario={handleCrearHonorario}
              onRegistrarPago={handleRegistrarPago}
            />
          )}

          {currentView === 'seguridad' && (
            <SeguridadView
              auditoria={auditoria}
              usuarios={usuariosDisponibles}
              organizacion={organizacion}
              onRestaurarDatos={handleRestaurarDatos}
            />
          )}
        </main>
      </div>
    </div>
  );
}

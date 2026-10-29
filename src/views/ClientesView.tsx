/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — CLIENTES VIEW (LEY 1581 HABEAS DATA)
 */

import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Building,
  User,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  FolderKanban,
  Archive,
  Edit2,
  Check,
  AlertCircle,
  FileCheck,
  X,
} from 'lucide-react';
import type { Cliente, TipoPersona, TipoIdentificacion } from '../types/legal';

interface ClientesViewProps {
  clientes: Cliente[];
  onCrearCliente: (cliente: Partial<Cliente>) => Promise<void>;
  onEditarCliente: (id: string, cliente: Partial<Cliente>) => Promise<void>;
  onArchivarCliente: (id: string) => Promise<void>;
  onVerExpediente: (expedienteId: string) => void;
}

export const ClientesView: React.FC<ClientesViewProps> = ({
  clientes,
  onCrearCliente,
  onEditarCliente,
  onArchivarCliente,
  onVerExpediente,
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'NATURAL' | 'JURIDICA'>('TODOS');
  const [filtroEstado, setFiltroEstado] = useState<'ACTIVO' | 'ARCHIVADO' | 'TODOS'>('ACTIVO');
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);

  // Modal de Creación / Edición
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoClienteId, setEditandoClienteId] = useState<string | null>(null);
  const [modalConfirmarArchivar, setModalConfirmarArchivar] = useState<Cliente | null>(null);

  // Estado del formulario
  const [formData, setFormData] = useState<{
    tipoPersona: TipoPersona;
    tipoIdentificacion: TipoIdentificacion;
    numeroIdentificacion: string;
    dv: string;
    nombreCompletoORazonSocial: string;
    representanteNombre: string;
    representanteId: string;
    representanteCargo: string;
    emailPrincipal: string;
    emailNotificacionesJudiciales: string;
    telefono: string;
    direccion: string;
    ciudad: string;
    departamento: string;
    notasInternas: string;
    autorizaHabeasData: boolean;
  }>({
    tipoPersona: 'NATURAL',
    tipoIdentificacion: 'CC',
    numeroIdentificacion: '',
    dv: '',
    nombreCompletoORazonSocial: '',
    representanteNombre: '',
    representanteId: '',
    representanteCargo: 'Representante Legal',
    emailPrincipal: '',
    emailNotificacionesJudiciales: '',
    telefono: '',
    direccion: '',
    ciudad: 'Bogotá D.C.',
    departamento: 'Cundinamarca',
    notasInternas: '',
    autorizaHabeasData: true,
  });

  const abrirModalCrear = () => {
    setEditandoClienteId(null);
    setFormData({
      tipoPersona: 'NATURAL',
      tipoIdentificacion: 'CC',
      numeroIdentificacion: '',
      dv: '',
      nombreCompletoORazonSocial: '',
      representanteNombre: '',
      representanteId: '',
      representanteCargo: 'Representante Legal',
      emailPrincipal: '',
      emailNotificacionesJudiciales: '',
      telefono: '',
      direccion: '',
      ciudad: 'Bogotá D.C.',
      departamento: 'Cundinamarca',
      notasInternas: '',
      autorizaHabeasData: true,
    });
    setModalAbierto(true);
  };

  const abrirModalEditar = (cliente: Cliente) => {
    setEditandoClienteId(cliente.id);
    setFormData({
      tipoPersona: cliente.tipoPersona,
      tipoIdentificacion: cliente.tipoIdentificacion,
      numeroIdentificacion: cliente.numeroIdentificacion,
      dv: cliente.dv || '',
      nombreCompletoORazonSocial: cliente.nombreCompletoORazonSocial,
      representanteNombre: cliente.representanteLegal?.nombre || '',
      representanteId: cliente.representanteLegal?.numeroIdentificacion || '',
      representanteCargo: cliente.representanteLegal?.cargo || 'Representante Legal',
      emailPrincipal: cliente.emailPrincipal,
      emailNotificacionesJudiciales: cliente.emailNotificacionesJudiciales,
      telefono: cliente.telefono,
      direccion: cliente.direccion,
      ciudad: cliente.ciudad,
      departamento: cliente.departamento,
      notasInternas: cliente.notasInternas || '',
      autorizaHabeasData: cliente.consentimientoLey1581.autorizado,
    });
    setModalAbierto(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombreCompletoORazonSocial || !formData.numeroIdentificacion) {
      alert('Por favor ingrese el nombre o razón social y la identificación.');
      return;
    }

    const payload: Partial<Cliente> = {
      tipoPersona: formData.tipoPersona,
      tipoIdentificacion: formData.tipoIdentificacion,
      numeroIdentificacion: formData.numeroIdentificacion,
      dv: formData.tipoPersona === 'JURIDICA' ? formData.dv : undefined,
      nombreCompletoORazonSocial: formData.nombreCompletoORazonSocial,
      representanteLegal: formData.tipoPersona === 'JURIDICA' && formData.representanteNombre ? {
        nombre: formData.representanteNombre,
        tipoIdentificacion: 'CC',
        numeroIdentificacion: formData.representanteId,
        cargo: formData.representanteCargo,
      } : undefined,
      emailPrincipal: formData.emailPrincipal,
      emailNotificacionesJudiciales: formData.emailNotificacionesJudiciales || formData.emailPrincipal,
      telefono: formData.telefono,
      direccion: formData.direccion,
      ciudad: formData.ciudad,
      departamento: formData.departamento,
      notasInternas: formData.notasInternas,
      consentimientoLey1581: {
        autorizado: formData.autorizaHabeasData,
        fechaAutorizacion: new Date().toISOString(),
        canalAutorizacion: 'DIGITAL_APP',
        finalidadTratamiento: 'Gestión procesal, representación judicial y custodia de expedientes conforme a la Ley 1581 de 2012.',
      },
    };

    if (editandoClienteId) {
      await onEditarCliente(editandoClienteId, payload);
    } else {
      await onCrearCliente(payload);
    }

    setModalAbierto(false);
  };

  // Filtrado reactivo
  const clientesFiltrados = clientes.filter((c) => {
    if (filtroEstado !== 'TODOS' && c.estado !== filtroEstado) return false;
    if (filtroTipo !== 'TODOS' && c.tipoPersona !== filtroTipo) return false;
    if (busqueda) {
      const q = busqueda.toLowerCase();
      const match =
        c.nombreCompletoORazonSocial.toLowerCase().includes(q) ||
        c.numeroIdentificacion.includes(q) ||
        c.emailPrincipal.toLowerCase().includes(q) ||
        c.ciudad.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Barra Superior con Controles y Búsqueda */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, NIT, cédula o correo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Segmented controls para filtro de Tipo */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
            <button
              onClick={() => setFiltroTipo('TODOS')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filtroTipo === 'TODOS'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltroTipo('NATURAL')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filtroTipo === 'NATURAL'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Naturales
            </button>
            <button
              onClick={() => setFiltroTipo('JURIDICA')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filtroTipo === 'JURIDICA'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Jurídicas
            </button>
          </div>

          <button
            onClick={abrirModalCrear}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Registrar Cliente</span>
          </button>
        </div>
      </div>

      {/* Grid de Clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clientesFiltrados.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
            <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No se encontraron clientes registrados
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Ajuste los filtros de búsqueda o registre un nuevo cliente titular.
            </p>
            <button
              onClick={abrirModalCrear}
              className="mt-4 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Primer Cliente</span>
            </button>
          </div>
        ) : (
          clientesFiltrados.map((cliente) => (
            <div
              key={cliente.id}
              className={`p-5 rounded-xl border transition-all flex flex-col justify-between ${
                cliente.estado === 'ARCHIVADO'
                  ? 'border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950/40 opacity-75'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div>
                {/* Header Tarjeta */}
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {cliente.tipoPersona === 'JURIDICA' ? (
                        <Building className="w-4 h-4 text-amber-500" />
                      ) : (
                        <User className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                        {cliente.tipoIdentificacion} {cliente.numeroIdentificacion}
                        {cliente.dv ? `-${cliente.dv}` : ''}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                        {cliente.nombreCompletoORazonSocial}
                      </h4>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                      cliente.estado === 'ACTIVO'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {cliente.estado}
                  </span>
                </div>

                {/* Representante Legal si aplica */}
                {cliente.tipoPersona === 'JURIDICA' && cliente.representanteLegal && (
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 mb-2 pl-2 border-l-2 border-amber-400/40">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Rep. Legal:</span>{' '}
                    {cliente.representanteLegal.nombre}
                  </div>
                )}

                {/* Datos de Contacto y Notificación Judicial */}
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate" title={cliente.emailPrincipal}>
                      {cliente.emailPrincipal}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 truncate text-[11px] text-amber-600 dark:text-amber-400">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate" title={`Notificación Judicial Ley 2213: ${cliente.emailNotificacionesJudiciales}`}>
                      Judicial: {cliente.emailNotificacionesJudiciales}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{cliente.telefono}</span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {cliente.ciudad}, {cliente.departamento}
                    </span>
                  </div>
                </div>

                {/* Cumplimiento Habeas Data Ley 1581 */}
                <div className="mt-3 p-2 rounded bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500 flex items-center gap-1">
                    <FileCheck className="w-3 h-3 text-emerald-500" />
                    Habeas Data Ley 1581
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    Autorizado
                  </span>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => abrirModalEditar(cliente)}
                    className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Editar información del cliente"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setModalConfirmarArchivar(cliente)}
                    className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-red-600 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title={cliente.estado === 'ARCHIVADO' ? 'Reactivar cliente' : 'Archivar cliente'}
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-[11px] font-mono text-slate-400">
                  {cliente.expedientesIds.length} exp.
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL CREAR / EDITAR CLIENTE */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {editandoClienteId ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
              </h3>
              <button
                onClick={() => setModalAbierto(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Tipo Persona */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Naturaleza Jurídica
                  </label>
                  <select
                    value={formData.tipoPersona}
                    onChange={(e) => setFormData({ ...formData, tipoPersona: e.target.value as TipoPersona })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="NATURAL">Persona Natural</option>
                    <option value="JURIDICA">Persona Jurídica (Empresa/Sociedad)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Tipo de Documento
                  </label>
                  <select
                    value={formData.tipoIdentificacion}
                    onChange={(e) => setFormData({ ...formData, tipoIdentificacion: e.target.value as TipoIdentificacion })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="CC">Cédula de Ciudadanía (C.C.)</option>
                    <option value="NIT">NIT (Número de Identificación Tributaria)</option>
                    <option value="CE">Cédula de Extranjería (C.E.)</option>
                    <option value="PASAPORTE">Pasaporte</option>
                  </select>
                </div>
              </div>

              {/* Nombre e Identificación */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {formData.tipoPersona === 'JURIDICA' ? 'Razón Social' : 'Nombre Completo'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombreCompletoORazonSocial}
                    onChange={(e) => setFormData({ ...formData, nombreCompletoORazonSocial: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    placeholder="Ej. Inversiones Andinas S.A.S. o Juan Carlos Pérez"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Número de Identificación *
                  </label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      required
                      value={formData.numeroIdentificacion}
                      onChange={(e) => setFormData({ ...formData, numeroIdentificacion: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                      placeholder="901.458.912"
                    />
                    {formData.tipoPersona === 'JURIDICA' && (
                      <input
                        type="text"
                        maxLength={1}
                        value={formData.dv}
                        onChange={(e) => setFormData({ ...formData, dv: e.target.value })}
                        className="w-10 px-2 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-center"
                        placeholder="DV"
                        title="Dígito de verificación"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Representante Legal si es Persona Jurídica */}
              {formData.tipoPersona === 'JURIDICA' && (
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                  <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Datos del Representante Legal
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Nombre Completo</label>
                      <input
                        type="text"
                        value={formData.representanteNombre}
                        onChange={(e) => setFormData({ ...formData, representanteNombre: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                        placeholder="Nombre del Gerente / Representante"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Cédula de Ciudadanía</label>
                      <input
                        type="text"
                        value={formData.representanteId}
                        onChange={(e) => setFormData({ ...formData, representanteId: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                        placeholder="C.C. No."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Correos de Contacto y Notificación Judicial Ley 2213 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Correo Electrónico Principal *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.emailPrincipal}
                    onChange={(e) => setFormData({ ...formData, emailPrincipal: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    placeholder="contacto@cliente.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-amber-600 dark:text-amber-400 mb-1">
                    Buzón Notificaciones Judiciales (Ley 2213/2022) *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.emailNotificacionesJudiciales}
                    onChange={(e) => setFormData({ ...formData, emailNotificacionesJudiciales: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    placeholder="notificacionesjudiciales@cliente.com"
                  />
                </div>
              </div>

              {/* Teléfono, Dirección y Ciudad */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono Móvil / Fijo
                  </label>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    placeholder="+57 300 000 0000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    value={formData.ciudad}
                    onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Dirección Física
                  </label>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    placeholder="Calle / Carrera"
                  />
                </div>
              </div>

              {/* Consentimiento Habeas Data Ley 1581 */}
              <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="habeasDataCheck"
                  checked={formData.autorizaHabeasData}
                  onChange={(e) => setFormData({ ...formData, autorizaHabeasData: e.target.checked })}
                  className="mt-0.5 rounded text-amber-500 focus:ring-amber-400"
                />
                <label htmlFor="habeasDataCheck" className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
                  <span className="font-semibold text-emerald-800 dark:text-emerald-400">
                    Consentimiento Expreso Ley 1581 de 2012 (Habeas Data):
                  </span>{' '}
                  El cliente autorizó de manera previa, expresa e informada el tratamiento de sus datos personales y sensibles para la gestión de su defensa y representación jurídica.
                </label>
              </div>

              {/* Botones Guardar / Cancelar */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm"
                >
                  {editandoClienteId ? 'Guardar Cambios' : 'Registrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE OPERACIÓN DESTRUCTIVA (ARCHIVAR) */}
      {modalConfirmarArchivar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 mb-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Confirmar Operación sobre Cliente
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              ¿Está seguro de que desea cambiar el estado del cliente{' '}
              <strong className="text-slate-900 dark:text-slate-100">
                {modalConfirmarArchivar.nombreCompletoORazonSocial}
              </strong>{' '}
              a {modalConfirmarArchivar.estado === 'ARCHIVADO' ? 'ACTIVO' : 'ARCHIVADO'}? Esta acción queda registrada en la bitácora de auditoría.
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setModalConfirmarArchivar(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  await onArchivarCliente(modalConfirmarArchivar.id);
                  setModalConfirmarArchivar(null);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 rounded-lg"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

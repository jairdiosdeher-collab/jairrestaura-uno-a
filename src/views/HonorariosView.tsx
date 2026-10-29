/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — GESTIÓN ADMINISTRATIVA Y HONORARIOS
 */

import React, { useState } from 'react';
import {
  ReceiptText,
  Plus,
  DollarSign,
  TrendingUp,
  FileCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  FolderKanban,
  User,
  ShieldCheck,
  X,
  CreditCard,
} from 'lucide-react';
import type { RegistroHonorario, Expediente, Cliente } from '../types/legal';

interface HonorariosViewProps {
  honorarios: RegistroHonorario[];
  expedientes: Expediente[];
  clientes: Cliente[];
  onCrearHonorario: (honorario: Partial<RegistroHonorario>) => Promise<void>;
  onRegistrarPago: (honorarioId: string, pago: any) => Promise<void>;
}

export const HonorariosView: React.FC<HonorariosViewProps> = ({
  honorarios,
  expedientes,
  clientes,
  onCrearHonorario,
  onRegistrarPago,
}) => {
  const [modalNuevoHonorario, setModalNuevoHonorario] = useState(false);
  const [modalNuevoPago, setModalNuevoPago] = useState<RegistroHonorario | null>(null);

  // Formulario nuevo honorario
  const [nuevoHon, setNuevoHon] = useState({
    clienteId: clientes[0]?.id || '',
    expedienteId: '',
    concepto: '',
    modalidad: 'CUOTA_FIJA',
    valorCOP: '',
    fechaAcuerdo: new Date().toISOString().split('T')[0],
  });

  // Formulario abono/pago
  const [nuevoPago, setNuevoPago] = useState({
    montoCOP: '',
    medioPago: 'TRANSFERENCIA_BANCARIA',
    numeroComprobante: '',
    verificadoPorContabilidad: true,
  });

  const totalAcordado = honorarios.reduce((sum, h) => sum + h.valorAcordadoCOP, 0);
  const totalRecaudado = honorarios.reduce((sum, h) => sum + h.valorPagadoCOP, 0);
  const totalSaldoPendiente = honorarios.reduce((sum, h) => sum + h.saldoPendienteCOP, 0);

  const handleCrearHonorarioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoHon.concepto.trim() || !nuevoHon.valorCOP) {
      alert('El concepto y el valor en COP son obligatorios');
      return;
    }

    const cliente = clientes.find((c) => c.id === nuevoHon.clienteId);
    const exp = expedientes.find((e) => e.id === nuevoHon.expedienteId);

    await onCrearHonorario({
      clienteId: nuevoHon.clienteId,
      clienteNombre: cliente?.nombreCompletoORazonSocial || 'Cliente',
      expedienteId: exp?.id,
      expedienteCodigo: exp?.codigoInterno,
      concepto: nuevoHon.concepto,
      modalidad: nuevoHon.modalidad as any,
      valorAcordadoCOP: Number(nuevoHon.valorCOP),
      fechaAcuerdo: nuevoHon.fechaAcuerdo,
    });

    setModalNuevoHonorario(false);
  };

  const handleRegistrarPagoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalNuevoPago || !nuevoPago.montoCOP) return;

    await onRegistrarPago(modalNuevoPago.id, {
      montoCOP: Number(nuevoPago.montoCOP),
      medioPago: nuevoPago.medioPago,
      numeroComprobante: nuevoPago.numeroComprobante,
      verificadoPorContabilidad: nuevoPago.verificadoPorContabilidad,
    });

    setModalNuevoPago(null);
    setNuevoPago({
      montoCOP: '',
      medioPago: 'TRANSFERENCIA_BANCARIA',
      numeroComprobante: '',
      verificadoPorContabilidad: true,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Indicadores Financieros Reales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="text-xs font-semibold text-slate-400">Total Honorarios Acordados</div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            ${(totalAcordado / 1000000).toFixed(2)}M COP
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            En {honorarios.length} acuerdos contractuales
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            Honorarios Recaudados Efectivos
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            ${(totalRecaudado / 1000000).toFixed(2)}M COP
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {((totalRecaudado / (totalAcordado || 1)) * 100).toFixed(0)}% de recaudo efectivo
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">
            Saldo Pendiente por Cobrar
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
            ${(totalSaldoPendiente / 1000000).toFixed(2)}M COP
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Cartera vigente por etapas procesales
          </div>
        </div>
      </div>

      {/* Barra de Título y Botón */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Acuerdos de Honorarios y Facturación
          </h2>
          <p className="text-xs text-slate-500">
            Diferenciación estricta entre abono registrado y comprobación contable.
          </p>
        </div>

        <button
          onClick={() => setModalNuevoHonorario(true)}
          className="px-3.5 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm inline-flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Registrar Acuerdo de Honorarios</span>
        </button>
      </div>

      {/* Lista de Registros de Honorarios */}
      <div className="space-y-4">
        {honorarios.map((hon) => (
          <div
            key={hon.id}
            className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {hon.clienteNombre}
                  </span>
                  {hon.expedienteCodigo && (
                    <>
                      <span>·</span>
                      <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                        {hon.expedienteCodigo}
                      </span>
                    </>
                  )}
                  <span>·</span>
                  <span>Acordado el {hon.fechaAcuerdo}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {hon.concepto}
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 text-[11px] font-semibold rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                  {hon.modalidad.replace(/_/g, ' ')}
                </span>
                <span
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded ${
                    hon.estado === 'PAGADO_TOTAL'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                  }`}
                >
                  {hon.estado.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            {/* Cifras Financieras */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono tabular-nums">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                <span className="text-[10px] text-slate-400 block font-sans">Monto Total Pactado:</span>
                <strong className="text-sm text-slate-900 dark:text-slate-100">
                  ${hon.valorAcordadoCOP.toLocaleString('es-CO')} COP
                </strong>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50/40 dark:bg-emerald-950/20">
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block font-sans">
                  Total Recaudado:
                </span>
                <strong className="text-sm text-emerald-700 dark:text-emerald-400">
                  ${hon.valorPagadoCOP.toLocaleString('es-CO')} COP
                </strong>
              </div>
              <div className="p-3 rounded-lg bg-amber-50/40 dark:bg-amber-950/20">
                <span className="text-[10px] text-amber-700 dark:text-amber-400 block font-sans">
                  Saldo Restante:
                </span>
                <strong className="text-sm text-amber-700 dark:text-amber-400">
                  ${hon.saldoPendienteCOP.toLocaleString('es-CO')} COP
                </strong>
              </div>
            </div>

            {/* Pagos Realizados y Comprobantes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Historial de Abonos Registrados ({hon.pagosRegistrados.length})
                </span>
                {hon.saldoPendienteCOP > 0 && (
                  <button
                    onClick={() => setModalNuevoPago(hon)}
                    className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Registrar Abono</span>
                  </button>
                )}
              </div>

              {hon.pagosRegistrados.length === 0 ? (
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/30 text-xs text-slate-400 text-center">
                  Aún no se registran abonos o anticipos para este acuerdo.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-mono">
                  {hon.pagosRegistrados.map((p) => (
                    <div key={p.id} className="py-2 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400">{p.fechaPago}</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          ${p.montoCOP.toLocaleString('es-CO')} COP
                        </span>
                        <span className="text-[11px] text-slate-400 font-sans">
                          via {p.medioPago.replace(/_/g, ' ')} ({p.numeroComprobante})
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {p.verificadoPorContabilidad ? (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-sans font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Comprobante contable verificado
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-sans font-medium">
                            Registrado por abogado (Pendiente contabilidad)
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL NUEVO ACUERDO */}
      {modalNuevoHonorario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Registrar Acuerdo de Honorarios Profesionales
              </h3>
              <button
                onClick={() => setModalNuevoHonorario(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearHonorarioSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">
                  Cliente Titular *
                </label>
                <select
                  required
                  value={nuevoHon.clienteId}
                  onChange={(e) => setNuevoHon({ ...nuevoHon, clienteId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombreCompletoORazonSocial}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">
                  Expediente Vinculado (Opcional)
                </label>
                <select
                  value={nuevoHon.expedienteId}
                  onChange={(e) => setNuevoHon({ ...nuevoHon, expedienteId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="">(Sin expediente — asesoría general)</option>
                  {expedientes.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.codigoInterno} — {e.clienteNombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">
                  Concepto de los Servicios Jurídicos *
                </label>
                <input
                  type="text"
                  required
                  value={nuevoHon.concepto}
                  onChange={(e) => setNuevoHon({ ...nuevoHon, concepto: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  placeholder="Ej: Representación integral proceso declarativo"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">
                    Modalidad
                  </label>
                  <select
                    value={nuevoHon.modalidad}
                    onChange={(e) => setNuevoHon({ ...nuevoHon, modalidad: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="CUOTA_FIJA">Cuota Fija por Etapas</option>
                    <option value="CUOTA_LITIS">Cuota Litis (% Éxito)</option>
                    <option value="MIXTO">Mixto (Fijo + Éxito)</option>
                    <option value="HORA_PROFESIONAL">Tarifa por Hora</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">
                    Valor Acordado en COP *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={nuevoHon.valorCOP}
                    onChange={(e) => setNuevoHon({ ...nuevoHon, valorCOP: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    placeholder="Ej. 15000000"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalNuevoHonorario(false)}
                  className="px-3.5 py-1.5 text-slate-600 dark:text-slate-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm"
                >
                  Guardar Acuerdo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR PAGO / ABONO */}
      {modalNuevoPago && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Registrar Abono a Honorarios
              </h3>
              <button
                onClick={() => setModalNuevoPago(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegistrarPagoSubmit} className="mt-4 space-y-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-500">
                Cliente: <strong>{modalNuevoPago.clienteNombre}</strong> · Saldo pendiente:{' '}
                <strong>${modalNuevoPago.saldoPendienteCOP.toLocaleString('es-CO')} COP</strong>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">
                  Monto del Abono en COP *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={modalNuevoPago.saldoPendienteCOP}
                  value={nuevoPago.montoCOP}
                  onChange={(e) => setNuevoPago({ ...nuevoPago, montoCOP: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  placeholder="Ej. 5000000"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">
                    Medio de Pago
                  </label>
                  <select
                    value={nuevoPago.medioPago}
                    onChange={(e) => setNuevoPago({ ...nuevoPago, medioPago: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="TRANSFERENCIA_BANCARIA">Transferencia Bancaria</option>
                    <option value="CONSIGNACION">Consignación</option>
                    <option value="EFECTIVO">Efectivo en Caja</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">
                    No. Comprobante / Recibo
                  </label>
                  <input
                    type="text"
                    value={nuevoPago.numeroComprobante}
                    onChange={(e) => setNuevoPago({ ...nuevoPago, numeroComprobante: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    placeholder="BCO-12345"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="verifContableCheck"
                  checked={nuevoPago.verificadoPorContabilidad}
                  onChange={(e) => setNuevoPago({ ...nuevoPago, verificadoPorContabilidad: e.target.checked })}
                  className="rounded text-amber-500"
                />
                <label htmlFor="verifContableCheck" className="text-slate-700 dark:text-slate-300">
                  Comprobante bancario verificado efectivamente en extracto
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalNuevoPago(null)}
                  className="px-3.5 py-1.5 text-slate-600 dark:text-slate-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm"
                >
                  Confirmar Abono
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — SEGURIDAD, AUDITORÍA Y HABEAS DATA (LEY 1581)
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Download,
  RotateCcw,
  Users,
  Lock,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  History,
} from 'lucide-react';
import type { RegistroAuditoria, Usuario } from '../types/legal';

interface SeguridadViewProps {
  auditoria: RegistroAuditoria[];
  usuarios: Usuario[];
  organizacion: any;
  onRestaurarDatos: () => Promise<void>;
}

export const SeguridadView: React.FC<SeguridadViewProps> = ({
  auditoria,
  usuarios,
  organizacion,
  onRestaurarDatos,
}) => {
  const [restaurando, setRestaurando] = useState(false);
  const [descargando, setDescargando] = useState(false);

  const handleDescargarBackup = () => {
    setDescargando(true);
    window.location.href = '/api/system/backup';
    setTimeout(() => setDescargando(false), 2000);
  };

  const handleRestaurar = async () => {
    const confirma = window.confirm(
      '¿Está seguro de que desea reiniciar la base de datos a sus valores iniciales? Esta acción reestablecerá los expedientes y clientes de prueba.'
    );
    if (!confirma) return;

    setRestaurando(true);
    try {
      await onRestaurarDatos();
      alert('Base de datos restablecida correctamente');
    } catch (err: any) {
      alert('Error al restablecer: ' + err.message);
    } finally {
      setRestaurando(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Declaración de Cumplimiento Normativo Colombiano */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Arquitectura Enterprise de Seguridad y Cumplimiento Normativo</span>
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Protección de Datos Personales (Ley 1581 de 2012) y Deontología (Ley 1123 de 2007)
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Aislamiento estricto por organización titular ({organizacion.nombre}), bitácora inmutable de eventos procesales, control granular de privilegios y respaldo institucional cifrado.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDescargarBackup}
            disabled={descargando}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg inline-flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar Copia de Respaldo (.json)</span>
          </button>

          <button
            onClick={handleRestaurar}
            disabled={restaurando}
            className="px-3.5 py-2 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 rounded-lg inline-flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer Datos Semilla</span>
          </button>
        </div>
      </div>

      {/* Matriz de Roles y Permisos (RBAC) */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Users className="w-4 h-4 text-amber-500" />
          <span>Matriz de Roles y Accesos Configurada</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-slate-100">
                Abogado Titular / Director
              </span>
              <span className="font-mono text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded">
                ADMIN_TITULAR
              </span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Acceso total sin restricciones, firma de poderes, refrendación de términos procesales, acuerdos de honorarios y exportación de bases de datos.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-slate-100">
                Abogado Litigante Asociado
              </span>
              <span className="font-mono text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded">
                ABOGADO_ASOCIADO
              </span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Gestión de expedientes asignados, registro de actuaciones procesales, redacción documental y uso del Asistente IA.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-slate-100">
                Asistente / Paralegal
              </span>
              <span className="font-mono text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded">
                ASISTENTE_JUDICIAL
              </span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Consulta de estados de la Rama Judicial, registro de traslados, carga de piezas procesales y cálculo preliminar de términos.
            </p>
          </div>
        </div>
      </div>

      {/* Bitácora Inmutable de Auditoría (Audit Trail) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Pista de Auditoría en Tiempo Real ({auditoria.length} registros)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Inmutable · Conservación 5 años
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/30 text-[11px] text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Fecha y Hora</th>
                <th className="px-5 py-3">Usuario & Rol</th>
                <th className="px-5 py-3">Operación</th>
                <th className="px-5 py-3">Módulo</th>
                <th className="px-5 py-3">Detalle del Evento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
              {auditoria.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                  <td className="px-5 py-3 whitespace-nowrap text-slate-500">
                    {new Date(log.timestamp).toLocaleString('es-CO')}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap font-sans">
                    <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                      {log.usuarioNombre}
                    </span>
                    <span className="text-[10px] text-slate-400">{log.usuarioRol}</span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {log.accion}
                    </span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-amber-600 dark:text-amber-400 font-bold">
                    {log.modulo}
                  </td>
                  <td className="px-5 py-3 font-sans text-slate-700 dark:text-slate-300 max-w-md truncate" title={log.descripcionDetallada}>
                    {log.descripcionDetallada}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

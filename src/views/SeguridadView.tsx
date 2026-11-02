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
  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);
  const [mensajeToast, setMensajeToast] = useState<{ tipo: 'exito' | 'error' | 'info'; texto: string } | null>(null);

  const mostrarAviso = (texto: string, tipo: 'exito' | 'error' | 'info' = 'info') => {
    setMensajeToast({ tipo, texto });
    setTimeout(() => setMensajeToast(null), 4000);
  };

  const handleDescargarBackup = async () => {
    setDescargando(true);
    try {
      const res = await fetch('/api/system/backup', {
        headers: {
          'Authorization': 'Bearer jairrestaura-demo-session-token-2026',
        },
      });

      if (!res.ok) {
        throw new Error(`Servidor respondió con código ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${organizacion.id || 'jairrestaura'}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      mostrarAviso('Copia de respaldo descargada exitosamente en formato .json', 'exito');
    } catch (err: any) {
      mostrarAviso('Error al descargar copia de respaldo: ' + err.message, 'error');
    } finally {
      setDescargando(false);
    }
  };

  const ejecutarRestauracion = async () => {
    setMostrarModalConfirmacion(false);
    setRestaurando(true);
    try {
      await onRestaurarDatos();
      mostrarAviso('Base de datos restablecida correctamente a sus valores predeterminados', 'exito');
    } catch (err: any) {
      mostrarAviso('Error al restablecer base de datos: ' + err.message, 'error');
    } finally {
      setRestaurando(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Feedback */}
      {mensajeToast && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${
            mensajeToast.tipo === 'exito'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : mensajeToast.tipo === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              : 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-200'
          }`}
        >
          <span>{mensajeToast.texto}</span>
          <button
            onClick={() => setMensajeToast(null)}
            className="ml-4 text-xs underline font-normal cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Modal de confirmación para restablecimiento */}
      {mostrarModalConfirmacion && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-2 bg-rose-100 dark:bg-rose-950/60 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Confirmar Restablecimiento
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              ¿Está seguro de que desea restablecer la base de datos a sus valores iniciales? Esta acción recargará los datos de prueba y clientes institucionales predeterminados.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setMostrarModalConfirmacion(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={ejecutarRestauracion}
                disabled={restaurando}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer"
              >
                {restaurando ? 'Restableciendo...' : 'Sí, Restablecer'}
              </button>
            </div>
          </div>
        </div>
      )}

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
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{descargando ? 'Descargando...' : 'Descargar Copia de Respaldo (.json)'}</span>
          </button>

          <button
            onClick={() => setMostrarModalConfirmacion(true)}
            disabled={restaurando}
            className="px-3.5 py-2 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{restaurando ? 'Restableciendo...' : 'Restablecer Datos Semilla'}</span>
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

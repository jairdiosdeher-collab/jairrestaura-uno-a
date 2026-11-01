/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — VERCEL SERVERLESS FUNCTION
 * Ruta: GET /api/dashboard/stats
 * Responde con los indicadores reales de la firma bajo aislamiento multi-inquilino.
 */

import fs from 'fs';
import path from 'path';

function getDBPath(): string {
  return path.join(process.cwd(), 'data', 'jairrestaura_db.json');
}

function loadDB(): any {
  try {
    const p = getDBPath();
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    }
  } catch (e) {
    // Modo serverless read-only
  }
  return {
    clientes: [],
    expedientes: [],
    terminos: [],
    documentos: [],
    honorarios: [],
    auditoria: [],
    actuaciones: {},
  };
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-organizacion-id');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: `Método ${req.method} no permitido.` });
  }

  const organizacionId = req.headers['x-organizacion-id'] || 'org-jairrestaura-001';
  const db = loadDB();

  const clientesOrg = (db.clientes || []).filter((c: any) => c.organizacionId === organizacionId);
  const expedientesOrg = (db.expedientes || []).filter((e: any) => e.organizacionId === organizacionId);
  const terminosOrg = (db.terminos || []).filter((t: any) => t.organizacionId === organizacionId);
  const documentosOrg = (db.documentos || []).filter((d: any) => d.organizacionId === organizacionId);
  const honorariosOrg = (db.honorarios || []).filter((h: any) => h.organizacionId === organizacionId);
  const auditoriaOrg = (db.auditoria || []).filter((a: any) => a.organizacionId === organizacionId);

  const totalClientes = clientesOrg.filter((c: any) => c.estado === 'ACTIVO').length;
  const clientesConHabeasData = clientesOrg.filter(
    (c: any) => c.consentimientoLey1581 && c.consentimientoLey1581.autorizado
  ).length;

  const expedientesActivos = expedientesOrg.filter(
    (e: any) => e.estado !== 'ARCHIVADO' && e.estado !== 'TERMINADO_CONCILIACION'
  ).length;

  const hoyStr = new Date().toISOString().split('T')[0];

  const terminosPendientes = terminosOrg.filter((t: any) => t.estado === 'PENDIENTE' || t.estado === 'VERIFICADO');
  const terminosCumplidos = terminosOrg.filter((t: any) => t.estado === 'CUMPLIDO');
  const terminosVencidos = terminosOrg.filter(
    (t: any) => t.estado !== 'CUMPLIDO' && t.fechaVencimientoCalculada < hoyStr
  );
  const terminosCriticos = terminosPendientes.filter(
    (t: any) => t.fechaVencimientoCalculada <= hoyStr || t.prioridad === 'ALTA'
  );

  const proximosTerminosOrdenados = [...terminosPendientes].sort((a: any, b: any) =>
    (a.fechaVencimientoCalculada || '').localeCompare(b.fechaVencimientoCalculada || '')
  );

  const expedientesEnriquecidos = [...expedientesOrg]
    .sort((a: any, b: any) => (b.fechaActualizacion || b.fechaInicio || '').localeCompare(a.fechaActualizacion || a.fechaInicio || ''))
    .slice(0, 5)
    .map((exp: any) => {
      const actuacionesExp = (db.actuaciones && db.actuaciones[exp.id]) || [];
      const ultimaActuacion = actuacionesExp.length > 0 ? actuacionesExp[0] : null;
      const terminosExp = terminosPendientes
        .filter((t: any) => t.expedienteId === exp.id)
        .sort((a: any, b: any) => (a.fechaVencimientoCalculada || '').localeCompare(b.fechaVencimientoCalculada || ''));
      const proximoTermino = terminosExp.length > 0 ? terminosExp[0] : null;
      const clienteAsociado = clientesOrg.find((c: any) => c.id === exp.clienteId);

      return {
        ...exp,
        ultimaActuacion,
        proximoTermino,
        clienteAutorizadoHabeasData: !!clienteAsociado?.consentimientoLey1581?.autorizado,
      };
    });

  const totalHonorariosPactados = honorariosOrg.reduce((acc: number, h: any) => acc + (Number(h.valorAcordadoCOP) || 0), 0);
  const totalHonorariosRecaudados = honorariosOrg.reduce((acc: number, h: any) => acc + (Number(h.valorPagadoCOP) || 0), 0);
  const saldoPorCobrar = Math.max(0, totalHonorariosPactados - totalHonorariosRecaudados);
  const totalHonorariosFacturados = totalHonorariosPactados;

  return res.status(200).json({
    totalClientes,
    clientesConHabeasData,
    expedientesActivos,
    totalExpedientes: expedientesOrg.length,
    terminosPendientesTotal: terminosPendientes.length,
    terminosCriticosTotal: terminosCriticos.length,
    terminosVencidosTotal: terminosVencidos.length,
    terminosCumplidosTotal: terminosCumplidos.length,
    totalDocumentos: documentosOrg.length,
    totalHonorariosPactados,
    totalHonorariosFacturados,
    totalHonorariosRecaudados,
    saldoPorCobrar,
    proximosTerminos: proximosTerminosOrdenados.slice(0, 5),
    expedientesRecientes: expedientesEnriquecidos,
    actividadReciente: auditoriaOrg.slice(0, 6),
  });
}

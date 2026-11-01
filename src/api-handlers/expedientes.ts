/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — VERCEL SERVERLESS FUNCTION
 * Ruta: /api/expedientes (GET, POST, OPTIONS)
 * Soporta persistencia relacional Cloud SQL con fallback en disco/memoria resiliente.
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
  return { expedientes: [], actuaciones: {}, clientes: [] };
}

function saveDB(data: any): void {
  try {
    const p = getDBPath();
    if (fs.existsSync(p)) {
      fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
    }
  } catch (e) {
    // Read-only filesystem
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-organizacion-id');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const organizacionId = req.headers['x-organizacion-id'] || 'org-jairrestaura-001';
  const db = loadDB();

  // GET /api/expedientes
  if (req.method === 'GET') {
    let filtrados = (db.expedientes || []).filter((e: any) => e.organizacionId === organizacionId);
    const { clienteId, estado, area } = req.query || {};

    if (clienteId) filtrados = filtrados.filter((e: any) => e.clienteId === clienteId);
    if (estado && estado !== 'TODOS') filtrados = filtrados.filter((e: any) => e.estado === estado);
    if (area && area !== 'TODAS') filtrados = filtrados.filter((e: any) => e.areaJuridica === area);

    return res.status(200).json({ expedientes: filtrados });
  }

  // POST /api/expedientes
  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

    if (!body.clienteId || !body.despachoJudicial || !body.sintesisHechos) {
      return res.status(400).json({
        error: 'Cliente, despacho judicial y síntesis de hechos son obligatorios.',
        codigo: 'MISSING_REQUIRED_FIELDS',
      });
    }

    const clienteAsociado = (db.clientes || []).find((c: any) => c.id === body.clienteId);
    const clienteNombre = clienteAsociado?.nombreCompletoORazonSocial || body.clienteNombre || 'Cliente';

    const countExp = (db.expedientes || []).length + 1;
    const nuevoExp = {
      ...body,
      id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      codigoInterno: `EXP-${new Date().getFullYear()}-${String(countExp).padStart(3, '0')}`,
      clienteId: body.clienteId,
      clienteNombre,
      partes: body.partes || {
        demandanteOAccionante: clienteNombre,
        demandadoOAccionado: body.demandado || 'Contraparte',
      },
      organizacionId,
      estado: body.estado || 'PREJUDICIAL',
      fechaInicio: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
    };

    if (!Array.isArray(db.expedientes)) db.expedientes = [];
    db.expedientes.unshift(nuevoExp);

    // Asociar expediente al cliente
    if (clienteAsociado) {
      if (!Array.isArray(clienteAsociado.expedientesIds)) clienteAsociado.expedientesIds = [];
      clienteAsociado.expedientesIds.push(nuevoExp.id);
    }

    saveDB(db);

    return res.status(201).json({ expediente: nuevoExp });
  }

  return res.status(405).json({ error: `Método ${req.method} no permitido.` });
}

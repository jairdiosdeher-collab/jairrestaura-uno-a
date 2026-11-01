/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — VERCEL SERVERLESS FUNCTION
 * Ruta: /api/terminos (GET, POST, OPTIONS)
 * Soporta cálculo de términos procesales colombianos (Ley 2213/2022, Ley Emiliani, CGP Art. 118).
 */

import fs from 'fs';
import path from 'path';
import { calcularTerminoColombiano } from '../src/utils/colombianHolidays.ts';

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
  return { terminos: [], expedientes: [], auditoria: [] };
}

function saveDB(data: any): void {
  try {
    const p = getDBPath();
    if (fs.existsSync(p)) {
      fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
    }
  } catch (e) {
    // Read-only serverless filesystem
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

  // GET /api/terminos
  if (req.method === 'GET') {
    let filtrados = (db.terminos || []).filter((t: any) => t.organizacionId === organizacionId);
    const { expedienteId, estado } = req.query || {};

    if (expedienteId) {
      filtrados = filtrados.filter((t: any) => t.expedienteId === expedienteId);
    }
    if (estado && estado !== 'TODOS') {
      filtrados = filtrados.filter((t: any) => t.estado === estado);
    }

    return res.status(200).json({ terminos: filtrados });
  }

  // POST /api/terminos
  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

    // Sub-acción: Computar término judicial
    if (body.action === 'COMPUTAR' || req.query?.action === 'computar') {
      const { fechaNotificacionOInicio, duracionDias, aplicaReglaLey2213 } = body;
      if (!fechaNotificacionOInicio || !duracionDias) {
        return res.status(400).json({
          error: 'La fecha de notificación y los días de duración son obligatorios para el cómputo.',
          codigo: 'MISSING_COMPUTATION_PARAMS',
        });
      }

      const resultado = calcularTerminoColombiano(
        fechaNotificacionOInicio,
        Number(duracionDias),
        'HABILES_JUDICIALES',
        !!aplicaReglaLey2213
      );

      return res.status(200).json({ resultado });
    }

    // Sub-acción: Confirmar cómputo por abogado titular
    if (body.action === 'CONFIRM' && body.terminoId) {
      const termino = (db.terminos || []).find((t: any) => t.id === body.terminoId && t.organizacionId === organizacionId);
      if (!termino) {
        return res.status(404).json({ error: 'Término no encontrado en la organización.' });
      }
      termino.calculoConfirmadoPorAbogado = true;
      termino.abogadoQueConfirmo = body.abogadoNombre || 'Dr. Jair';
      termino.estado = 'VERIFICADO';
      saveDB(db);
      return res.status(200).json({ termino });
    }

    // Sub-acción: Completar término
    if (body.action === 'COMPLETE' && body.terminoId) {
      const termino = (db.terminos || []).find((t: any) => t.id === body.terminoId && t.organizacionId === organizacionId);
      if (!termino) {
        return res.status(404).json({ error: 'Término no encontrado en la organización.' });
      }
      termino.estado = 'CUMPLIDO';
      saveDB(db);
      return res.status(200).json({ termino });
    }

    // Creación de nuevo término
    if (!body.titulo || !body.fechaNotificacionOInicio) {
      return res.status(400).json({
        error: 'El título y la fecha de notificación son obligatorios.',
        codigo: 'MISSING_REQUIRED_FIELDS',
      });
    }

    // Validación de pertenencia de expediente si fue especificado
    if (body.expedienteId) {
      const exp = (db.expedientes || []).find((e: any) => e.id === body.expedienteId);
      if (exp && exp.organizacionId !== organizacionId) {
        return res.status(403).json({
          error: 'El expediente no pertenece a su organización jurídica.',
          codigo: 'CROSS_TENANT_FORBIDDEN',
        });
      }
    }

    const duracion = body.duracionDias ? Number(body.duracionDias) : 5;
    const computo = calcularTerminoColombiano(
      body.fechaNotificacionOInicio,
      duracion,
      'HABILES_JUDICIALES',
      !!body.aplicaReglaLey2213
    );

    const nuevoTermino = {
      ...body,
      id: `term-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      organizacionId,
      fechaVencimientoCalculada: computo.fechaVencimientoCalculada,
      notasCómputo: body.notasCómputo || `${computo.fundamentoLegal} - ${computo.advertenciaDeontologica}`,
      calculoConfirmadoPorAbogado: false,
      estado: 'PENDIENTE',
      prioridad: body.prioridad || 'MEDIA',
      responsableId: body.responsableId || 'usr-jair-01',
      responsableNombre: body.responsableNombre || 'Dr. Jair',
    };

    if (!db.terminos) db.terminos = [];
    db.terminos.unshift(nuevoTermino);
    saveDB(db);

    return res.status(201).json({ termino: nuevoTermino, computo });
  }

  return res.status(405).json({ error: `Método ${req.method} no permitido.` });
}

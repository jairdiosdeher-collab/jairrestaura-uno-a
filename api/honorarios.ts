/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — VERCEL SERVERLESS FUNCTION
 * Ruta: /api/honorarios (GET, POST, OPTIONS)
 * Soporta gestión contable y contractual de honorarios jurídicos con validación de pagos.
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
  return { honorarios: [], clientes: [], expedientes: [] };
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-organizacion-id');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const organizacionId = req.headers['x-organizacion-id'] || 'org-jairrestaura-001';
  const db = loadDB();

  // GET /api/honorarios
  if (req.method === 'GET') {
    const honorariosOrg = (db.honorarios || []).filter((h: any) => h.organizacionId === organizacionId);
    return res.status(200).json({ honorarios: honorariosOrg });
  }

  // POST /api/honorarios
  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

    // Sub-acción: Registrar abono o pago a honorario existente
    if (body.action === 'REGISTRAR_PAGO' || body.honorarioId) {
      const hId = body.honorarioId || body.id;
      const honorario = (db.honorarios || []).find((h: any) => h.id === hId && h.organizacionId === organizacionId);
      if (!honorario) {
        return res.status(404).json({ error: 'Registro de honorarios no encontrado en la firma.' });
      }

      const { montoCOP, medioPago, numeroComprobante, verificadoPorContabilidad } = body;
      if (!montoCOP || Number(montoCOP) <= 0) {
        return res.status(400).json({
          error: 'El monto del abono debe ser un valor mayor a cero.',
          codigo: 'INVALID_PAYMENT_AMOUNT',
        });
      }

      const nuevoPago = {
        id: `pag-${Date.now()}`,
        fechaPago: body.fechaPago || new Date().toISOString().split('T')[0],
        montoCOP: Number(montoCOP),
        medioPago: medioPago || 'TRANSFERENCIA_BANCARIA',
        numeroComprobante: numeroComprobante || `TRANS-${Date.now().toString().slice(-6)}`,
        verificadoPorContabilidad: !!verificadoPorContabilidad,
        registradoPor: 'Dr. Jair',
      };

      if (!honorario.pagosRegistrados) honorario.pagosRegistrados = [];
      honorario.pagosRegistrados.push(nuevoPago);
      honorario.valorPagadoCOP = (Number(honorario.valorPagadoCOP) || 0) + nuevoPago.montoCOP;
      honorario.saldoPendienteCOP = Math.max(0, (Number(honorario.valorAcordadoCOP) || 0) - honorario.valorPagadoCOP);
      honorario.estado = honorario.saldoPendienteCOP === 0 ? 'PAGADO_TOTAL' : 'PARCIAL';

      saveDB(db);
      return res.status(201).json({ honorario, pago: nuevoPago });
    }

    // Creación de nuevo acuerdo de honorarios
    if (!body.clienteId || !body.concepto || !body.valorAcordadoCOP) {
      return res.status(400).json({
        error: 'Cliente, concepto y valor acordado son campos obligatorios.',
        codigo: 'MISSING_REQUIRED_FIELDS',
      });
    }

    const valorAcordado = Number(body.valorAcordadoCOP);
    if (isNaN(valorAcordado) || valorAcordado <= 0) {
      return res.status(400).json({
        error: 'El valor acordado en COP debe ser un número positivo.',
        codigo: 'INVALID_FEE_AMOUNT',
      });
    }

    const nuevoHonorario = {
      ...body,
      id: `hon-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      valorAcordadoCOP: valorAcordado,
      valorPagadoCOP: 0,
      saldoPendienteCOP: valorAcordado,
      estado: 'PENDIENTE',
      fechaAcuerdo: body.fechaAcuerdo || new Date().toISOString().split('T')[0],
      pagosRegistrados: [],
      gastosProcesales: [],
      organizacionId,
    };

    if (!db.honorarios) db.honorarios = [];
    db.honorarios.unshift(nuevoHonorario);
    saveDB(db);

    return res.status(201).json({ honorario: nuevoHonorario });
  }

  return res.status(405).json({ error: `Método ${req.method} no permitido.` });
}

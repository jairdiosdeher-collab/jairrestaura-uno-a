/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — VERCEL SERVERLESS FUNCTION
 * Ruta: POST /api/orientador/generar-borrador
 * Generación de borradores pedagógicos ciudadanos (Derecho de Petición Art. 23 CP, Reclamación al Consumidor Ley 1480, etc.)
 */

import { generarBorradorCiudadano } from '../../src/utils/orientadorCiudadanoData.ts';
import type { 
  TipoBorradorCiudadano, 
  ProblemaCiudadanoEntrada 
} from '../../src/types/legal.ts';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Método no permitido. Utilice POST.',
      codigo: 'METHOD_NOT_ALLOWED'
    });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'Cuerpo de solicitud JSON inválido.' });
    }
  }

  const { tipo, entrada, datosEspecificos } = body || {};
  const tipoBorrador: TipoBorradorCiudadano = tipo || 'DERECHO_PETICION_ART23';

  const problemaEntrada: ProblemaCiudadanoEntrada = entrada || {
    descripcionProblema: body?.descripcionProblema || 'Solicitud ciudadana general',
    ciudad: body?.ciudad,
    resultadoEsperado: body?.resultadoEsperado
  };

  const borrador = generarBorradorCiudadano(tipoBorrador, problemaEntrada, datosEspecificos);
  return res.status(201).json({ borrador });
}

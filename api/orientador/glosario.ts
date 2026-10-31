/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — VERCEL SERVERLESS FUNCTION
 * Ruta: GET /api/orientador/glosario
 * Retorna el catálogo pedagógico del glosario jurídico ciudadano con advertencias de casos hipotéticos.
 */

import { GLOSARIO_CIUDADANO } from '../../src/utils/orientadorCiudadanoData.ts';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.status(200).json({
    total: GLOSARIO_CIUDADANO.length,
    glosario: GLOSARIO_CIUDADANO,
    procedencia: 'GLOSARIO_OFICIAL_PEDAGOGICO_COLOMBIA',
    advertenciaEjemplos: 'Todos los ejemplos contenidos en el glosario tienen naturaleza pedagógica hipotética e ilustrativa (Art. 230 CP).'
  });
}

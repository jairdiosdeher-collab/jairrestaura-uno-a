/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — VERCEL SERVERLESS FUNCTION
 * Ruta: GET /api/health
 */

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.status(200).json({
    status: 'ONLINE',
    app: 'JAIRRESTAURA UNO A',
    plataforma: 'Vercel Serverless',
    timestamp: new Date().toISOString(),
    servicios: {
      orientadorCiudadano: 'OPERATIVO',
      escuelaJuridica: 'OPERATIVO',
      geminiAI: process.env.GEMINI_API_KEY ? 'CONFIGURADO' : 'MODO_HEURISTICO'
    }
  });
}

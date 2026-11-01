/**
 * JAIRRESTAURA UNO A — Análisis estructurado de hechos.
 * Ruta: POST /api/ai/analyze-facts
 *
 * Devuelve únicamente un análisis preliminar. No acredita hechos ni reemplaza
 * la revisión profesional de pruebas y fuentes jurídicas.
 */
import { GoogleGenAI } from '@google/genai';

function parseBody(body: unknown): Record<string, any> | null {
  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return body && typeof body === 'object' && !Array.isArray(body)
    ? body as Record<string, any>
    : null;
}

function extractJson(text: string): any {
  const cleaned = text.trim().replace(/^\`\`\`(?:json)?\s*/i, '').replace(/\s*\`\`\`$/, '');
  return JSON.parse(cleaned);
}

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Método no permitido. Utilice POST.', codigo: 'METHOD_NOT_ALLOWED' });
  }

  const body = parseBody(req.body);
  if (!body) return res.status(400).json({ error: 'La solicitud debe contener JSON válido.', codigo: 'INVALID_JSON_BODY' });

  const hechos = typeof body.hechos === 'string' ? body.hechos.trim() : '';
  if (hechos.length < 10) {
    return res.status(400).json({ error: 'Ingrese una relación de hechos de al menos 10 caracteres.', codigo: 'FACTS_REQUIRED' });
  }
  if (hechos.length > 15000) {
    return res.status(413).json({ error: 'El relato es demasiado extenso. Redúzcalo e inténtelo de nuevo.', codigo: 'FACTS_TOO_LONG' });
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return res.status(503).json({
      error: 'El análisis con IA no está configurado en el servidor. Revise GEMINI_API_KEY en Vercel.',
      codigo: 'AI_NOT_CONFIGURED'
    });
  }

  const area = typeof body.areaJuridica === 'string' ? body.areaJuridica.slice(0, 80) : 'No especificada';
  const partes = body.partes && typeof body.partes === 'object' ? JSON.stringify(body.partes).slice(0, 3000) : 'No especificadas';

  const prompt = `Analiza preliminarmente el siguiente relato para apoyar el trabajo jurídico en Colombia.
No inventes hechos, documentos, pruebas, normas, citas ni fechas. Un relato no equivale a un hecho probado. No afirmes que revisaste pruebas que no fueron aportadas. Si falta información, escribe "Pendiente de confirmar". No emitas un concepto definitivo ni calcules vencimientos sin los datos completos y verificación normativa.
Área jurídica indicada: ${area}
Partes descritas (información no verificada): ${partes}
Relato:
${hechos}

Responde SOLO con un objeto JSON válido, sin Markdown, con esta estructura exacta:
{
  "resumenEjecutivo": "string",
  "problemasJuridicos": ["string"],
  "clasificacionHechos": {
    "acreditados": ["string: si no hay soportes, indicar que no hay hechos acreditados documentalmente"],
    "afirmacionesSinProbar": ["string"],
    "inferenciasJuridicas": ["string"],
    "datosFaltantes": ["string"]
  },
  "posiblesViasJuridicas": [
    {
      "via": "string",
      "caducidadOPrescripcion": "Pendiente de confirmar si faltan datos",
      "autoridadCompetente": "string",
      "pros": ["string"],
      "contrasYRiesgos": ["string"]
    }
  ],
  "preguntasClaveParaElCliente": ["string"],
  "checklistProbatorio": ["string"],
  "advertencia": "Análisis preliminar; requiere contraste con documentos y fuentes oficiales."
}
Mantén las listas concisas y señala expresamente cualquier dato que no se pueda verificar.`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    const raw = result.text?.trim();
    if (!raw) return res.status(502).json({ error: 'El proveedor de IA no devolvió un análisis utilizable.', codigo: 'EMPTY_AI_RESPONSE' });

    let analisis: any;
    try {
      analisis = extractJson(raw);
    } catch {
      return res.status(502).json({ error: 'La respuesta de IA no tuvo formato JSON válido. Inténtelo nuevamente.', codigo: 'INVALID_AI_JSON' });
    }
    if (!analisis || typeof analisis !== 'object' || typeof analisis.resumenEjecutivo !== 'string' || !analisis.clasificacionHechos) {
      return res.status(502).json({ error: 'La respuesta de IA no contiene la estructura de análisis esperada.', codigo: 'INVALID_AI_SCHEMA' });
    }
    return res.status(200).json({ analisis, origen: 'GEMINI_AI_FACTS' });
  } catch {
    return res.status(502).json({
      error: 'No fue posible ejecutar el análisis con IA. Verifique la configuración del servidor e inténtelo nuevamente.',
      codigo: 'AI_PROVIDER_ERROR'
    });
  }
}

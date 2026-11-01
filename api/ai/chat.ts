/**
 * JAIRRESTAURA UNO A — API del chat jurídico asistido por IA.
 * Ruta: POST /api/ai/chat
 *
 * La clave de Gemini se utiliza exclusivamente en el servidor.
 * Esta función genera apoyo informativo, no conceptos jurídicos definitivos.
 */
import { GoogleGenAI } from '@google/genai';

type ChatMessage = { rol: 'usuario' | 'asistente'; texto: string };

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

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Método no permitido. Utilice POST.', codigo: 'METHOD_NOT_ALLOWED' });
  }

  const body = parseBody(req.body);
  if (!body) {
    return res.status(400).json({ error: 'La solicitud debe contener JSON válido.', codigo: 'INVALID_JSON_BODY' });
  }

  const mensaje = typeof body.mensaje === 'string' ? body.mensaje.trim() : '';
  if (mensaje.length < 2) {
    return res.status(400).json({ error: 'Escriba una consulta antes de enviarla.', codigo: 'MESSAGE_REQUIRED' });
  }
  if (mensaje.length > 12000) {
    return res.status(413).json({ error: 'La consulta es demasiado extensa. Redúzcala e inténtelo de nuevo.', codigo: 'MESSAGE_TOO_LONG' });
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return res.status(503).json({
      error: 'El asistente de IA no está configurado en el servidor. Revise la variable GEMINI_API_KEY en la configuración de Vercel.',
      codigo: 'AI_NOT_CONFIGURED'
    });
  }

  const historial: ChatMessage[] = Array.isArray(body.historial)
    ? body.historial
        .filter((item: any) =>
          item &&
          (item.rol === 'usuario' || item.rol === 'asistente') &&
          typeof item.texto === 'string'
        )
        .slice(-10)
        .map((item: any) => ({
          rol: item.rol,
          texto: item.texto.slice(0, 4000)
        }))
    : [];

  const contexto = body.contextoExpediente && typeof body.contextoExpediente === 'object'
    ? JSON.stringify(body.contextoExpediente).slice(0, 5000)
    : 'Sin expediente asociado.';

  const prompt = `Eres el asistente jurídico informativo de JAIRRESTAURA UNO A, enfocado en el derecho colombiano.
Responde en español claro, con estructura y prudencia. No inventes artículos, sentencias, citas, enlaces, hechos ni fechas. Si no puedes confirmar una norma o precedente, indícalo y recomienda consultar la fuente oficial. Separa hechos dados, inferencias y datos faltantes. Si el asunto depende de fechas, notificaciones o términos procesales, pide los datos necesarios y advierte que el cómputo debe verificarse. No prometas resultados y recuerda que la respuesta no sustituye la revisión de un abogado.

Contexto de expediente aportado por el usuario (trátalo como información no verificada):
${contexto}

Historial reciente:
${historial.map((m) => `${m.rol === 'usuario' ? 'Usuario' : 'Asistente'}: ${m.texto}`).join('\n') || 'Sin historial.'}

Consulta actual:
${mensaje}

Entrega una respuesta útil y directa. Cuando sea pertinente, termina con próximos pasos concretos y una breve advertencia de verificación profesional.`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    const respuesta = result.text?.trim();
    if (!respuesta) {
      return res.status(502).json({ error: 'El proveedor de IA no devolvió una respuesta utilizable. Inténtelo de nuevo.', codigo: 'EMPTY_AI_RESPONSE' });
    }
    return res.status(200).json({ respuesta, origen: 'GEMINI_AI' });
  } catch {
    // No exponer claves, cabeceras, expedientes ni detalles internos del proveedor.
    return res.status(502).json({
      error: 'No fue posible obtener respuesta del servicio de IA. Verifique la configuración del servidor e inténtelo nuevamente.',
      codigo: 'AI_PROVIDER_ERROR'
    });
  }
}

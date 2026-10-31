/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — VERCEL SERVERLESS FUNCTION
 * Ruta: POST /api/orientador/orientar
 * Orientador Jurídico Ciudadano IA con Google Gemini API y motor heurístico colombiano de respaldo.
 */

import { GoogleGenAI } from '@google/genai';
import { 
  detectarUrgenciasCiudadanas, 
  motorHeuristicoOrientacionCiudadana 
} from '../../src/utils/orientadorCiudadanoData.ts';
import { CORPUS_JURIDICO_COLOMBIA } from '../../src/utils/colombianLegalCorpus.ts';
import type { 
  ProblemaCiudadanoEntrada, 
  ResultadoOrientacionCiudadana 
} from '../../src/types/legal.ts';

export default async function handler(req: any, res: any) {
  // Configuración de cabeceras CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Método no permitido. Utilice POST para consultar al Orientador Jurídico.',
      codigo: 'METHOD_NOT_ALLOWED'
    });
  }

  // Parsear cuerpo de la petición si viene como texto
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({
        error: 'El cuerpo de la solicitud no contiene un formato JSON válido.',
        codigo: 'INVALID_JSON_BODY'
      });
    }
  }

  const {
    descripcionProblema,
    ciudad,
    fechaAproximada,
    notificacionRecibida,
    detalleNotificacion,
    fechaNotificacion,
    fechaLimite,
    resultadoEsperado,
    documentosDisponibles
  } = body || {};

  // Validación de entrada
  if (!descripcionProblema || typeof descripcionProblema !== 'string' || descripcionProblema.trim().length < 10) {
    return res.status(400).json({
      error: 'Por favor describe tu situación jurídica con al menos 10 caracteres para poder brindarte una orientación adecuada.',
      codigo: 'DESCRIPCION_INSUFICIENTE'
    });
  }

  const entrada: ProblemaCiudadanoEntrada = {
    descripcionProblema: descripcionProblema.trim(),
    ciudad: ciudad ? String(ciudad).trim() : undefined,
    fechaAproximada: fechaAproximada ? String(fechaAproximada).trim() : undefined,
    notificacionRecibida: !!notificacionRecibida,
    detalleNotificacion: detalleNotificacion ? String(detalleNotificacion).trim() : undefined,
    fechaNotificacion: fechaNotificacion ? String(fechaNotificacion).trim() : undefined,
    fechaLimite: fechaLimite ? String(fechaLimite).trim() : undefined,
    resultadoEsperado: resultadoEsperado ? String(resultadoEsperado).trim() : undefined,
    documentosDisponibles: Array.isArray(documentosDisponibles) ? documentosDisponibles : []
  };

  // 1. Detección inmediata de urgencias procesales y términos perentorios
  const urgenciaHeuristica = detectarUrgenciasCiudadanas(entrada);

  // 2. Invocar Google Gemini API desde el servidor si la clave existe
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey.trim() !== '' && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const aiClient = new GoogleGenAI({
        apiKey: apiKey.trim(),
        httpOptions: {
          headers: {
            'User-Agent': 'jairrestaura-uno-a-orientador',
          },
        },
      });

      const prompt = `Actúa como orientador jurídico senior y defensor público en el ordenamiento jurídico de Colombia.
Un ciudadano formula la siguiente consulta en lenguaje corriente:
"${entrada.descripcionProblema}"
Ciudad/Municipio: ${entrada.ciudad || 'No especificada'}
¿Recibió notificación u orden oficial?: ${entrada.notificacionRecibida ? 'SÍ: ' + (entrada.detalleNotificacion || '') : 'NO'}
Fecha de notificación: ${entrada.fechaNotificacion || 'No especificada'}
Fecha límite / plazo: ${entrada.fechaLimite || 'No especificada'}
Resultado que espera o necesita: ${entrada.resultadoEsperado || 'Orientación general'}
Documentos con que cuenta: ${entrada.documentosDisponibles?.join(', ') || 'Ninguno especificado'}

DIRECTRICES OBLIGATORIAS DE RIGOR JURÍDICO COLOMBIANO:
1. Explica todo en lenguaje comprensible para un ciudadano sin formación jurídica, pero con riguroso apego al derecho procesal colombiano (CGP Ley 1564/12, Ley 820/03, Ley 2213/22, Ley 2220/22, Ley 2113/21).
2. EN ARRENDAMIENTO DE INMUEBLE:
   - En demanda de restitución por falta de pago del canon, la regla de limitación probatoria por no pago está en el ARTÍCULO 384 NUMERAL 3 DEL CGP (el demandado NO será oído hasta que demuestre el pago o consigne los cánones adeudados).
   - La conciliación prejudicial extrajudicial NO es obligatoria si en la demanda se solicitan medidas cautelares de embargo o entrega provisional (Art. 68 Ley 2220 de 2022 y Art. 590 parágrafo 1 del CGP).
   - El Certificado de Tradición y Libertad es un documento complementario no obligatorio para demandar la tenencia por arrendamiento (Art. 84 y 384 CGP).
   - Si el contrato incluyó renuncia a requerimientos para constituir en mora (Art. 2007 Código Civil), no se exige carta postal certificada previa para demandar por mora.
3. PROTECCIÓN CONTRA DATOS ASUMIDOS O INVENTADOS:
   - Nunca asumas ciudad, fechas, montos ni la existencia de un contrato escrito si el ciudadano no los suministró.
   - En cualquier dato faltante o no comprobado, debes colocar explícitamente: «Pendiente de confirmar».
4. TRANSPARENCIA PROBATORIA:
   - Separa nítidamente: hechosRelatados por el ciudadano, pruebasRevisadas formalmente, hechosNoComprobados («Pendiente de confirmar»), normasAplicables específicas, hipotesisYAlternativas procesales, y recomendacionProfesional.
5. Si detectas plazos perentorios en curso (ej. 5 días en ejecutivo Art. 442 CGP, 3 días en reposición Art. 318 CGP, 10 días en tutela Decreto 2591/91), genera una advertencia inmediata contundente.
6. Clasifica el nivel de autogestión:
   - 'AUTOGESTIONABLE' (Nivel 1: no requiere abogado, ej. petición, tutela, reclamación consumidor).
   - 'CONVIENE_ASESORIA' (Nivel 2: viable autogestión pero conviene asesoría previa o conciliación).
   - 'VERIFICAR_REQUISITO_ABOGADO' (Nivel 3: mínima cuantía <40 SMLMV se permite litigar en causa propia Art. 25, 26 num. 6 y 73 CGP).
   - 'ASISTENCIA_PROFESIONAL_PRIORITARIA' (Nivel 4: exige abogado con TP vigente por ley).
7. Pasos numerados con canal oficial real (.gov.co) y alternativas gratuitas (Consultorios Jurídicos Universitarios Ley 2113 de 2021, Personerías).

Responde ÚNICAMENTE en JSON con el formato:
{
  "resumenSituacion": {
    "loQueEntendemos": "string",
    "datosFaltantesPorConfirmar": ["string"],
    "hechosRelatados": ["string"],
    "pruebasRevisadas": ["string"],
    "hechosNoComprobados": ["string"],
    "normasAplicables": ["string"],
    "hipotesisYAlternativas": ["string"],
    "recomendacionProfesional": "string",
    "suposiciones": ["string"]
  },
  "categoriasIdentificadas": ["string"],
  "urgencia": {
    "esUrgente": true,
    "nivelUrgencia": "ALTA",
    "motivoUrgencia": "string",
    "plazoVerificar": "string",
    "advertenciaInmediata": "string",
    "accionesInmediatas": ["string"]
  },
  "opcionesLegales": [
    {
      "titulo": "string",
      "descripcion": "string",
      "consecuencias": "string",
      "pros": ["string"],
      "contras": ["string"]
    }
  ],
  "queHacerPrimero": {
    "accion": "string",
    "porQueEsImportante": "string",
    "plazoRecomendado": "string"
  },
  "procedimientoPasoAPaso": [
    {
      "orden": 1,
      "titulo": "string",
      "paraQueSirve": "string",
      "queHacer": "string",
      "documentosAReunir": ["string"],
      "anteQuien": "string",
      "canalOficial": "string",
      "enlaceCanalOficial": "string",
      "queEsperar": "string",
      "queHacerSiFalla": "string",
      "precauciones": ["string"]
    }
  ],
  "clasificacionAutogestion": {
    "nivel": "AUTOGESTIONABLE",
    "justificacion": "string",
    "advertenciaRepresentacion": "string"
  },
  "documentosRequeridos": [
    {
      "id": "string",
      "nombre": "string",
      "descripcion": "string",
      "comoObtenerlo": "string",
      "comoConservarlo": "string",
      "obligatorio": true
    }
  ],
  "dondeAcudir": [
    {
      "nombre": "string",
      "tipo": "ADMINISTRATIVA",
      "competencia": "string",
      "sedeOCanal": "string",
      "esGratuita": true,
      "enlaceOficial": "string"
    }
  ],
  "orientacionGratuitaDisponible": [
    {
      "entidad": "string",
      "descripcion": "string",
      "requisitos": "string",
      "canal": "string",
      "enlaceOficial": "string"
    }
  ],
  "queHacerDespues": ["string"],
  "proximoPasoInmediato": "string"
}`;

      const aiResponse = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(aiResponse.text || '{}');
      if (parsed.resumenSituacion && parsed.procedimientoPasoAPaso) {
        if (urgenciaHeuristica.esUrgente && !parsed.urgencia?.esUrgente) {
          parsed.urgencia = urgenciaHeuristica;
        }

        const resultado: ResultadoOrientacionCiudadana = {
          id: `orient-${Date.now()}`,
          fechaOrientacion: new Date().toISOString(),
          resumenSituacion: parsed.resumenSituacion,
          categoriasIdentificadas: parsed.categoriasIdentificadas || ['Derecho Ciudadano'],
          urgencia: parsed.urgencia || urgenciaHeuristica,
          opcionesLegales: parsed.opcionesLegales || [],
          queHacerPrimero: parsed.queHacerPrimero || {
            accion: 'Reunir pruebas documentales',
            porQueEsImportante: 'Para sustentar los hechos relatados',
            plazoRecomendado: 'Inmediatamente'
          },
          procedimientoPasoAPaso: parsed.procedimientoPasoAPaso || [],
          clasificacionAutogestion: parsed.clasificacionAutogestion || {
            nivel: 'CONVIENE_ASESORIA',
            justificacion: 'Se recomienda revisión previa con un asesor jurídico.',
            advertenciaRepresentacion: 'Verifique los requisitos del despacho judicial.'
          },
          documentosRequeridos: parsed.documentosRequeridos || [],
          dondeAcudir: parsed.dondeAcudir || [],
          orientacionGratuitaDisponible: parsed.orientacionGratuitaDisponible || [],
          queHacerDespues: parsed.queHacerDespues || [],
          proximoPasoInmediato: parsed.proximoPasoInmediato || parsed.queHacerPrimero?.accion || 'Reunir soportes documentales',
          fuentesOficiales: CORPUS_JURIDICO_COLOMBIA.slice(0, 4),
          avisoLegal: 'ADVERTENCIA OBLIGATORIA: Esta orientación jurídica inicial tiene propósitos exclusivamente informativos, pedagógicos y de divulgación ciudadana. NO constituye mandato judicial, no genera relación abogado-cliente y no sustituye el concepto profesional emitido por un abogado titulado con Tarjeta Profesional vigente tras la revisión personal del expediente y sus pruebas. En Colombia los términos procesales son improrrogables (Art. 117 CGP).'
        };

        return res.status(200).json({ orientacion: resultado, origen: 'GEMINI_AI_ORIENTADOR' });
      }
    } catch (err) {
      console.warn('[Vercel Serverless] Error en Gemini AI, activando motor heurístico colombiano:', err);
    }
  }

  // 3. Motor Heurístico de Contingencia Colombiano (100% determinístico y verificado)
  const orientacionHeuristica = motorHeuristicoOrientacionCiudadana(entrada);
  return res.status(200).json({
    orientacion: orientacionHeuristica,
    origen: 'MOTOR_HEURISTICO_COLOMBIANO',
    avisoDisponibilidad: !apiKey ? 'IA en modo heurístico normativo (GEMINI_API_KEY no configurada en Vercel)' : undefined
  });
}

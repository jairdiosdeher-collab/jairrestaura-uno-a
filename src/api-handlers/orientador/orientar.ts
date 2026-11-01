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
} from '../../utils/orientadorCiudadanoData.ts';
import { CORPUS_JURIDICO_COLOMBIA } from '../../utils/colombianLegalCorpus.ts';
import type { 
  ProblemaCiudadanoEntrada, 
  ResultadoOrientacionCiudadana 
} from '../../types/legal.ts';

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

  // 1A. Capa de seguridad prioritaria: la violencia física o las amenazas
  // nunca deben pasar primero por una clasificación civil genérica ni por Gemini.
  const relatoNormalizado = entrada.descripcionProblema
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const indicadoresViolencia = [
    /\b(le pega|la pega|le golpea|la golpea|golpea a|golpeo a|agrede|agredio|agresion fisica)\b/,
    /\b(violencia intrafamiliar|maltrato fisico|maltrata|amenaza de muerte|amenazas)\b/,
    /\b(la empuja|le empuja|la cachetea|le da golpes|la asfixia|abuso sexual)\b/,
    /\b(tiene miedo de su pareja|teme por su vida|no la deja salir|la controla y la amenaza)\b/
  ];
  const posibleViolencia = indicadoresViolencia.some((patron) => patron.test(relatoNormalizado));

  if (posibleViolencia) {
    const orientacionProteccion: ResultadoOrientacionCiudadana = {
      id: `orient-proteccion-${Date.now()}`,
      fechaOrientacion: new Date().toISOString(),
      resumenSituacion: {
        loQueEntendemos: 'El relato menciona posibles agresiones, amenazas o violencia en el entorno familiar o de pareja. La prioridad es la seguridad y el acceso a protección; no corresponde clasificar inicialmente el asunto como un conflicto civil ordinario.',
        datosFaltantesPorConfirmar: [
          'Si la persona afectada está en un lugar seguro en este momento.',
          'Si el presunto agresor está presente o puede acercarse.',
          'Municipio donde se encuentra la persona afectada.',
          'Si hay niñas, niños, adolescentes u otras personas dependientes expuestas a la situación.',
          'Si existen lesiones o se requiere atención médica.'
        ],
        hechosRelatados: [entrada.descripcionProblema],
        pruebasRevisadas: ['No se han recibido ni revisado documentos o pruebas en esta consulta automatizada.'],
        hechosNoComprobados: ['La aplicación no puede verificar por sí misma los hechos relatados ni determinar responsabilidades.'],
        normasAplicables: ['Ley 294 de 1996 y sus modificaciones sobre prevención y atención de la violencia intrafamiliar.', 'Ley 2126 de 2021 sobre las Comisarías de Familia.'],
        hipotesisYAlternativas: ['Posible violencia intrafamiliar o violencia basada en género; la autoridad competente debe valorar los hechos y el riesgo.'],
        recomendacionProfesional: 'Priorizar la seguridad, activar la ruta de atención y solicitar valoración de medidas de protección. Los asuntos de separación, divorcio, custodia y alimentos deben analizarse después o en paralelo, sin retrasar la protección.'
      },
      categoriasIdentificadas: ['FAMILIA', 'VIOLENCIA INTRAFAMILIAR', 'PROTECCIÓN DE DERECHOS'],
      urgencia: {
        esUrgente: true,
        nivelUrgencia: 'ALTA',
        motivoUrgencia: 'El relato contiene indicadores de posible violencia física o amenazas.',
        plazoVerificar: 'De inmediato si existe peligro actual; en los demás casos, contactar cuanto antes a una autoridad de protección.',
        advertenciaInmediata: 'Si hay peligro inmediato, la persona debe procurar llegar a un lugar seguro y llamar al 123. No debe confrontar al presunto agresor ni exponerse para conseguir pruebas.',
        accionesInmediatas: [
          'Si el peligro es actual, buscar un lugar seguro y llamar al 123.',
          'Si la persona afectada es una mujer, puede llamar a la Línea 155 para orientación sobre violencias basadas en género.',
          'Acudir a la Comisaría de Familia para solicitar orientación y valoración de medidas de protección.',
          'Si hay lesiones o afectación de salud, solicitar atención en un servicio de salud.',
          'Si se requiere poner hechos posiblemente delictivos en conocimiento de la Fiscalía, comunicarse con la línea 122 o acudir a sus canales oficiales.'
        ]
      },
      opcionesLegales: [
        {
          titulo: 'Solicitar medidas de protección ante la Comisaría de Familia',
          descripcion: 'La Comisaría puede valorar la situación y adoptar, cuando corresponda, medidas para proteger a la persona afectada y a integrantes del grupo familiar.',
          consecuencias: 'La autoridad valorará el riesgo y definirá las medidas procedentes según los hechos y la ley.',
          pros: ['La protección no debe condicionarse a que primero se tramite un divorcio.', 'Permite acudir a una autoridad especializada en asuntos de familia.'],
          contras: ['La medida concreta depende de la valoración de la autoridad y de las circunstancias del caso.']
        },
        {
          titulo: 'Poner los hechos en conocimiento de la Fiscalía',
          descripcion: 'Cuando los hechos puedan constituir delito, la Fiscalía puede recibir la información e iniciar las actuaciones que correspondan.',
          consecuencias: 'La Fiscalía determinará las actuaciones investigativas procedentes.',
          pros: ['Permite activar la ruta penal cuando corresponda.'],
          contras: ['La denuncia penal no sustituye por sí sola las medidas urgentes de protección familiar.']
        },
        {
          titulo: 'Tramitar por separado los asuntos de separación y familia',
          descripcion: 'La separación o el divorcio, y las decisiones sobre hijos, custodia, alimentos o vivienda, requieren orientación específica según la situación.',
          consecuencias: 'Estos asuntos pueden requerir trámites distintos y no deben retrasar la solicitud de protección.',
          pros: ['Permite abordar integralmente las consecuencias familiares.'],
          contras: ['La vía adecuada depende de si hay matrimonio, unión marital, hijos y acuerdos o desacuerdos.']
        }
      ],
      queHacerPrimero: {
        accion: 'Confirmar que la persona afectada está en un lugar seguro y activar la ruta de emergencia o protección que corresponda.',
        porQueEsImportante: 'La integridad y la seguridad tienen prioridad sobre cualquier trámite de separación o discusión patrimonial.',
        plazoRecomendado: 'Ahora mismo si existe peligro; de lo contrario, cuanto antes.'
      },
      procedimientoPasoAPaso: [
        {
          orden: 1,
          titulo: 'Priorizar la seguridad inmediata',
          paraQueSirve: 'Reducir la exposición a una posible nueva agresión.',
          queHacer: 'Si hay peligro actual, trasladarse a un lugar seguro si puede hacerlo sin aumentar el riesgo y llamar al 123. Evitar confrontar al presunto agresor.',
          documentosAReunir: [],
          anteQuien: 'Policía Nacional / línea de emergencias',
          canalOficial: 'Línea 123',
          enlaceCanalOficial: 'https://www.policia.gov.co/',
          queEsperar: 'Atención de emergencia según la disponibilidad y valoración de las autoridades.',
          queHacerSiFalla: 'Buscar apoyo presencial en un servicio de urgencias o autoridad local segura.',
          precauciones: ['No anunciar planes de salida si ello puede aumentar el peligro.', 'No regresar a un lugar inseguro para recoger documentos o pertenencias.']
        },
        {
          orden: 2,
          titulo: 'Solicitar orientación y medidas de protección',
          paraQueSirve: 'Obtener valoración institucional y conocer las medidas disponibles.',
          queHacer: 'Contactar a la Comisaría de Familia del municipio. Si es una mujer víctima de violencia, también puede llamar a la Línea 155.',
          documentosAReunir: ['Los documentos que tenga disponibles, solo si es seguro obtenerlos. No son condición para pedir orientación urgente.'],
          anteQuien: 'Comisaría de Familia; Línea 155 cuando corresponda.',
          canalOficial: 'Comisaría de Familia del municipio / Línea 155',
          enlaceCanalOficial: 'https://www.minjusticia.gov.co/',
          queEsperar: 'Orientación, valoración del riesgo y trámite de las medidas que legalmente procedan.',
          queHacerSiFalla: 'Acudir a la Personería municipal o solicitar orientación a la Defensoría del Pueblo.',
          precauciones: ['No esperar a reunir todas las pruebas para pedir ayuda.', 'No exponerse para grabar, fotografiar o conseguir evidencias.']
        },
        {
          orden: 3,
          titulo: 'Recibir atención en salud y reportar los hechos cuando corresponda',
          paraQueSirve: 'Atender afectaciones físicas o emocionales y activar la ruta institucional.',
          queHacer: 'Si hay lesiones o afectación de salud, acudir a un servicio de urgencias. Para informar posibles delitos, contactar a la Fiscalía por el 122.',
          documentosAReunir: ['Documentos médicos o constancias, si se generan y pueden conservarse sin riesgo.'],
          anteQuien: 'Servicio de salud / Fiscalía General de la Nación',
          canalOficial: 'Urgencias de salud / Línea 122',
          enlaceCanalOficial: 'https://www.fiscalia.gov.co/',
          queEsperar: 'Atención en salud y recepción de información por la autoridad competente.',
          queHacerSiFalla: 'Solicitar acompañamiento de Personería o Defensoría del Pueblo.',
          precauciones: ['La denuncia penal y la solicitud de medidas de protección son rutas distintas.', 'No retrasar la atención médica por falta de documentos.']
        }
      ],
      clasificacionAutogestion: {
        nivel: 'CONVIENE_ASESORIA',
        justificacion: 'La persona puede acudir directamente a las autoridades y pedir protección; por la posible existencia de violencia y consecuencias familiares, conviene acompañamiento especializado.',
        advertenciaRepresentacion: 'No se debe exigir abogado para pedir ayuda urgente o acudir a la Comisaría de Familia. La necesidad de apoderado en trámites posteriores depende del procedimiento concreto.'
      },
      documentosRequeridos: [],
      dondeAcudir: [
        { nombre: 'Comisaría de Familia', tipo: 'ADMINISTRATIVA', competencia: 'Valorar la situación familiar y tramitar medidas de protección conforme a sus competencias.', sedeOCanal: 'Comisaría del municipio donde se encuentre la persona afectada.', esGratuita: true, enlaceOficial: 'https://www.minjusticia.gov.co/' },
        { nombre: 'Policía Nacional', tipo: 'ADMINISTRATIVA', competencia: 'Atender emergencias y situaciones de peligro inmediato.', sedeOCanal: 'Línea 123.', esGratuita: true, enlaceOficial: 'https://www.policia.gov.co/' },
        { nombre: 'Fiscalía General de la Nación', tipo: 'JUDICIAL', competencia: 'Recibir información sobre hechos que puedan constituir delito.', sedeOCanal: 'Línea 122 y canales oficiales.', esGratuita: true, enlaceOficial: 'https://www.fiscalia.gov.co/' }
      ],
      orientacionGratuitaDisponible: [
        { entidad: 'Línea 155', descripcion: 'Orientación a mujeres víctimas de violencia.', requisitos: 'No se debe retrasar la búsqueda de ayuda por falta de documentos.', canal: 'Llamada a la línea 155.', enlaceOficial: 'https://www.policia.gov.co/' },
        { entidad: 'Personería municipal o Defensoría del Pueblo', descripcion: 'Orientación y acompañamiento para acceder a las rutas de protección.', requisitos: 'Consultar disponibilidad local.', canal: 'Atención presencial o canales institucionales.', enlaceOficial: 'https://www.defensoria.gov.co/' }
      ],
      queHacerDespues: [
        'Cuando exista seguridad, solicitar orientación jurídica sobre separación o divorcio, custodia, alimentos y vivienda, según corresponda.',
        'Conservar de forma segura cualquier documento o constancia que ya tenga; no arriesgarse para obtener nuevas pruebas.',
        'Pedir apoyo de una persona de confianza o de un servicio institucional.'
      ],
      proximoPasoInmediato: '¿La persona afectada está en un lugar seguro ahora mismo?'
      ,
      fuentesOficiales: CORPUS_JURIDICO_COLOMBIA.slice(0, 4),
      avisoLegal: 'Orientación inicial automatizada de carácter informativo. No sustituye la valoración individual de las autoridades ni la asesoría jurídica profesional. Ante peligro inmediato, llamar al 123.'
    };
    return res.status(200).json({ orientacion: orientacionProteccion, origen: 'CAPA_SEGURIDAD_PRIORITARIA' });
  }

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

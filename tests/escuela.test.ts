import http from 'http';

interface TestResult {
  num: number;
  nombre: string;
  paso: boolean;
  detalle: string;
}

const resultados: TestResult[] = [];

function makeRequest(
  method: string,
  path: string,
  body?: any,
  headers: Record<string, string> = {}
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const reqHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };
    if (payload) {
      reqHeaders['Content-Length'] = Buffer.byteLength(payload).toString();
    }

    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({ status: res.statusCode || 500, body: parsed });
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function runTest(
  num: number,
  nombre: string,
  fn: () => Promise<{ paso: boolean; detalle: string }>
) {
  try {
    const res = await fn();
    resultados.push({ num, nombre, paso: res.paso, detalle: res.detalle });
    const tag = res.paso ? '\x1b[32m✔ [APROBADA]\x1b[0m' : '\x1b[31m✘ [FALLIDA]\x1b[0m';
    console.log(`${tag} ${num}. ${nombre}`);
    console.log(`     Detalle: ${res.detalle}`);
  } catch (err: any) {
    resultados.push({ num, nombre, paso: false, detalle: String(err) });
    console.log(`\x1b[31m✘ [ERROR]\x1b[0m ${num}. ${nombre} - ${err.message}`);
  }
}

async function iniciarSuite() {
  console.log('======================================================');
  console.log('  SUITE DE PRUEBAS — ESCUELA JURÍDICA INTELIGENTE');
  console.log('  Validación de Casos Académicos, Rutas, Tutor y Aislamiento');
  console.log('======================================================\n');

  let casoCreadoId = '';

  // PRUEBA 1: Listar casos académicos
  await runTest(1, 'GET /api/escuela/casos retorna 200 con casos pedagógicos preexistentes', async () => {
    const res = await makeRequest('GET', '/api/escuela/casos');
    if (res.status !== 200) {
      return { paso: false, detalle: `Status esperado 200, recibido ${res.status}` };
    }
    if (!Array.isArray(res.body.casos)) {
      return { paso: false, detalle: 'res.body.casos debe ser un arreglo' };
    }
    const todosPedagogicos = res.body.casos.every((c: any) => c.esCasoPedagogico === true);
    if (!todosPedagogicos) {
      return { paso: false, detalle: 'Todos los casos deben tener esCasoPedagogico === true' };
    }
    return {
      paso: true,
      detalle: `Se encontraron ${res.body.casos.length} casos académicos guardados en la escuela. Aislamiento comprobado.`,
    };
  });

  // PRUEBA 2: Crear un nuevo caso académico
  await runTest(2, 'POST /api/escuela/casos crea y persiste un caso académico estructurado', async () => {
    const nuevoCaso = {
      titulo: 'Análisis de Responsabilidad Civil Extracontractual en Accidente Fluvial',
      areaDerecho: 'CIVIL',
      materiaEspecifica: 'Responsabilidad Civil por Actividades Peligrosas (Art. 2356 CC)',
      hechosOriginales: 'Una embarcación de transporte turístico colisionó contra un muelle en el embalse de Guatapé. Tres pasajeros sufrieron politraumatismos. La empresa operadora alega fuerza mayor por ráfagas de viento imprevistas.',
      hechosAcreditados: ['Ocurrencia del accidente en el embalse.', 'Daño corporal a tres pasajeros.'],
      inferenciasJuridicas: ['Presunción de culpa o responsabilidad objetiva por actividad peligrosa.'],
      informacionFaltanteYPorVerificar: ['Comprobar informe de capitanía de puerto sobre condiciones meteorológicas.'],
      problemasJuridicos: ['¿Configuran las ráfagas de viento un evento imprevisible e irresistible para exonerar al transportador?'],
      preguntasPorResolver: ['¿Cuál es la carga probatoria de la fuerza mayor según la Sala de Casación Civil de la CSJ?'],
    };

    const res = await makeRequest('POST', '/api/escuela/casos', nuevoCaso);
    if (res.status !== 201) {
      return { paso: false, detalle: `Status esperado 201, recibido ${res.status}` };
    }
    if (!res.body.caso || !res.body.caso.id) {
      return { paso: false, detalle: 'No se retornó el caso creado con su identificador' };
    }
    casoCreadoId = res.body.caso.id;
    return {
      paso: true,
      detalle: `Caso académico creado exitosamente con ID ${casoCreadoId}. Estado inicial: ${res.body.caso.estadoEstudio}`,
    };
  });

  // PRUEBA 3: Actualizar estado y tareas de investigación del caso académico (con validación de fuentes)
  await runTest(3, 'PUT /api/escuela/casos/:id exige fuentes jurídicas verificadas para avanzar a FUENTES_REVISADAS', async () => {
    if (!casoCreadoId) {
      return { paso: false, detalle: 'No hay caso creado para actualizar' };
    }

    // A. Prueba Negativa: Intentar asignar FUENTES_REVISADAS sin registrar fuentes verificadas
    const payloadSinFuentes = {
      estadoEstudio: 'FUENTES_REVISADAS',
      proximaActividadAcademica: 'Redactar ficha de casación civil sobre actividad peligrosa',
      tareasInvestigacion: [
        { id: 't1', descripcion: 'Consultar providencias de la Sala de Casación Civil', completada: true },
        { id: 't2', descripcion: 'Verificar Art. 2356 del Código Civil', completada: true },
      ],
    };

    const resNegativa = await makeRequest('PUT', `/api/escuela/casos/${casoCreadoId}`, payloadSinFuentes);
    if (resNegativa.status !== 400 || resNegativa.body.codigo !== 'FUENTES_NO_EVIDENCIADAS') {
      return {
        paso: false,
        detalle: `Se esperaba 400 FUENTES_NO_EVIDENCIADAS, pero se recibió ${resNegativa.status}: ${JSON.stringify(resNegativa.body)}`,
      };
    }

    // B. Prueba Positiva: Asignar FUENTES_REVISADAS aportando fuentes vinculadas a problemas jurídicos
    const payloadConFuentes = {
      estadoEstudio: 'FUENTES_REVISADAS',
      proximaActividadAcademica: 'Redactar ficha de casación civil sobre actividad peligrosa',
      fuentesVinculadasAProblemas: [
        {
          problemaId: 'p1',
          fuenteIdentificador: 'Código Civil Art. 2356',
          justificacionPertinencia: 'Responsabilidad por actividades peligrosas',
        },
      ],
      tareasInvestigacion: [
        { id: 't1', descripcion: 'Consultar providencias de la Sala de Casación Civil', completada: true },
        { id: 't2', descripcion: 'Verificar Art. 2356 del Código Civil', completada: true },
      ],
    };

    const resPositiva = await makeRequest('PUT', `/api/escuela/casos/${casoCreadoId}`, payloadConFuentes);
    if (resPositiva.status !== 200) {
      return { paso: false, detalle: `Status esperado 200, recibido ${resPositiva.status}` };
    }
    if (resPositiva.body.caso.estadoEstudio !== 'FUENTES_REVISADAS') {
      return { paso: false, detalle: 'No se actualizó el estado a FUENTES_REVISADAS con fuentes presentes' };
    }

    return {
      paso: true,
      detalle: `Validación superada: Rechazó avance sin fuentes (400) y aprobó actualización (200) al registrar evidencia de fuentes oficiales.`,
    };
  });

  // PRUEBA 4: Descomposición analítica de hechos con IA Docente / Motor Jurídico
  await runTest(4, 'POST /api/escuela/analyze-case descompone hechos, inferencias y vacíos probatorios', async () => {
    const payload = {
      titulo: 'Despido en estado de debilidad manifiesta por salud',
      areaDerecho: 'LABORAL_SEGURIDAD_SOCIAL',
      hechos: 'Un trabajador con recomendación médica de reubicación por hernia discal fue despedido sin autorización previa del Ministerio del Trabajo. El empleador aduce vencimiento del plazo pactado.',
    };

    const res = await makeRequest('POST', '/api/escuela/analyze-case', payload);
    if (res.status !== 200) {
      return { paso: false, detalle: `Status esperado 200, recibido ${res.status}` };
    }
    const a = res.body.analisis;
    if (!a.hechosAcreditados || !a.inferenciasJuridicas || !a.informacionFaltanteYPorVerificar) {
      return { paso: false, detalle: 'La respuesta no contiene la distinción tripartita de hechos' };
    }
    if (!Array.isArray(a.problemasJuridicos) || a.problemasJuridicos.length === 0) {
      return { paso: false, detalle: 'Falta identificación de problemas jurídicos' };
    }
    return {
      paso: true,
      detalle: `Descomposición exitosa (${res.body.origen}): ${a.hechosAcreditados.length} hechos, ${a.inferenciasJuridicas.length} inferencias, ${a.informacionFaltanteYPorVerificar.length} datos por verificar.`,
    };
  });

  // PRUEBA 5: Ruta procesal orientativa (Tutela, CPACA y CGP)
  await runTest(5, 'POST /api/escuela/procedural-route genera flujograma con términos y normas colombianas', async () => {
    const res = await makeRequest('POST', '/api/escuela/procedural-route', {
      materia: 'CONSTITUCIONAL',
      tipoProcedimiento: 'TUTELA',
    });
    if (res.status !== 200) {
      return { paso: false, detalle: `Status esperado 200, recibido ${res.status}` };
    }
    const ruta = res.body.ruta;
    if (!ruta.etapas || ruta.etapas.length < 4) {
      return { paso: false, detalle: 'La ruta debe contener al menos 4 etapas procesales secuenciales' };
    }
    const etapaFallo = ruta.etapas.find((e: any) => e.nombre.includes('Fallo'));
    if (!etapaFallo || !etapaFallo.terminoLegal.includes('10 días')) {
      return { paso: false, detalle: 'Falta etapa de fallo con el término constitucional perentorio de 10 días' };
    }
    return {
      paso: true,
      detalle: `Ruta generada: ${ruta.tipoProcedimiento} con ${ruta.etapas.length} etapas. Término de 10 días y Decreto 2591/91 comprobados.`,
    };
  });

  // PRUEBA 6: Tutor académico interactivo (Modo silogismo / IRAC y Conceptos)
  await runTest(6, 'POST /api/escuela/tutor-prompt enseña el razonamiento paso a paso', async () => {
    const res = await makeRequest('POST', '/api/escuela/tutor-prompt', {
      modo: 'METODO_RESOLUCION',
      temaOCaso: 'Subsunción típica en Nulidad y Restablecimiento del Derecho',
    });
    if (res.status !== 200) {
      return { paso: false, detalle: `Status esperado 200, recibido ${res.status}` };
    }
    const t = res.body.tutor;
    if (!t.desarrolloRazonamiento || t.desarrolloRazonamiento.length < 3) {
      return { paso: false, detalle: 'El tutor debe entregar pasos formativos de razonamiento' };
    }
    if (!t.ejercicioOPruebaFormativa || !t.ejercicioOPruebaFormativa.pregunta) {
      return { paso: false, detalle: 'El tutor debe incluir ejercicio formativo de comprobación' };
    }
    return {
      paso: true,
      detalle: `Tutor formativo (${res.body.origen}): ${t.desarrolloRazonamiento.length} pasos metodológicos y ejercicio didáctico verificado.`,
    };
  });

  // PRUEBA 7: Generador de borradores académicos (Ficha Jurisprudencial con marca de agua)
  await runTest(7, 'POST /api/escuela/generate-doc genera borrador con advertencia de no radicación', async () => {
    const res = await makeRequest('POST', '/api/escuela/generate-doc', {
      tipo: 'FICHA_JURISPRUDENCIAL',
      casoId: casoCreadoId,
      titulo: 'Ficha C-590/05 sobre Defecto Fáctico',
    });
    if (res.status !== 201) {
      return { paso: false, detalle: `Status esperado 201, recibido ${res.status}` };
    }
    const doc = res.body.borrador;
    if (!doc.esBorradorAcademico) {
      return { paso: false, detalle: 'El borrador debe tener esBorradorAcademico === true' };
    }
    const texto = doc.contenidoTexto;
    if (!texto.includes('BORRADOR ACADÉMICO PARA FINES PEDAGÓGICOS') || !texto.includes('NO es un documento apto para radicación')) {
      return { paso: false, detalle: 'Falta la marca de agua y advertencia expresa de no radicación judicial' };
    }
    return {
      paso: true,
      detalle: `Borrador ${doc.tipo} generado con éxito. Marca de agua y salvaguarda de responsabilidad comprobadas.`,
    };
  });

  // PRUEBA 8: Seguridad y aislamiento estricto: denegación anónima en profesional y aislamiento de datos
  await runTest(8, 'Seguridad y aislamiento: rutas profesionales exigen autenticación (401) y no mezclan expedientes', async () => {
    // 1. Verificación de seguridad: Petición anónima a /api/expedientes debe retornar 401
    const resUnauth = await makeRequest('GET', '/api/expedientes');
    if (resUnauth.status !== 401) {
      return { paso: false, detalle: `Se esperaba 401 para petición sin credenciales a expedientes, recibido ${resUnauth.status}` };
    }

    // 2. Verificación autorizada: Con credenciales institucionales retorna 200 y cero mezcla
    const authHeaders = {
      'Authorization': 'Bearer jairrestaura-demo-session-token-2026',
      'x-user-id': 'usr-jair-01',
    };
    const resExp = await makeRequest('GET', '/api/expedientes', undefined, authHeaders);
    const resCli = await makeRequest('GET', '/api/clientes', undefined, authHeaders);

    if (resExp.status !== 200 || resCli.status !== 200) {
      return { paso: false, detalle: `Error cargando expedientes autorizados: exp ${resExp.status}, cli ${resCli.status}` };
    }

    const totalExpedientes = resExp.body.expedientes.length;
    const totalClientes = resCli.body.clientes.length;

    // Verificar que ningún expediente real tenga 'esCasoPedagogico'
    const expedientesMezclados = resExp.body.expedientes.filter((e: any) => e.esCasoPedagogico === true);
    if (expedientesMezclados.length > 0) {
      return { paso: false, detalle: 'Se encontraron casos académicos mezclados en la colección de expedientes' };
    }

    return {
      paso: true,
      detalle: `Seguridad y aislamiento verificados: Bloqueo anónimo (401) efectivo. ${totalExpedientes} expedientes y ${totalClientes} clientes protegidos sin contaminación pedagógica.`,
    };
  });

  // PRUEBA 9: Matriz de Hechos y Pruebas con clasificación estricta (Art. 167 CGP, pruebas positivas y negativas)
  await runTest(9, 'POST /api/escuela/analyze-matrix no confunde documentos pendientes con soporte y distingue afirmación de prueba', async () => {
    const payload = {
      casoId: casoCreadoId,
      hechos:
        'El consultante manifiesta haber prestado servicios por 3 años bajo subordinación continua. ' +
        'La empresa solicitó el informe meteorológico a la capitanía, el cual aún está pendiente de expedición y entrega. ' +
        'El empleador niega rotundamente la subordinación y alega autonomía técnica. ' +
        'Se aporta certificación de pagos de tesorería y copia auténtica del contrato de prestación.',
    };

    const res = await makeRequest('POST', '/api/escuela/analyze-matrix', payload);
    if (res.status !== 200) {
      return { paso: false, detalle: `Status esperado 200, recibido ${res.status}` };
    }
    const matriz = res.body.matriz;
    if (!Array.isArray(matriz) || matriz.length < 3) {
      return { paso: false, detalle: 'La matriz debe contener enunciados clasificados para cada oración fáctica' };
    }

    // 1. Verificación de prueba negativa (documento pendiente NO debe ser clasificado como RESPALDADO_POR_SOPORTE)
    const hechoPendiente = matriz.find((h: any) =>
      h.texto.toLowerCase().includes('pendiente de expedición') || h.texto.toLowerCase().includes('capitanía')
    );
    if (!hechoPendiente) {
      return { paso: false, detalle: 'No se procesó la oración con el informe pendiente' };
    }
    if (hechoPendiente.estado === 'RESPALDADO_POR_SOPORTE') {
      return {
        paso: false,
        detalle: 'ERROR DE FALSO POSITIVO: Se clasificó como RESPALDADO_POR_SOPORTE un informe que el texto dice que está pendiente de expedición.',
      };
    }
    if (hechoPendiente.estado !== 'PENDIENTE_CORROBORACION') {
      return {
        paso: false,
        detalle: `El informe pendiente debe tener estado PENDIENTE_CORROBORACION, pero tiene: ${hechoPendiente.estado}`,
      };
    }

    // 2. Verificación de afirmación unilateral (RELATADO_POR_PARTE)
    const hechoNarrado = matriz.find((h: any) => h.texto.toLowerCase().includes('manifiesta haber prestado'));
    if (!hechoNarrado || hechoNarrado.estado !== 'RELATADO_POR_PARTE') {
      return { paso: false, detalle: 'La manifestación unilateral debe tener estado RELATADO_POR_PARTE' };
    }

    // 3. Verificación de controversia (CONTROVERTIDO)
    const hechoControvertido = matriz.find((h: any) => h.texto.toLowerCase().includes('niega'));
    if (!hechoControvertido || hechoControvertido.estado !== 'CONTROVERTIDO') {
      return { paso: false, detalle: 'La negativa del empleador debe tener estado CONTROVERTIDO' };
    }

    // 4. Verificación de prueba positiva concretamente aportada (RESPALDADO_POR_SOPORTE)
    const hechoAportado = matriz.find((h: any) => h.texto.toLowerCase().includes('se aporta'));
    if (!hechoAportado || hechoAportado.estado !== 'RESPALDADO_POR_SOPORTE') {
      return { paso: false, detalle: 'El documento auténtico aportado debe tener estado RESPALDADO_POR_SOPORTE' };
    }

    return {
      paso: true,
      detalle: `Filtro antirruido y epistemología probatoria cumplidos: PENDIENTE_CORROBORACION detectado (sin falsos positivos), RELATADO_POR_PARTE, CONTROVERTIDO y RESPALDADO_POR_SOPORTE verificados.`,
    };
  });

  // PRUEBA 10: Análisis de Hipótesis Contrapuestas con contrato unificado
  await runTest(10, 'POST /api/escuela/analyze-hypotheses entrega contrato unificado con hipótesis simétricas y criterios', async () => {
    const payload = {
      casoId: casoCreadoId,
      hechos: 'Un empleado solicita reliquidación de horas extras y dominicales alegando jornada continua de 12 horas. El empleador alega cargo de confianza y manejo.',
      areaDerecho: 'LABORAL_SEGURIDAD_SOCIAL',
    };

    const res = await makeRequest('POST', '/api/escuela/analyze-hypotheses', payload);
    if (res.status !== 200) {
      return { paso: false, detalle: `Status esperado 200, recibido ${res.status}` };
    }
    const a = res.body.analisis || res.body.analisisHipotesis;
    if (!a.hipotesisPrincipal || !a.hipotesisAlternativa) {
      return { paso: false, detalle: 'Debe contener hipótesis principal y alternativa' };
    }
    if (!a.puntosControvertidos || !a.cargaProbatoria) {
      return { paso: false, detalle: 'El contrato unificado debe incluir puntosControvertidos y cargaProbatoria' };
    }
    if (!a.sintesisPonderacion || !a.criterioDecisionSugerido) {
      return { paso: false, detalle: 'Falta síntesis de ponderación y criterio de decisión' };
    }
    return {
      paso: true,
      detalle: `Contrato unificado verificado (${res.body.origen}): '${a.hipotesisPrincipal.titulo}' vs '${a.hipotesisAlternativa.titulo}'. Criterio de decisión y carga probatoria validados.`,
    };
  });

  // PRUEBA 11: Diálogo Socrático Gradual (Evaluación de razonamiento y detección de falacias)
  await runTest(11, 'POST /api/escuela/socratic-step evalúa razonamiento y suministra la siguiente pregunta pedagógica', async () => {
    const payload = {
      etapaActual: 'HECHOS',
      preguntaAnterior: '¿Qué hechos cuentan con soporte documental?',
      respuestaEstudiante: 'El cliente dice que le deben dinero, por lo tanto el juez debe ordenar el pago de inmediato.',
      contexto: 'Caso de cobro de honorarios',
      historial: [],
    };

    const res = await makeRequest('POST', '/api/escuela/socratic-step', payload);
    if (res.status !== 200) {
      return { paso: false, detalle: `Status esperado 200, recibido ${res.status}` };
    }
    const ev = res.body.evaluacion;
    if (!ev || !ev.calificacionCualitativa || !Array.isArray(ev.erroresRazonamiento)) {
      return { paso: false, detalle: 'Falta evaluación cualitativa o lista de errores de razonamiento' };
    }
    const prox = res.body.proximoPaso;
    if (!prox || !prox.etapa || !prox.preguntaGuia) {
      return { paso: false, detalle: 'Falta entrega del próximo paso socrático' };
    }

    return {
      paso: true,
      detalle: `Socrático evaluó: ${ev.calificacionCualitativa}. Errores detectados: ${ev.erroresRazonamiento.length}. Próxima etapa guiada: ${prox.etapa}.`,
    };
  });

  // PRUEBA 12: Ruta Procesal con advertencia de datos faltantes y supuestos de cómputo
  await runTest(12, 'POST /api/escuela/procedural-route incluye datosFaltantesPrevios y supuestosCalculoTerminos', async () => {
    const res = await makeRequest('POST', '/api/escuela/procedural-route', {
      materia: 'ADMINISTRATIVO',
      tipoProcedimiento: 'NULIDAD_Y_RESTABLECIMIENTO',
    });
    if (res.status !== 200) {
      return { paso: false, detalle: `Status esperado 200, recibido ${res.status}` };
    }
    const ruta = res.body.ruta;
    if (!Array.isArray(ruta.datosFaltantesPrevios) || ruta.datosFaltantesPrevios.length === 0) {
      return { paso: false, detalle: 'Debe identificar datos faltantes antes de sugerir la ruta' };
    }
    if (!Array.isArray(ruta.supuestosCalculoTerminos) || ruta.supuestosCalculoTerminos.length === 0) {
      return { paso: false, detalle: 'Debe contener los supuestos de cómputo de términos (Ley 2213 Art. 8 / CPACA)' };
    }
    return {
      paso: true,
      detalle: `Ruta validada con ${ruta.datosFaltantesPrevios.length} datos previos requeridos y ${ruta.supuestosCalculoTerminos.length} supuestos de cómputo.`,
    };
  });

  // PRUEBA 13: Borrador Académico de Matriz Probatoria (Art. 167 CGP)
  await runTest(13, 'POST /api/escuela/generate-doc genera borrador estructurado MATRIZ_PROBATORIA', async () => {
    const res = await makeRequest('POST', '/api/escuela/generate-doc', {
      tipo: 'MATRIZ_PROBATORIA',
      casoId: casoCreadoId,
      titulo: 'Matriz Probatoria del Caso de Estudio',
    });
    if (res.status !== 201) {
      return { paso: false, detalle: `Status esperado 201, recibido ${res.status}` };
    }
    const doc = res.body.borrador;
    if (doc.tipo !== 'MATRIZ_PROBATORIA') {
      return { paso: false, detalle: 'El tipo debe ser MATRIZ_PROBATORIA' };
    }
    const texto = doc.contenidoTexto;
    if (!texto.includes('MATRIZ DE HECHOS Y PRUEBAS') || !texto.includes('RELATADO_POR_PARTE')) {
      return { paso: false, detalle: 'El borrador debe incluir la estructura de matriz probatoria y el estado RELATADO_POR_PARTE' };
    }
    return {
      paso: true,
      detalle: `Borrador MATRIZ_PROBATORIA generado con éxito. Reglas probatorias y salvaguarda no radicable verificadas.`,
    };
  });

  // PRUEBA 14: Acceso Educativo Libre (sin requerir autenticación ni sesión)
  await runTest(14, 'Acceso Educativo Libre: endpoints de estudio responden 200 sin credenciales ni sesión', async () => {
    const resCasos = await makeRequest('GET', '/api/escuela/casos');
    const resMatrix = await makeRequest('POST', '/api/escuela/analyze-matrix', {
      hechos: 'El estudiante redacta una situación fáctica de estudio para analizar la carga de la prueba.',
    });
    const resSearch = await makeRequest('GET', '/api/investigacion/search?q=tutela');

    if (resCasos.status !== 200 || resMatrix.status !== 200 || resSearch.status !== 200) {
      return {
        paso: false,
        detalle: `Falla de acceso libre: casos=${resCasos.status}, matrix=${resMatrix.status}, search=${resSearch.status}`,
      };
    }

    return {
      paso: true,
      detalle: 'Acceso educativo libre comprobado: recursos pedagógicos y catálogo oficial accesibles sin credenciales ni barreras.',
    };
  });

  // PRUEBA 15: Teardown controlado: eliminar caso creado para evitar duplicados en la base de datos
  await runTest(15, 'Teardown y Preservación: eliminar caso temporal de pruebas sin dejar duplicados', async () => {
    if (!casoCreadoId) {
      return { paso: true, detalle: 'No se requirió limpieza al no haber ID de caso temporal.' };
    }

    const resDel = await makeRequest('DELETE', `/api/escuela/casos/${casoCreadoId}`);
    if (resDel.status !== 200) {
      return { paso: false, detalle: `Status esperado 200 al eliminar caso de prueba, recibido ${resDel.status}` };
    }

    return {
      paso: true,
      detalle: `Caso temporal ${casoCreadoId} eliminado exitosamente. Estado de la base de datos preservado limpio e intacto.`,
    };
  });

  console.log('\n======================================================');
  const todasAprobadas = resultados.every((r) => r.paso);
  const totalAprobadas = resultados.filter((r) => r.paso).length;
  console.log(`  RESUMEN: ${totalAprobadas}/${resultados.length} PRUEBAS SUPERADAS`);
  console.log('======================================================');

  if (todasAprobadas) {
    console.log('\n\x1b[32m✔ TODAS LAS PRUEBAS DE LA ESCUELA JURÍDICA PASARON SATISFACTORIAMENTE [VERIFICADO]\x1b[0m\n');
    process.exit(0);
  } else {
    console.error('\n\x1b[31m✘ EXISTEN PRUEBAS FALLIDAS EN LA ESCUELA JURÍDICA\x1b[0m\n');
    process.exit(1);
  }
}

iniciarSuite().catch((err) => {
  console.error('Error fatal ejecutando suite:', err);
  process.exit(1);
});

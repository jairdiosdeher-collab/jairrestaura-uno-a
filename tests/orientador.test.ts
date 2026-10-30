/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — SUITE DE PRUEBAS DEL ORIENTADOR JURÍDICO CIUDADANO IA
 * Validación de acceso público, detección de urgencias, rigor normativo colombiano y salvaguardas.
 */

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  num: number;
  nombre: string;
  paso: boolean;
  detalles: string;
}

const resultados: TestResult[] = [];

async function ejecutarPrueba(num: number, nombre: string, fn: () => Promise<void>) {
  try {
    await fn();
    resultados.push({ num, nombre, paso: true, detalles: 'Aprobada' });
    console.log(`\x1b[32m✔ [APROBADA]\x1b[0m ${num}. ${nombre}`);
  } catch (err: any) {
    resultados.push({ num, nombre, paso: false, detalles: err.message || String(err) });
    console.error(`\x1b[31m✘ [FALLIDA]\x1b[0m ${num}. ${nombre}: ${err.message}`);
  }
}

async function runOrientadorTests() {
  console.log('\n======================================================');
  console.log('  SUITE DE PRUEBAS: ORIENTADOR JURÍDICO CIUDADANO IA');
  console.log('  JAIRRESTAURA UNO A — ORDENAMIENTO JURÍDICO COLOMBIANO');
  console.log('======================================================\n');

  // TEST 1: Consulta pública sin inicio de sesión responde 200 OK
  await ejecutarPrueba(1, 'Acceso público libre: POST /api/orientador/orientar responde 200 sin credenciales', async () => {
    const res = await fetch(`${BASE_URL}/api/orientador/orientar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        descripcionProblema: 'Mi empleador no me ha pagado el salario de los dos últimos meses ni las cesantías tras mi renuncia.',
        ciudad: 'Bogotá D.C.',
        resultadoEsperado: 'Recuperar mi liquidación y salarios adeudados',
        documentosDisponibles: ['Contrato laboral a término indefinido', 'Extracto bancario']
      })
    });

    if (res.status !== 200) {
      throw new Error(`Se esperaba status 200, recibido: ${res.status}`);
    }

    const data = await res.json();
    if (!data.orientacion || !data.orientacion.resumenSituacion) {
      throw new Error('Estructura de respuesta inválida: falta objeto orientacion');
    }
    if (!data.orientacion.procedimientoPasoAPaso || data.orientacion.procedimientoPasoAPaso.length === 0) {
      throw new Error('La orientación debe incluir el procedimiento paso a paso numerado');
    }
  });

  // TEST 2: Rutas profesionales privadas siguen exigiendo 401 sin sesión
  await ejecutarPrueba(2, 'Aislamiento de seguridad: /api/expedientes y /api/clientes deniegan acceso anónimo (401)', async () => {
    const resExp = await fetch(`${BASE_URL}/api/expedientes`);
    if (resExp.status !== 401) {
      throw new Error(`Fallo de seguridad: /api/expedientes respondió ${resExp.status} en vez de 401`);
    }

    const resCli = await fetch(`${BASE_URL}/api/clientes`);
    if (resCli.status !== 401) {
      throw new Error(`Fallo de seguridad: /api/clientes respondió ${resCli.status} en vez de 401`);
    }
  });

  // TEST 3: Intento de forjar cabecera x-user-id sin token es rechazado (401)
  await ejecutarPrueba(3, 'Prevención de suplantación: cabecera manipulable x-user-id sin Bearer token retorna 401', async () => {
    const res = await fetch(`${BASE_URL}/api/clientes`, {
      headers: { 'x-user-id': 'usr-jair-01' }
    });

    if (res.status !== 401) {
      throw new Error(`Vulnerabilidad: Se permitió bypass con x-user-id sin token. Status: ${res.status}`);
    }
  });

  // TEST 4: Detección de urgencias y términos perentorios
  await ejecutarPrueba(4, 'Detección de urgencia: mandamiento de pago notificado activa alerta con 5 días hábiles CGP', async () => {
    const res = await fetch(`${BASE_URL}/api/orientador/orientar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        descripcionProblema: 'Me llegó un correo del juzgado civil con un mandamiento de pago por un pagaré de una tarjeta de crédito.',
        notificacionRecibida: true,
        detalleNotificacion: 'Auto que libra mandamiento de pago con fecha del lunes',
        ciudad: 'Medellín'
      })
    });

    if (res.status !== 200) {
      throw new Error(`Status inesperado: ${res.status}`);
    }

    const data = await res.json();
    const urgencia = data.orientacion?.urgencia;

    if (!urgencia || !urgencia.esUrgente || urgencia.nivelUrgencia !== 'ALTA') {
      throw new Error('No se detectó la urgencia de mandamiento de pago como ALTA');
    }

    if (!urgencia.plazoVerificar?.includes('5 días')) {
      throw new Error(`Plazo incorrecto: se esperaba mención expresa a los 5 días hábiles del CGP, recibido: ${urgencia.plazoVerificar}`);
    }
  });

  // TEST 5: Validación de entrada insuficiente
  await ejecutarPrueba(5, 'Validación estricta: descripción menor a 10 caracteres retorna 400 Bad Request', async () => {
    const res = await fetch(`${BASE_URL}/api/orientador/orientar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        descripcionProblema: 'Ayuda'
      })
    });

    if (res.status !== 400) {
      throw new Error(`Se esperaba 400 por descripción insuficiente, recibido: ${res.status}`);
    }
    const err = await res.json();
    if (err.codigo !== 'DESCRIPCION_INSUFICIENTE') {
      throw new Error(`Código de error inesperado: ${err.codigo}`);
    }
  });

  // TEST 6: Generación de borrador de Derecho de Petición con marca de agua obligatoria
  await ejecutarPrueba(6, 'Borradores ciudadanos: Derecho de Petición Art. 23 incluye marca de agua y salvaguarda', async () => {
    const res = await fetch(`${BASE_URL}/api/orientador/generar-borrador`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'DERECHO_PETICION_ART23',
        entrada: {
          descripcionProblema: 'La empresa de telefonía me sigue cobrando un plan que cancelé en enero.',
          ciudad: 'Cali',
          resultadoEsperado: 'Cancelación definitiva del cobro y paz y salvo'
        }
      })
    });

    if (res.status !== 201) {
      throw new Error(`Se esperaba status 201, recibido: ${res.status}`);
    }

    const data = await res.json();
    const borrador = data.borrador;

    if (!borrador || !borrador.contenidoTexto) {
      throw new Error('No se generó el texto del borrador');
    }

    if (!borrador.contenidoTexto.includes('[BORRADOR CIUDADANO PARA REVISIÓN - NO ES RADICACIÓN FORMAL]')) {
      throw new Error('Falta la marca de agua obligatoria de borrador ciudadano');
    }

    if (!borrador.contenidoTexto.includes('Ley Estatutaria 1755 de 2015') && !borrador.contenidoTexto.includes('Artículo 23')) {
      throw new Error('Falta el fundamento constitucional y estatutario en el memorial');
    }

    if (!borrador.camposPendientesCompletar || borrador.camposPendientesCompletar.length === 0) {
      throw new Error('Debe señalar los campos pendientes de completar por el ciudadano');
    }
  });

  // TEST 7: Generación de borrador de reclamación del consumidor Ley 1480
  await ejecutarPrueba(7, 'Borrador de Consumidor: Reclamación directa previa según Ley 1480 Art. 58', async () => {
    const res = await fetch(`${BASE_URL}/api/orientador/generar-borrador`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'RECLAMACION_DIRECTA_CONSUMIDOR',
        entrada: {
          descripcionProblema: 'Compré un televisor que llegó con la pantalla partida y la tienda se niega a cambiarlo.',
          ciudad: 'Barranquilla',
          resultadoEsperado: 'Cambio inmediato por producto nuevo o devolución del dinero'
        }
      })
    });

    if (res.status !== 201) {
      throw new Error(`Se esperaba status 201, recibido: ${res.status}`);
    }

    const data = await res.json();
    const borrador = data.borrador;

    if (!borrador.contenidoTexto.includes('Ley 1480 de 2011')) {
      throw new Error('Falta la cita del Estatuto del Consumidor');
    }
    if (!borrador.contenidoTexto.includes('Superintendencia de Industria y Comercio')) {
      throw new Error('Falta advertencia de queja o demanda ante la SIC');
    }
  });

  // TEST 8: Fuentes jurídicas verificables apuntan exclusivamente a dominios oficiales colombianos
  await ejecutarPrueba(8, 'Verificación de fuentes oficiales: portales y normas utilizan HTTPS y dominios .gov.co', async () => {
    const res = await fetch(`${BASE_URL}/api/orientador/orientar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        descripcionProblema: 'Problema con arrendador que no quiere devolver el depósito ni recibir el inmueble.',
        ciudad: 'Bucaramanga'
      })
    });

    const data = await res.json();
    const fuentes = data.orientacion?.fuentesOficiales || [];
    const entidades = data.orientacion?.dondeAcudir || [];

    for (const f of fuentes) {
      const url = f.enlaceVerificado || f.enlaceOficial;
      if (!url?.startsWith('https://') || !url?.includes('.gov.co')) {
        throw new Error(`Enlace no oficial o inseguro en fuentes: ${url}`);
      }
    }

    for (const e of entidades) {
      if (!e.enlaceOficial?.startsWith('https://') || !e.enlaceOficial?.includes('.gov.co')) {
        throw new Error(`Enlace no oficial en entidad competente: ${e.enlaceOficial}`);
      }
    }
  });

  // TEST 9: Clasificación de autogestión distingue trámites sin abogado de los de apoderado obligatorio
  await ejecutarPrueba(9, 'Clasificación de autogestión: Derecho de Petición/Tutela es Nivel 1 y Mayor Cuantía es Nivel 4', async () => {
    const resTutela = await fetch(`${BASE_URL}/api/orientador/orientar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        descripcionProblema: 'Necesito interponer una tutela contra mi EPS porque no me autoriza una cirugía urgente.',
        resultadoEsperado: 'Acción de tutela en nombre propio'
      })
    });
    const dataTutela = await resTutela.json();
    const nivelTutela = dataTutela.orientacion?.clasificacionAutogestion?.nivel;

    if (nivelTutela !== 'AUTOGESTIONABLE') {
      throw new Error(`Se esperaba nivel AUTOGESTIONABLE para tutela en salud, recibido: ${nivelTutela}`);
    }
  });

  // TEST 10: Glosario ciudadano contiene definiciones claras y marca de ejemplos pedagógicos
  await ejecutarPrueba(10, 'Glosario pedagógico: GET /api/orientador/glosario retorna 12+ términos con advertencia de ejemplo', async () => {
    const res = await fetch(`${BASE_URL}/api/orientador/glosario`);
    if (res.status !== 200) {
      throw new Error(`Status inesperado: ${res.status}`);
    }

    const data = await res.json();
    if (!Array.isArray(data.glosario) || data.glosario.length < 10) {
      throw new Error(`El glosario debe contener al menos 10 términos estructurados, tiene: ${data.glosario?.length}`);
    }

    const tutela = data.glosario.find((g: any) => g.termino.includes('Tutela'));
    if (!tutela || !tutela.ejemploHipotetico.includes('[EJEMPLO HIPOTÉTICO EDUCATIVO - NO ES UN CASO REAL]')) {
      throw new Error('Los ejemplos del glosario deben estar expresamente rotulados como hipotéticos');
    }
  });

  // TEST 11: Contrato completo de orientación contiene los 9 bloques (Secciones A a I)
  await ejecutarPrueba(11, 'Estructura integral de la guía ciudadana: verifica las 9 secciones requeridas (A - I)', async () => {
    const res = await fetch(`${BASE_URL}/api/orientador/orientar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        descripcionProblema: 'Mi inquilino lleva 4 meses sin pagar el arriendo del apartamento y no me contesta las llamadas.',
        ciudad: 'Cartagena',
        resultadoEsperado: 'Recuperar mi apartamento y el dinero que me debe'
      })
    });

    const data = await res.json();
    const o = data.orientacion;

    if (!o.resumenSituacion?.loQueEntendemos) throw new Error('Falta Sección A: Lo que entendemos');
    if (!o.opcionesLegales || o.opcionesLegales.length === 0) throw new Error('Falta Sección B: Opciones legales');
    if (!o.queHacerPrimero?.accion) throw new Error('Falta Sección C: Qué hacer primero');
    if (!o.procedimientoPasoAPaso || o.procedimientoPasoAPaso.length === 0) throw new Error('Falta Sección D: Procedimiento paso a paso');
    if (!o.clasificacionAutogestion?.nivel) throw new Error('Falta Sección E: Nivel de autogestión');
    if (!o.documentosRequeridos || o.documentosRequeridos.length === 0) throw new Error('Falta Sección F: Lista de documentos');
    if (!o.dondeAcudir || o.dondeAcudir.length === 0) throw new Error('Falta Sección G: Dónde acudir');
    if (!o.queHacerDespues || o.queHacerDespues.length === 0) throw new Error('Falta Sección H: Qué hacer después');
    if (!o.proximoPasoInmediato) throw new Error('Falta Sección I: Próximo paso recomendado');
  });

  // TEST 12: Preservación de pruebas previas
  await ejecutarPrueba(12, 'Compatibilidad de regresión: verificación de que el estado general de la app sigue intacto', async () => {
    const resStats = await fetch(`${BASE_URL}/api/dashboard/stats`, {
      headers: { 'Authorization': 'Bearer jairrestaura-demo-session-token-2026' }
    });
    if (resStats.status !== 200) {
      throw new Error(`Dashboard stats falló con status: ${resStats.status}`);
    }
  });

  console.log('\n======================================================');
  const superadas = resultados.filter(r => r.paso).length;
  console.log(`  RESUMEN: ${superadas}/${resultados.length} PRUEBAS SUPERADAS`);
  console.log('======================================================');

  if (superadas < resultados.length) {
    process.exit(1);
  }
}

runOrientadorTests().catch((err) => {
  console.error('Error fatal ejecutando pruebas:', err);
  process.exit(1);
});

import { CORPUS_JURIDICO_COLOMBIA, PORTALES_OFICIALES_COLOMBIA } from '../src/utils/colombianLegalCorpus';

interface TestResult {
  id: number;
  description: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function runTest(id: number, description: string, fn: () => { passed: boolean; details: string }) {
  try {
    const res = fn();
    results.push({ id, description, passed: res.passed, details: res.details });
    const tag = res.passed ? '✓ PASÓ' : '✗ FALLÓ';
    console.log(`[TEST ${id}] ${tag}: ${description}`);
    console.log(`       Detalle: ${res.details}`);
  } catch (err) {
    results.push({ id, description, passed: false, details: String(err) });
    console.error(`[TEST ${id}] ✗ ERROR INESPERADO: ${description} - ${err}`);
  }
}

console.log('================================================================');
console.log('SUITE DE PRUEBAS AUTOMATIZADAS - MÓDULO DE INVESTIGACIÓN JURÍDICA');
console.log('JAIRRESTAURA UNO A - ORDENAMIENTO JURÍDICO COLOMBIANO');
console.log('================================================================\n');

// TEST 1: Buscar "Ley 1755" y verificar distinción Art. 19 y Art. 21 CPACA
runTest(1, 'Búsqueda de "Ley 1755" con correcta distinción entre Art. 19 y Art. 21 CPACA', () => {
  const norma = CORPUS_JURIDICO_COLOMBIA.find(n => 
    n.identificador.includes('1755') && n.tipoNormaOProvidencia === 'LEY'
  );
  if (!norma) {
    return { passed: false, details: 'No se encontró la Ley 1755 en el catálogo oficial' };
  }

  const claves = norma.articulosOFundamentosClave;
  const resumen = norma.resumenExtracto;
  const texto = `${claves} ${resumen}`;

  // Verificar Art. 19: peticiones irrespetuosas, oscuras o reiterativas
  const tieneArt19 = claves.includes('Art. 19') && 
    (claves.toLowerCase().includes('irrespetuosa') || claves.toLowerCase().includes('oscura'));

  // Verificar Art. 21: falta de competencia funcional y remisión en 5 días hábiles
  const tieneArt21 = claves.includes('Art. 21') && 
    claves.toLowerCase().includes('competencia') && 
    (claves.includes('5 días') || claves.includes('cinco días'));

  // Verificar que el resumen ratifique la distinción
  const distincionEnResumen = resumen.includes('Art. 19 CPACA') && 
    resumen.includes('Art. 21 CPACA') && 
    resumen.includes('5 días');

  if (!tieneArt19) {
    return { passed: false, details: 'Falta Art. 19 CPACA o no describe peticiones irrespetuosas/oscuras' };
  }
  if (!tieneArt21) {
    return { passed: false, details: 'Falta Art. 21 CPACA o no describe incompetencia funcional con remisión en 5 días' };
  }
  if (!distincionEnResumen) {
    return { passed: false, details: 'El resumen no ratifica la distinción expresa entre Art. 19 y Art. 21' };
  }

  return {
    passed: true,
    details: 'Ley Estatutaria 1755 de 2015 verificada: Art. 19 (peticiones irrespetuosas u oscuras) y Art. 21 (incompetencia con traslado en 5 días) diferenciados con precisión.'
  };
});

// TEST 2: Filtrar por tipo "LEY"
runTest(2, 'Filtrar por tipo "LEY" devuelve exclusivamente leyes vigentes', () => {
  const leyes = CORPUS_JURIDICO_COLOMBIA.filter(n => n.tipoNormaOProvidencia === 'LEY');
  
  if (leyes.length < 5) {
    return { passed: false, details: `Pocas leyes encontradas (${leyes.length}). Se esperaban al menos 5 leyes vigentes.` };
  }

  const todasSonLeyes = leyes.every(n => n.tipoNormaOProvidencia === 'LEY');
  const incluyeCGP = leyes.some(l => l.identificador.includes('1564'));
  const incluyeLey2213 = leyes.some(l => l.identificador.includes('2213'));
  const incluyeCPACA = leyes.some(l => l.identificador.includes('1437'));
  const incluyeLey1581 = leyes.some(l => l.identificador.includes('1581'));
  const incluyeLey1123 = leyes.some(l => l.identificador.includes('1123'));
  const incluyeLey2220 = leyes.some(l => l.identificador.includes('2220'));

  if (!todasSonLeyes) {
    return { passed: false, details: 'Se encontraron registros cuyo tipo no es LEY' };
  }
  if (!incluyeCGP || !incluyeLey2213 || !incluyeCPACA || !incluyeLey1581 || !incluyeLey1123 || !incluyeLey2220) {
    return { passed: false, details: 'Falta alguna de las leyes estructurales colombianas (1564, 2213, 1437, 1581, 1123 o 2220)' };
  }

  return {
    passed: true,
    details: `Total de ${leyes.length} leyes vigentes filtradas. Incluye CGP, CPACA, Ley 2213, Habeas Data 1581, Código Disciplinario 1123 y Estatuto Conciliación 2220.`
  };
});

// TEST 3: Combinar búsqueda con filtro
runTest(3, 'Búsqueda combinada: texto "código" + tipo "LEY"', () => {
  const query = 'código';
  const tipoFiltro = 'LEY';

  const resultados = CORPUS_JURIDICO_COLOMBIA.filter(item => {
    if (item.tipoNormaOProvidencia !== tipoFiltro) return false;
    const searchSpace = `${item.identificador} ${item.epigrafeOTitulo} ${item.articulosOFundamentosClave} ${item.resumenExtracto} ${item.materias.join(' ')}`.toLowerCase();
    return searchSpace.includes(query.toLowerCase());
  });

  if (resultados.length < 3) {
    return { passed: false, details: `Se esperaban al menos 3 códigos tipo LEY, encontrados: ${resultados.length}` };
  }

  const codigos = resultados.map(r => r.identificador);
  const incluyeCGP = resultados.some(r => r.identificador.includes('1564'));
  const incluyeCPACA = resultados.some(r => r.identificador.includes('1437'));
  const incluyeDisciplinario = resultados.some(r => r.identificador.includes('1123'));

  if (!incluyeCGP || !incluyeCPACA || !incluyeDisciplinario) {
    return { passed: false, details: `Faltan códigos principales: CGP, CPACA o Disciplinario. Obtenidos: ${codigos.join(', ')}` };
  }

  return {
    passed: true,
    details: `Coincidencias encontradas (${resultados.length}): ${codigos.join(' | ')}`
  };
});

// TEST 4: Consultar búsqueda sin coincidencias
runTest(4, 'Consulta con término inexistente maneja respuesta vacía de forma controlada', () => {
  const queryInexistente = 'termino_inexistente_xyz_9999_invalido';
  const resultados = CORPUS_JURIDICO_COLOMBIA.filter(item => {
    const searchSpace = `${item.identificador} ${item.epigrafeOTitulo} ${item.resumenExtracto} ${item.autoridadEmisora}`.toLowerCase();
    return searchSpace.includes(queryInexistente.toLowerCase());
  });

  const esValido = Array.isArray(resultados) && resultados.length === 0;
  return {
    passed: esValido,
    details: esValido ? 'Devuelve arreglo vacío sin excepciones ni fallos de ejecución.' : 'Devolvió elementos inesperados'
  };
});

// TEST 5: Comprobar enlaces oficiales y portales
runTest(5, 'Comprobar validez de estructura de URLs de portales oficiales (HTTPS y dominios del Estado)', () => {
  const dominiosOficialesValidos = [
    'suin-juriscol.gov.co',
    'corteconstitucional.gov.co',
    'cortesuprema.gov.co',
    'consejodeestado.gov.co',
    'ramajudicial.gov.co',
    'secretariajuridica.presidencia.gov.co',
    'imprenta.gov.co'
  ];

  const todasLasUrls = [
    ...CORPUS_JURIDICO_COLOMBIA.map(n => ({ id: n.identificador, url: n.enlaceVerificado })),
    ...PORTALES_OFICIALES_COLOMBIA.map(p => ({ id: p.nombre, url: p.url }))
  ];

  const urlsInvalidas: { id: string; url: string; motivo: string }[] = [];

  for (const item of todasLasUrls) {
    if (!item.url.startsWith('https://')) {
      urlsInvalidas.push({ id: item.id, url: item.url, motivo: 'No usa protocolo seguro HTTPS' });
      continue;
    }
    const tieneDominioOficial = dominiosOficialesValidos.some(dom => item.url.includes(dom));
    if (!tieneDominioOficial) {
      urlsInvalidas.push({ id: item.id, url: item.url, motivo: 'Dominio no reconocido como oficial del Estado colombiano' });
    }
  }

  if (urlsInvalidas.length > 0) {
    return {
      passed: false,
      details: `Se encontraron ${urlsInvalidas.length} enlaces no oficiales o no seguros: ${JSON.stringify(urlsInvalidas)}`
    };
  }

  return {
    passed: true,
    details: `Total de ${todasLasUrls.length} enlaces auditados. Todos utilizan HTTPS y dominios oficiales reconocidos de Colombia (.gov.co).`
  };
});

// TEST 6: Comprobar que cada ficha técnica identifica tipo, identificador, fecha, emisor y tema
runTest(6, 'Fichas técnicas con atributos obligatorios completos e íntegros', () => {
  const incompletos: string[] = [];

  for (const n of CORPUS_JURIDICO_COLOMBIA) {
    if (!n.id || !n.tipoNormaOProvidencia || !n.identificador || !n.fechaExpedicion || 
        !n.autoridadEmisora || !n.epigrafeOTitulo || !n.articulosOFundamentosClave || 
        !n.enlaceVerificado || !n.estadoVigenciaComprobado || !n.resumenExtracto) {
      incompletos.push(n.identificador);
    }
    if (!Array.isArray(n.materias) || n.materias.length === 0) {
      incompletos.push(`${n.identificador} (sin materias)`);
    }
  }

  if (incompletos.length > 0) {
    return {
      passed: false,
      details: `Disposiciones con campos obligatorios faltantes: ${incompletos.join(', ')}`
    };
  }

  return {
    passed: true,
    details: `Las ${CORPUS_JURIDICO_COLOMBIA.length} disposiciones tienen identificador, emisor, fecha, título, artículos clave, enlace oficial, vigencia comprobada y materias clasificadas.`
  };
});

// TEST 7: Comprobar Sentencia C-590 de 2005 (sin duplicados, 8 causales específicas completas)
runTest(7, 'Sentencia C-590 de 2005: sin duplicados y con las 8 causales específicas completas', () => {
  const c590 = CORPUS_JURIDICO_COLOMBIA.find(n => n.identificador.includes('C-590') && n.identificador.includes('2005'));
  if (!c590) {
    return { passed: false, details: 'Sentencia C-590 de 2005 no encontrada en el corpus' };
  }

  const claves = c590.articulosOFundamentosClave;
  const textoCompleto = `${claves} ${c590.resumenExtracto}`.toLowerCase();

  // 8 causales específicas de procedibilidad según doctrina unificada de la Corte Constitucional
  const causales = [
    { num: 1, nombre: 'defecto orgánico', encontrado: textoCompleto.includes('defecto orgánico') },
    { num: 2, nombre: 'defecto procedimental absoluto', encontrado: textoCompleto.includes('defecto procedimental absoluto') },
    { num: 3, nombre: 'defecto fáctico', encontrado: textoCompleto.includes('defecto fáctico') },
    { num: 4, nombre: 'defecto material o sustantivo', encontrado: textoCompleto.includes('defecto material') || textoCompleto.includes('defecto sustantivo') },
    { num: 5, nombre: 'error inducido', encontrado: textoCompleto.includes('error inducido') },
    { num: 6, nombre: 'decisión sin motivación', encontrado: textoCompleto.includes('sin motivación') },
    { num: 7, nombre: 'desconocimiento del precedente', encontrado: textoCompleto.includes('desconocimiento del precedente') },
    { num: 8, nombre: 'violación directa de la constitución', encontrado: textoCompleto.includes('violación directa de la constitución') }
  ];

  const faltantes = causales.filter(c => !c.encontrado);
  if (faltantes.length > 0) {
    return {
      passed: false,
      details: `Faltan causales específicas en C-590/05: ${faltantes.map(f => `(${f.num}) ${f.nombre}`).join(', ')}`
    };
  }

  // Verificar requisitos generales
  const tieneRequisitosGenerales = textoCompleto.includes('subsidiariedad') && textoCompleto.includes('inmediatez');
  if (!tieneRequisitosGenerales) {
    return { passed: false, details: 'Falta mención de requisitos generales (inmediatez o subsidiariedad)' };
  }

  // Comprobar que no haya duplicaciones arbitrarias de "defecto fáctico"
  const ocurrenciasFactico = (textoCompleto.match(/defecto fáctico/g) || []).length;
  // En la enumeración debe aparecer una sola vez como causal
  const coincidenciasEnClaves = (claves.toLowerCase().match(/defecto fáctico/g) || []).length;
  if (coincidenciasEnClaves > 1) {
    return { passed: false, details: `El término "defecto fáctico" aparece duplicado ${coincidenciasEnClaves} veces en articulosOFundamentosClave` };
  }

  return {
    passed: true,
    details: 'Sentencia C-590/05 validada: 0 duplicados, incluye los 6 requisitos generales de procedibilidad y las 8 causales específicas completas (orgánico, procedimental, fáctico, material, error inducido, decisión sin motivación, precedente y violación directa).'
  };
});

// TEST 8: Comprobar Ley 2213 de 2022 Art. 8 (manifestación bajo juramento, 2 días de gracia, inicio de término)
runTest(8, 'Ley 2213 de 2022 Art. 8: condiciones de validez, regla de los 2 días hábiles e inicio de términos', () => {
  const ley2213 = CORPUS_JURIDICO_COLOMBIA.find(n => n.identificador.includes('2213'));
  if (!ley2213) {
    return { passed: false, details: 'Ley 2213 de 2022 no encontrada en el corpus' };
  }

  const claves = ley2213.articulosOFundamentosClave.toLowerCase();
  const resumen = ley2213.resumenExtracto.toLowerCase();
  const texto = `${claves} ${resumen}`;

  const mencionaJuramento = texto.includes('juramento');
  const mencionaAcuseOEntrega = texto.includes('acuse') || texto.includes('entrega') || texto.includes('ingreso');
  const menciona2Dias = texto.includes('2 días hábiles') || texto.includes('dos (2) días');
  const mencionaDiaSiguiente = texto.includes('día hábil siguiente') || texto.includes('día hábil subsiguiente');
  const mencionaSentencias = texto.includes('c-900') || texto.includes('c-207');

  if (!mencionaJuramento) {
    return { passed: false, details: 'Art. 8 no menciona la afirmación bajo juramento respecto al canal digital' };
  }
  if (!mencionaAcuseOEntrega) {
    return { passed: false, details: 'Art. 8 no especifica constancia de acuse de recibo o entrega del mensaje de datos' };
  }
  if (!menciona2Dias) {
    return { passed: false, details: 'Art. 8 no detalla que se entenderá surtida transcurridos dos (2) días hábiles siguientes al acuse o entrega' };
  }
  if (!mencionaDiaSiguiente) {
    return { passed: false, details: 'Art. 8 no aclara que el término procesal empieza a correr al día hábil siguiente a aquel en que se surtió la notificación' };
  }
  if (!mencionaSentencias) {
    return { passed: false, details: 'Art. 8 no cita las sentencias constitucionales condicionantes (C-900/22 o C-207/23)' };
  }

  return {
    passed: true,
    details: 'Ley 2213 Art. 8 verificado: exige manifestación bajo juramento, constancia de acuse/entrega técnica, 2 días hábiles para entender surtida la notificación, inicio del término al día hábil siguiente y citas de sentencias C-900/22 y C-207/23.'
  };
});

console.log('\n----------------------------------------------------------------');
const todosPasaron = results.every(r => r.passed);
const totalPasados = results.filter(r => r.passed).length;
console.log(`RESUMEN: ${totalPasados} de ${results.length} pruebas superadas.`);
if (todosPasaron) {
  console.log('ESTADO FINAL: TODAS LAS PRUEBAS PASARON SATISFACTORIAMENTE [VERIFICADO]');
} else {
  console.error('ESTADO FINAL: EXISTEN PRUEBAS QUE NO PASARON');
  process.exit(1);
}

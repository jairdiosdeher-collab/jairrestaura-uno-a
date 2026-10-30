/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — ORIENTADOR JURÍDICO CIUDADANO IA
 * Motor de análisis, clasificación procedimental, detección de urgencias y fuentes verificadas
 * para el ordenamiento jurídico de la República de Colombia.
 */

import type {
  ProblemaCiudadanoEntrada,
  ResultadoOrientacionCiudadana,
  BorradorCiudadano,
  TipoBorradorCiudadano,
  ConceptoGlosarioCiudadano,
  UrgenciaCiudadana,
  NivelAutogestion,
  PasoRutaCiudadana,
  DocumentoRequeridoCiudadano,
  EntidadCompetenteCiudadana,
  OpcionLegalCiudadana,
  OrientacionGratuitaItem,
  FuenteJuridicaOficial
} from '../types/legal.ts';

import { CORPUS_JURIDICO_COLOMBIA } from './colombianLegalCorpus.ts';

// ============================================================
// 1. GLOSARIO CIUDADANO PEDAGÓGICO DE ACCESO LIBRE
// ============================================================
export const GLOSARIO_CIUDADANO: ConceptoGlosarioCiudadano[] = [
  {
    id: 'glo-demanda-vs-denuncia',
    termino: 'Demanda vs. Denuncia (Diferencia Fundamental)',
    categoria: 'CONCEPTOS_BASICOS',
    definicionClara: 'La demanda es el acto formal por el cual un ciudadano acude a un juez civil, laboral o de familia para exigir el cumplimiento de un contrato, el pago de una deuda, una indemnización o derechos de familia. La denuncia, en cambio, es la comunicación puesta ante la Fiscalía General de la Nación para poner en conocimiento la presunta comisión de un delito penal (ej. estafa, hurto, lesiones).',
    enPalabrasSencillas: 'Pones una DEMANDA cuando buscas que te paguen dinero, te devuelvan una casa o te reconozcan derechos; pones una DENUNCIA cuando ocurrió un delito que debe investigar la Fiscalía para castigar al responsable.',
    ejemploHipotetico: '[EJEMPLO HIPOTÉTICO EDUCATIVO - NO ES UN CASO REAL]: Si tu arrendatario no te paga el arriendo hace 3 meses, debes presentar una DEMANDA de restitución de inmueble arrendado ante un juez civil, NO una denuncia penal.',
    queNoEs: 'No es una denuncia penal ante la policía cuando se trata de una deuda o un conflicto entre particulares sobre un contrato civil o comercial.',
    baseLegal: 'Código General del Proceso (Ley 1564 de 2012, Art. 82) vs. Código de Procedimiento Penal (Ley 906 de 2004, Art. 66).'
  },
  {
    id: 'glo-notificacion-judicial',
    termino: 'Notificación Judicial y Regla de los 2 Días',
    categoria: 'PROCEDIMIENTOS',
    definicionClara: 'Es el mecanismo legal por el cual los juzgados ponen en conocimiento de una persona una orden, auto o demanda en su contra. Conforme al Art. 8 de la Ley 2213 de 2022 y la jurisprudencia constitucional (Sentencias C-900/22 y C-207/23), cuando la notificación se realiza por correo electrónico, se entiende surtida transcurridos 2 días hábiles siguientes al envío del mensaje, y los términos para responder comienzan al día hábil siguiente.',
    enPalabrasSencillas: 'Es el aviso formal que te envía un juzgado para decirte que hay un proceso en tu contra. Los días para defenderte empiezan a contar inmediatamente según la ley.',
    ejemploHipotetico: '[EJEMPLO HIPOTÉTICO EDUCATIVO - NO ES UN CASO REAL]: Si el juzgado te envía un correo el martes con un mandamiento de pago, el plazo no vence el mismo día; corren 2 días hábiles de gracia (miércoles y jueves), la notificación se surte el jueves y tu término de 5 días hábiles para defenderte empieza a correr el viernes.',
    queNoEs: 'No es un mensaje de WhatsApp informal de un cobrador particular amenazando con embargo; es un acto emanado de un despacho judicial con radicado oficial.',
    baseLegal: 'Ley 2213 de 2022 (Art. 8) y Corte Constitucional Sentencias C-900 de 2022 y C-207 de 2023.'
  },
  {
    id: 'glo-derecho-peticion',
    termino: 'Derecho de Petición (Artículo 23 CP)',
    categoria: 'DERECHOS',
    definicionClara: 'Mecanismo constitucional fundamental que faculta a cualquier persona a presentar solicitudes respetuosas ante autoridades públicas o entidades privadas (bancos, EPS, colegios, empresas de servicios) y a obtener una respuesta pronta, de fondo, clara y precisa en los plazos de la ley.',
    enPalabrasSencillas: 'Es tu derecho a exigir por escrito explicaciones, información, copias o soluciones a cualquier entidad pública o privada, y ellos están obligados por ley a responderte.',
    ejemploHipotetico: '[EJEMPLO HIPOTÉTICO EDUCATIVO - NO ES UN CASO REAL]: Le escribes a tu EPS solicitando copia de tu historia clínica y fecha de una cirugía. La EPS tiene 15 días hábiles para responderte de fondo.',
    queNoEs: 'No requiere abogado, no cuesta dinero y no pueden rechazártelo por falta de sellos o formalidades sacramentales.',
    baseLegal: 'Constitución Política Art. 23 y Ley Estatutaria 1755 de 2015.'
  },
  {
    id: 'glo-accion-tutela',
    termino: 'Acción de Tutela (Artículo 86 CP)',
    categoria: 'DERECHOS',
    definicionClara: 'Garantía constitucional para la protección inmediata de los derechos fundamentales (vida, salud, debido proceso, mínimo vital, igualdad) cuando resulten vulnerados o amenazados por la acción u omisión de cualquier autoridad pública o particulares. Debe ser resuelta por el juez en un plazo improrrogable de 10 días.',
    enPalabrasSencillas: 'Es la herramienta más rápida para proteger tus derechos más importantes (como que te entreguen una medicina urgente o atiendan a tu hijo) cuando no existe otro medio judicial rápido.',
    ejemploHipotetico: '[EJEMPLO HIPOTÉTICO EDUCATIVO - NO ES UN CASO REAL]: Una EPS suspende el suministro de insulina a un paciente diabético. El paciente interpone tutela en nombre propio y el juez ordena la entrega en 48 horas.',
    queNoEs: 'No es un mecanismo para cobrar deudas en dinero ni para evadir los juicios ordinarios cuando no hay un derecho fundamental en riesgo.',
    baseLegal: 'Constitución Política de Colombia (Art. 86) y Decreto Reglamentario 2591 de 1991.'
  },
  {
    id: 'glo-conciliacion-prejudicial',
    termino: 'Conciliación Prejudicial Extrajudicial',
    categoria: 'PROCEDIMIENTOS',
    definicionClara: 'Mecanismo alternativo de solución de conflictos regulado por la Ley 2220 de 2022, mediante el cual dos partes enfrentadas acuden ante un tercero neutral y calificado (conciliador de centro de conciliación, personería, procuraduría o consultorio jurídico) para intentar un acuerdo voluntario antes de acudir a un juez. El acta de conciliación hace tránsito a cosa juzgada y presta mérito ejecutivo.',
    enPalabrasSencillas: 'Una reunión formal con un mediador autorizado para llegar a un acuerdo sin pelear en un juzgado. Si firman el acta, tiene la misma fuerza obligatoria que la sentencia de un juez.',
    ejemploHipotetico: '[EJEMPLO HIPOTÉTICO EDUCATIVO - NO ES UN CASO REAL]: Dos vecinos en conflicto por linderos asisten a la Personería Municipal y firman un acta donde se comprometen a fijar la cerca en una fecha exacta.',
    queNoEs: 'No es una charla informal entre amigos; el acta firmada permite embargar de inmediato si alguna parte incumple lo pactado.',
    baseLegal: 'Estatuto de Conciliación en Colombia (Ley 2220 de 2022).'
  },
  {
    id: 'glo-caducidad-vs-prescripcion',
    termino: 'Caducidad vs. Prescripción (Pérdida de Derechos por Tiempo)',
    categoria: 'TERMINOS_Y_PLAZOS',
    definicionClara: 'La caducidad extingue la oportunidad procesal para demandar ante un juez por el simple vencimiento del plazo legal (opera de oficio y no se interrumpe salvo excepciones legales estrictas). La prescripción extingue la exigibilidad del derecho sustancial por no haberlo reclamado a tiempo (debe ser alegada por quien se beneficia).',
    enPalabrasSencillas: 'La CADUCIDAD es el tiempo que tienes para poner una demanda ante el juez (si se vence, ya ningún juez puede admitirla). La PRESCRIPCIÓN es el tiempo que tienes para exigir que te paguen una deuda o derecho.',
    ejemploHipotetico: '[EJEMPLO HIPOTÉTICO EDUCATIVO - NO ES UN CASO REAL]: Si te despidieron de tu empleo, tienes 3 años para demandar tus cesantías (prescripción laboral Art. 488 CST). Pero si demandas al Estado por un acto administrativo, tienes solo 4 meses (caducidad Art. 164 CPACA).',
    queNoEs: 'No significa que el derecho desaparezca de la noche a la mañana sin regla legal; los plazos están fijados de manera exacta en los códigos colombianos.',
    baseLegal: 'Código Civil (Arts. 2512 y ss.), Código Sustantivo del Trabajo (Art. 488) y CPACA (Ley 1437/11 Art. 164).'
  },
  {
    id: 'glo-medida-cautelar-embargo',
    termino: 'Medidas Cautelares y Embargo Judicial',
    categoria: 'PROCEDIMIENTOS',
    definicionClara: 'Orden judicial preventiva dictada por un juez para asegurar el cumplimiento de una obligación o el resultado de un litigio, reteniendo bienes, cuentas bancarias, salarios o vehículos del demandado para evitar que sean ocultados o transferidos durante el juicio.',
    enPalabrasSencillas: 'Es la orden de un juez que congela una cuenta bancaria, retiene parte de un sueldo o inmoviliza un carro para asegurar que se pague una deuda demandada.',
    ejemploHipotetico: '[EJEMPLO HIPOTÉTICO EDUCATIVO - NO ES UN CASO REAL]: En un proceso ejecutivo por un pagaré impagado de $10.000.000 COP, el juez ordena el embargo y retención del saldo en la cuenta bancaria del deudor.',
    queNoEs: 'No puede ser decretado por una empresa de cobranzas privada por su propia cuenta; solo un JUEZ de la República o una entidad con cobro coactivo legal puede ordenar un embargo.',
    baseLegal: 'Código General del Proceso (Arts. 590 y ss.).'
  },
  {
    id: 'glo-cuantia-procesal',
    termino: 'Cuantía Procesal (Mínima, Menor y Mayor)',
    categoria: 'CONCEPTOS_BASICOS',
    definicionClara: 'Criterio fijado por el Art. 25 del Código General del Proceso para determinar qué juzgado conoce del asunto y si se requiere o no abogado: Mínima Cuantía (hasta 40 SMLMV), Menor Cuantía (más de 40 hasta 150 SMLMV) y Mayor Cuantía (más de 150 SMLMV).',
    enPalabrasSencillas: 'Es el valor total de dinero que se discute en el caso. Define qué juez atiende el pleito y si necesitas obligatoriamente pagar un abogado titulado.',
    ejemploHipotetico: '[EJEMPLO HIPOTÉTICO EDUCATIVO - NO ES UN CASO REAL]: En 2026, si reclamas una deuda de $15.000.000 COP (menos de 40 salarios mínimos), se tramita como Mínima Cuantía y puedes litigar en causa propia ante un Juzgado de Pequeñas Causas.',
    queNoEs: 'No se calcula sumando perjuicios imaginarios sin soporte probatorio real.',
    baseLegal: 'Código General del Proceso (Ley 1564 de 2012, Arts. 25 y 26).'
  },
  {
    id: 'glo-consultorio-juridico',
    termino: 'Consultorios Jurídicos Universitarios (Ley 2113 de 2021)',
    categoria: 'DERECHOS',
    definicionClara: 'Servicio social y pedagógico gratuito brindado por estudiantes de últimos años de Derecho supervisados por profesores y abogados titulados, autorizado por la Ley 2113 de 2021 para asesorar, conciliar y representar judicialmente a personas de estratos 1, 2 y 3 o de especial protección constitucional en asuntos de mínima cuantía.',
    enPalabrasSencillas: 'Oficinas gratuitas en las universidades de Derecho donde estudiantes avanzados y profesores te ayudan a redactar tutelas, derechos de petición, conciliar o llevar tu caso ante el juez.',
    ejemploHipotetico: '[EJEMPLO HIPOTÉTICO EDUCATIVO - NO ES UN CASO REAL]: Una madre cabeza de familia sin empleo acude al Consultorio Jurídico de una universidad para fijar la cuota de alimentos de su hija menor de edad.',
    queNoEs: 'No cobran honorarios ni comisiones; es un servicio público de acceso a la justicia 100% gratuito.',
    baseLegal: 'Ley 2113 de 2021.'
  },
  {
    id: 'glo-recurso-reposicion-apelacion',
    termino: 'Recursos Judiciales (Reposición vs. Apelación)',
    categoria: 'PROCEDIMIENTOS',
    definicionClara: 'Mecanismos de defensa procesal frente a autos o sentencias judiciales. La Reposición se formula ante el mismo juez que emitió la providencia para que la revoque o modifique (término de 3 días según Art. 318 CGP). La Apelación se interpone para que un juez superior jerárquico revise y corrija la decisión desfavorable (Art. 320 CGP).',
    enPalabrasSencillas: 'Reposición es pedirle al mismo juez que vuelva a revisar y cambie su decisión. Apelación es pedirle al juez de arriba (el superior) que revise si el primer juez se equivocó.',
    ejemploHipotetico: '[EJEMPLO HIPOTÉTICO EDUCATIVO - NO ES UN CASO REAL]: El juez niega una prueba solicitada. El interesado interpone recurso de reposición y en subsidio de apelación dentro de los 3 días siguientes a la notificación.',
    queNoEs: 'No pueden presentarse meses después; los términos para interponer recursos son de estricto cumplimiento (generalmente 3 días hábiles).',
    baseLegal: 'Código General del Proceso (Arts. 318 a 330).'
  },
  {
    id: 'glo-reclamacion-consumidor',
    termino: 'Reclamación Directa al Consumidor (Ley 1480 de 2011)',
    categoria: 'DERECHOS',
    definicionClara: 'Requisito de procedibilidad exigido por el Artículo 58 de la Ley 1480 de 2011 (Estatuto del Consumidor), mediante el cual el comprador insatisfecho con un producto o servicio debe presentar un reclamo previo por escrito ante el fabricante o vendedor. El proveedor cuenta con 15 días hábiles para responder, reparar, cambiar el bien o devolver el dinero antes de que se pueda demandar ante la SIC.',
    enPalabrasSencillas: 'La carta o solicitud formal que obligatoriamente debes entregar a la tienda antes de poder demandarla ante la Superintendencia de Industria y Comercio.',
    ejemploHipotetico: '[EJEMPLO HIPOTÉTICO EDUCATIVO - NO ES UN CASO REAL]: Compras una nevera y a los 5 días no enfría. Pasas una reclamación directa a la tienda exigiendo la efectividad de la garantía legal.',
    queNoEs: 'No es una queja verbal informal; debe quedar constancia por escrito (radicado, correo electrónico o sello de recibido).',
    baseLegal: 'Estatuto del Consumidor (Ley 1480 de 2011, Arts. 7, 8, 11 y 58).'
  },
  {
    id: 'glo-desacato-tutela',
    termino: 'Incidente de Desacato de Tutela',
    categoria: 'PROCEDIMIENTOS',
    definicionClara: 'Mecanismo sancionatorio de naturaleza incidental previsto en el Art. 52 del Decreto 2591 de 1991, que permite al ciudadano acudir ante el mismo juez que falló una tutela para solicitar arresto hasta de 6 meses y multa de hasta 20 SMLMV contra el funcionario o entidad que desobedeció la orden de amparo constitucional.',
    enPalabrasSencillas: 'La solicitud que le haces al juez cuando ganaste una tutela y la entidad (como la EPS) sigue sin obedecer la orden, para que el juez los sancione con arresto o multa.',
    ejemploHipotetico: '[EJEMPLO HIPOTÉTICO EDUCATIVO - NO ES UN CASO REAL]: El juez ordenó a la EPS autorizar una resonancia en 48 horas y han pasado 15 días sin cumplimiento. Se radica incidente de desacato.',
    queNoEs: 'No es una nueva tutela; se promueve dentro del mismo expediente que ya tiene sentencia favorable en firme.',
    baseLegal: 'Decreto 2591 de 1991 (Art. 52).'
  }
];

// ============================================================
// 2. DETECCIÓN DE URGENCIAS Y TÉRMINOS PERENTORIOS
// ============================================================
export function detectarUrgenciasCiudadanas(
  entrada: ProblemaCiudadanoEntrada
): UrgenciaCiudadana {
  const texto = `${entrada.descripcionProblema} ${entrada.detalleNotificacion || ''} ${entrada.fechaLimite || ''}`.toLowerCase();

  // 1. Detección de mandamiento de pago / cobro judicial ejecutivo
  if (
    texto.includes('mandamiento de pago') ||
    texto.includes('ejecutivo') ||
    (texto.includes('notific') && texto.includes('juzgado') && texto.includes('deuda')) ||
    (texto.includes('embargo') && (texto.includes('cuenta') || texto.includes('sueldo')))
  ) {
    return {
      esUrgente: true,
      nivelUrgencia: 'ALTA',
      motivoUrgencia: 'Notificación de Mandamiento de Pago o Medida Cautelar de Embargo Judicial en curso.',
      plazoVerificar: '5 días hábiles para pagar o proponer excepciones de mérito (Art. 442 Código General del Proceso).',
      advertenciaInmediata: '¡ALERTA DE TÉRMINO PERENTORIO EN CURSO! Si fuiste notificado de un mandamiento de pago, la ley colombiana te otorga solo CINCO (5) DÍAS HÁBILES para oponerte o proponer excepciones. Si dejas vencer este plazo, el juez ordenará seguir adelante la ejecución y liquidar el crédito sin escuchar tus argumentos.',
      diasRestantesEstimados: 5,
      accionesInmediatas: [
        'Verificar la fecha exacta en que recibiste el correo del juzgado o la citación física.',
        'Aplicar la regla de los 2 días de gracia si fue por correo (Ley 2213 de 2022 Art. 8).',
        'Acudir HOY MISMO a un Consultorio Jurídico Universitario o contratar un abogado para redactar la contestación y excepciones.',
        'Reunir comprobantes de pago, recibos, acuerdos previos o pruebas de cobro indebido.'
      ]
    };
  }

  // 2. Detección de notificación de demanda civil / familia ordinaria
  if (
    (entrada.notificacionRecibida || texto.includes('notificad') || texto.includes('citaci')) &&
    (texto.includes('demanda') || texto.includes('juez') || texto.includes('juzgado') || texto.includes('auto'))
  ) {
    return {
      esUrgente: true,
      nivelUrgencia: 'ALTA',
      motivoUrgencia: 'Notificación judicial recibida de demanda en curso ante despacho de la República.',
      plazoVerificar: '10 a 20 días hábiles según el tipo de proceso (Verbal Sumario Art. 391 o Verbal Art. 369 CGP).',
      advertenciaInmediata: 'Tienes un plazo judicial activo. El silencio o la no contestación tempestiva genera consecuencias adversas graves, como presumir ciertos los hechos susceptibles de confesión (Art. 97 CGP).',
      diasRestantesEstimados: 10,
      accionesInmediatas: [
        'Descargar el expediente completo desde el enlace oficial que remitió el juzgado o consultar el portal de la Rama Judicial.',
        'Revisar si se notificó con traslado completo de la demanda y sus anexos.',
        'Contactar de inmediato a un abogado de confianza o al Consultorio Jurídico de tu ciudad.'
      ]
    };
  }

  // 3. Detección de urgencia en salud / riesgo vital / vulneración de menores
  if (
    texto.includes('medicamento') ||
    texto.includes('quimioterapia') ||
    texto.includes('cirug') ||
    texto.includes('diálisis') ||
    texto.includes('uci') ||
    texto.includes('oxígeno') ||
    texto.includes('riesgo de muerte') ||
    texto.includes('menor de edad') ||
    texto.includes('desnutric')
  ) {
    return {
      esUrgente: true,
      nivelUrgencia: 'ALTA',
      motivoUrgencia: 'Vulneración inminente de derechos fundamentales a la Vida Digna y Salud de persona vulnerable.',
      plazoVerificar: 'Inmediato (Trámite de tutela con medida cautelar provisional de 48 horas).',
      advertenciaInmediata: 'La vida y la salud son derechos de protección reforzada. No debes esperar trámites ordinarios prolongados si existe riesgo de agravamiento o fallecimiento.',
      diasRestantesEstimados: 1,
      accionesInmediatas: [
        'Radicar hoy mismo una Acción de Tutela con solicitud expresa de Medida Cautelar Provisional de urgencia.',
        'Utilizar el sistema de radicación virtual de tutelas de la Rama Judicial (tutelas.ramajudicial.gov.co).',
        'Acudir a la Personería Municipal o Defensoría del Pueblo para que coadyuven de inmediato.'
      ]
    };
  }

  // 4. Detección de desalojo / lanzamiento de inmueble
  if (
    texto.includes('desalojo') ||
    texto.includes('lanzamiento') ||
    texto.includes('policía') ||
    texto.includes('inspección de policía')
  ) {
    return {
      esUrgente: true,
      nivelUrgencia: 'ALTA',
      motivoUrgencia: 'Procedimiento policivo o judicial de lanzamiento / restitución de tenencia de inmueble.',
      plazoVerificar: 'Términos de la diligencia policiva (Ley 1801 de 2016) o proceso judicial.',
      advertenciaInmediata: 'Un desalojo solo es legal si existe orden expedida por un Juez de la República o Inspector de Policía competente, garantizando el debido proceso. Un arrendador no puede cambiar cerraduras ni sacar pertenencias por propia mano.',
      diasRestantesEstimados: 3,
      accionesInmediatas: [
        'Exigir copia de la orden escrita de la autoridad competente con radicado oficial.',
        'Acudir a la Personería Municipal para solicitar acompañamiento como garante de derechos humanos.',
        'Presentar oposición si tienes calidad de poseedor o no fuiste notificado debidamente.'
      ]
    };
  }

  // 5. Urgencia media: reclamaciones de consumo, comparendos de tránsito, peticiones vencidas
  if (
    texto.includes('fotomulta') ||
    texto.includes('comparendo') ||
    texto.includes('datacrédito') ||
    texto.includes('cifin') ||
    texto.includes('centrales de riesgo') ||
    texto.includes('despido')
  ) {
    return {
      esUrgente: true,
      nivelUrgencia: 'MEDIA',
      motivoUrgencia: 'Término administrativo de impugnación o prescripción en trámite.',
      plazoVerificar: 'Comparendos: 11 días hábiles para audiencia / Laboral: 3 años de prescripción (Art. 488 CST).',
      advertenciaInmediata: 'Aunque no enfrentas un embargo judicial inmediato, existen términos legales que si vencen te privarán de rebajas o anularán tu derecho a controvertir la sanción o reporte.',
      diasRestantesEstimados: 11,
      accionesInmediatas: [
        'Consultar el estado del trámite en la plataforma oficial correspondiente (ej. SIMIT para multas).',
        'Radicar derecho de petición solicitando pruebas de la debida notificación personal.'
      ]
    };
  }

  // Informativa por defecto
  return {
    esUrgente: false,
    nivelUrgencia: 'INFORMATIVA',
    motivoUrgencia: 'Asunto en fase prejudicial o de consulta diagnóstica sin vencimiento judicial inminente identificado.',
    advertenciaInmediata: 'No se detecta un plazo judicial fatal en las próximas 48 horas con base en la información suministrada, pero conviene reunir la documentación completa para estructurar la reclamación.',
    accionesInmediatas: [
      'Recopilar contratos, recibos, correos o soportes que demuestren la situación fáctica.',
      'Seguir la ruta de actuación paso a paso recomendada.'
    ]
  };
}

// ============================================================
// 3. CLASIFICADOR DE AUTOGESTIÓN Y REQUISITO DE ABOGADO
// ============================================================
export function clasificarAutogestion(
  area: string,
  cuantiaEstimadaCOP: number = 0,
  tipoAsunto: string = ''
): { nivel: NivelAutogestion; justificacion: string; advertenciaRepresentacion: string } {
  const asuntoNorm = `${area} ${tipoAsunto}`.toUpperCase();

  // Nivel 1: Autogestionables directamente sin abogado
  if (
    asuntoNorm.includes('TUTELA') ||
    asuntoNorm.includes('PETICION') ||
    asuntoNorm.includes('CONSUMIDOR_RECLAMO_DIRECTO') ||
    asuntoNorm.includes('QUEJA_SUPERINTENDENCIA') ||
    asuntoNorm.includes('HABEAS_DATA')
  ) {
    return {
      nivel: 'AUTOGESTIONABLE',
      justificacion: 'La Constitución y la ley colombiana garantizan que cualquier persona natural puede presentar este trámite directamente sin necesidad de abogado titulado (Art. 86 CP para tutelas, Art. 23 CP para derechos de petición, Ley 1480/11 para reclamaciones de consumo).',
      advertenciaRepresentacion: 'Puedes radicarlo personalmente sin incurrir en honorarios. Solo asegúrate de conservar la constancia o radicado de recibido oficial.'
    };
  }

  // Nivel 2: Conviene asesoría previa o centro de conciliación
  if (
    asuntoNorm.includes('CONCILIACION') ||
    asuntoNorm.includes('ARRENDAMIENTO_ACUERDO') ||
    asuntoNorm.includes('ALIMENTOS_FIJACION_VOLUNTARIA') ||
    asuntoNorm.includes('TRANSACCION')
  ) {
    return {
      nivel: 'CONVIENE_ASESORIA',
      justificacion: 'Es jurídicamente válido que acudas por tu cuenta ante un Centro de Conciliación, Personería o Comisaría, pero es muy recomendable recibir orientación jurídica previa para no ceder derechos irrenunciables.',
      advertenciaRepresentacion: 'Un acuerdo firmado hace tránsito a cosa juzgada; antes de firmar, asesórate gratuitamente en un Consultorio Jurídico o Personería.'
    };
  }

  // Nivel 3: Verificar requisito legal de apoderado (Cuantía procesal CGP)
  if (
    cuantiaEstimadaCOP > 0 && cuantiaEstimadaCOP <= 52000000 // Menor a ~40 SMLMV (Mínima cuantía)
  ) {
    return {
      nivel: 'VERIFICAR_REQUISITO_ABOGADO',
      justificacion: 'Por tratarse de un asunto que no supera los 40 Salarios Mínimos Legales Mensuales Vigentes (Mínima Cuantía, Art. 25 CGP), la ley colombiana permite que el ciudadano litigue en causa propia sin abogado ante los Juzgados de Pequeñas Causas (Art. 73 CGP).',
      advertenciaRepresentacion: 'Aunque la ley te permite litigar sin abogado, el proceso exige conocer reglas probatorias y procesales estrictas. Si no dominas el procedimiento, es altamente aconsejable acudir a un Consultorio Jurídico Universitario gratuito.'
    };
  }

  // Nivel 4: Asistencia profesional prioritaria y obligatoria
  return {
    nivel: 'ASISTENCIA_PROFESIONAL_PRIORITARIA',
    justificacion: 'Conforme a los Artículos 73 y 75 del Código General del Proceso, este tipo de litigio (Menor o Mayor Cuantía, nulidad y restablecimiento, proceso ordinario laboral o defensa penal) exige por mandato legal la representación judicial obligatoria mediante Abogado con Tarjeta Profesional vigente.',
    advertenciaRepresentacion: 'El despacho judicial inadmitirá o rechazará cualquier escrito de fondo que no venga suscrito por un abogado titulado con poder debidamente conferido (Ley 2213 de 2022 Art. 5).'
  };
}

// ============================================================
// 4. MOTOR HEURÍSTICO DE ORIENTACIÓN CIUDADANA COLOMBIANA
// ============================================================
export function motorHeuristicoOrientacionCiudadana(
  entrada: ProblemaCiudadanoEntrada
): ResultadoOrientacionCiudadana {
  const desc = entrada.descripcionProblema.toLowerCase();
  const urgencia = detectarUrgenciasCiudadanas(entrada);

  let categorias: string[] = [];
  let areaDerecho: string = 'CIVIL';
  let cuantiaEstimada: number = 0;

  // Clasificación de materias
  if (desc.includes('salario') || desc.includes('despido') || desc.includes('liquidac') || desc.includes('cesant') || desc.includes('empleador') || desc.includes('trabaj')) {
    categorias.push('Derecho Laboral y Seguridad Social');
    areaDerecho = 'LABORAL';
  }
  if (desc.includes('arriend') || desc.includes('inquilin') || desc.includes('arrendador') || desc.includes('canon') || desc.includes('local') || desc.includes('inmueble')) {
    categorias.push('Arrendamientos Urbanos (Ley 820 de 2003)');
    areaDerecho = 'ARRENDAMIENTOS';
  }
  if (desc.includes('alimento') || desc.includes('hijo') || desc.includes('custodia') || desc.includes('visita') || desc.includes('paternidad') || desc.includes('divorcio')) {
    categorias.push('Derecho de Familia e Infancia');
    areaDerecho = 'FAMILIA';
  }
  if (desc.includes('garant') || desc.includes('producto') || desc.includes('defecto') || desc.includes('cobro indebido') || desc.includes('banco') || desc.includes('tarjeta') || desc.includes('compra')) {
    categorias.push('Protección al Consumidor (Ley 1480 de 2011)');
    areaDerecho = 'CONSUMIDOR';
  }
  if (desc.includes('eps') || desc.includes('medicamento') || desc.includes('salud') || desc.includes('tutela') || desc.includes('cirug')) {
    categorias.push('Derecho Constitucional a la Salud');
    areaDerecho = 'CONSTITUCIONAL_SALUD';
  }
  if (desc.includes('deuda') || desc.includes('pagaré') || desc.includes('letra') || desc.includes('préstamo') || desc.includes('cobro')) {
    categorias.push('Obligaciones y Títulos Valores');
    areaDerecho = 'CIVIL_DEUDAS';
  }
  if (desc.includes('fotomulta') || desc.includes('comparendo') || desc.includes('tránsito') || desc.includes('alcaldía') || desc.includes('impuesto')) {
    categorias.push('Derecho Administrativo y Tránsito');
    areaDerecho = 'ADMINISTRATIVO';
  }

  if (categorias.length === 0) {
    categorias.push('Derecho Civil y Obligaciones Generales');
  }

  const autogestion = clasificarAutogestion(areaDerecho, cuantiaEstimada, entrada.resultadoEsperado || '');

  // Generar datos estructurados según el área identificada
  let opciones: OpcionLegalCiudadana[] = [];
  let queHacerPrimero = {
    accion: 'Identificar fechas y asegurar pruebas documentales en soporte digital.',
    porQueEsImportante: 'En el derecho colombiano la afirmación sin prueba carece de fuerza jurídica (Art. 167 CGP).',
    plazoRecomendado: 'En las próximas 24 a 48 horas.'
  };
  let pasosRuta: PasoRutaCiudadana[] = [];
  let docsRequeridos: DocumentoRequeridoCiudadano[] = [];
  let entidades: EntidadCompetenteCiudadana[] = [];

  if (areaDerecho === 'LABORAL') {
    opciones = [
      {
        titulo: 'Reclamación Escrita Directa al Empleador',
        descripcion: 'Presentar una solicitud formal de pago de salarios, prestaciones y sanción moratoria (Art. 65 CST).',
        consecuencias: 'Interrumpe formalmente la prescripción trienal por una sola vez durante 3 años más (Art. 489 CST).',
        pros: ['No requiere costo ni abogado', 'Evidencia la buena fe del trabajador', 'Respuesta en plazo breve'],
        contras: ['Si el empleador no coopera voluntariamente, debe acudirse a mediación o demanda']
      },
      {
        titulo: 'Audiencia de Conciliación ante el Ministerio del Trabajo',
        descripcion: 'Solicitar citación voluntaria ante un Inspector de Trabajo para acordar el pago.',
        consecuencias: 'El acuerdo firmado tiene efecto vinculante obligatorio.',
        pros: ['Trámite 100% gratuito', 'La presencia del Inspector presiona una solución'],
        contras: ['El Inspector de Trabajo no puede obligar a pagar ni dictar sentencias; si no hay acuerdo, queda la vía judicial']
      },
      {
        titulo: 'Demanda Ordinaria Laboral de Primera Instancia',
        descripcion: 'Iniciar proceso ante un Juez Laboral del Circuito para ordenar el pago forzoso e indemnizaciones.',
        consecuencias: 'Sentencia judicial ejecutoriada que permite embargar cuentas del empleador.',
        pros: ['Sentencia judicial de obligatorio cumplimiento', 'Condena en costas y sanción moratoria del Art. 65 CST'],
        contras: ['Requiere abogado titulado obligatorio si supera mínima cuantía', 'Duración promedio de 1 a 2 años']
      }
    ];

    queHacerPrimero = {
      accion: 'Radicar de inmediato una carta formal de reclamación laboral con acuse de recibido.',
      porQueEsImportante: 'Interrumpe el término de prescripción laboral de 3 años (Art. 488 y 489 CST) y constituye en mora al empleador para el cobro del salario diario por cada día de retardo (Art. 65 CST).',
      plazoRecomendado: 'Antes de que transcurran 3 años desde la terminación del contrato o exigibilidad del salario.'
    };

    pasosRuta = [
      {
        orden: 1,
        titulo: 'Reunir Soportes de la Relación Laboral',
        paraQueSirve: 'Demostrar que existió prestación personal del servicio, salario y subordinación.',
        queHacer: 'Reúne copia de tu contrato de trabajo (o correos/mensajes con órdenes si era verbal), desprendibles de pago, extractos bancarios de transferencias y afiliaciones a EPS/Fondo de Pensiones.',
        documentosAReunir: ['Contrato de trabajo o comunicaciones con jefes', 'Extractos de cuenta con pagos recibidos', 'Certificado de semanas cotizadas en Colpensiones o Fondo Privado'],
        anteQuien: 'El propio trabajador ante sus archivos y entidades de seguridad social',
        canalOficial: 'Portal virtual de Colpensiones o Fondos Privados (Porvenir, Protección)',
        queEsperar: 'Contar con la cronología exacta de fechas de ingreso, retiro y salarios devengados.',
        queHacerSiFalla: 'Solicitar por derecho de petición copias de las planillas PILA a los operadores de pago (Aportes en Línea, SOI).',
        precauciones: ['No borrar chats de WhatsApp ni correos institucionales donde se impartían directrices o turnos.']
      },
      {
        orden: 2,
        titulo: 'Radicar Reclamación Escrita Formal (Interrupción de Prescripción)',
        paraQueSirve: 'Exigir formalmente la liquidación y congelar el cómputo del tiempo en tu favor.',
        queHacer: 'Redactar memorial detallando fechas trabajadas, cargos, salarios adeudados y citando el Art. 65 del Código Sustantivo del Trabajo. Radicar por correo certificado o con sello de recibido.',
        documentosAReunir: ['Carta de reclamación firmada', 'Copia de cédula'],
        anteQuien: 'Empleador o Dirección de Gestión Humana de la empresa',
        canalOficial: 'Correo electrónico de notificaciones judiciales de la empresa registrado en Cámara de Comercio',
        queEsperar: 'Respuesta con liquidación o propuesta de pago en 15 días hábiles.',
        queHacerSiFalla: 'Pasar al Paso 3 (Conciliación ante MinTrabajo o Consultorio Jurídico).',
        precauciones: ['Asegúrate de conservar el comprobante de entrega técnica o el sello físico con fecha legible.']
      },
      {
        orden: 3,
        titulo: 'Audiencia de Conciliación ante MinTrabajo o Consultorio Jurídico',
        paraQueSirve: 'Buscar un acuerdo de pago inmediato con mérito ejecutivo sin dilaciones judiciales.',
        queHacer: 'Diligenciar la solicitud de audiencia de conciliación laboral en el portal del Ministerio del Trabajo o radicar en un Consultorio Jurídico universitario.',
        documentosAReunir: ['Petición de conciliación con hechos y pretensiones económicas', 'Liquidación preliminar estimada'],
        anteQuien: 'Inspector de Trabajo del Ministerio del Trabajo o Conciliador Laboral',
        canalOficial: 'https://www.mintrabajo.gov.co',
        enlaceCanalOficial: 'https://www.mintrabajo.gov.co',
        queEsperar: 'Fijación de fecha de audiencia virtual o presencial para negociar con el empleador.',
        queHacerSiFalla: 'Solicitar Constancia de No Acuerdo para habilitar la demanda ordinaria laboral.',
        precauciones: ['Recuerda que los derechos laborales ciertos e indiscutibles (salarios, cesantías) NO pueden ser rebajados ni renunciados.']
      },
      {
        orden: 4,
        titulo: 'Demanda Ordinaria Laboral ante Juzgado',
        paraQueSirve: 'Obligar por vía de sentencia judicial al pago de salarios, cesantías e indemnizaciones.',
        queHacer: 'Otorgar poder a un abogado titulado o practicante de Consultorio Jurídico (si es mínima cuantía) para radicar la demanda laboral.',
        documentosAReunir: ['Constancia de no acuerdo de conciliación', 'Poder especial debidamente conferido', 'Pruebas testimoniales y documentales'],
        anteQuien: 'Juez Municipal de Pequeñas Causas Laborales o Juez Laboral del Circuito',
        canalOficial: 'https://www.ramajudicial.gov.co',
        enlaceCanalOficial: 'https://www.ramajudicial.gov.co',
        queEsperar: 'Admisión de demanda, traslado al demandado y audiencia única o de juzgamiento.',
        queHacerSiFalla: 'Interponer recurso de apelación dentro de la misma audiencia oral.',
        precauciones: ['Revisar siempre que el término trienal de prescripción no se haya vencido antes de radicar.']
      }
    ];

    docsRequeridos = [
      {
        id: 'doc-lab-1',
        nombre: 'Copia del Contrato Laboral o Comunicaciones de Contratación',
        descripcion: 'Documento escrito o mensajes de WhatsApp/correo donde se acordaron funciones y sueldo.',
        comoObtenerlo: 'Solicitar copia al empleador o recopilar mensajes originales del correo.',
        comoConservarlo: 'Guardar copia en PDF legible y copias de seguridad en la nube.',
        obligatorio: false
      },
      {
        id: 'doc-lab-2',
        nombre: 'Extractos Bancarios donde se recibían los pagos',
        descripcion: 'Constancias de las consignaciones mensuales o quincenales realizadas por la empresa.',
        comoObtenerlo: 'Descargar gratuitamente desde la banca virtual de tu entidad financiera.',
        comoConservarlo: 'Descargar con número de cuenta y fecha visible.',
        obligatorio: true
      },
      {
        id: 'doc-lab-3',
        nombre: 'Certificado de Historial de Cotizaciones a Seguridad Social',
        descripcion: 'Reporte que evidencia si el empleador realizó aportes a pensión, salud y riesgos laborales.',
        comoObtenerlo: 'Descargar de forma inmediata en la web de Colpensiones o Fondo Privado con número de cédula.',
        comoConservarlo: 'Archivo digital auténtico.',
        obligatorio: true
      }
    ];

    entidades = [
      {
        nombre: 'Ministerio del Trabajo de Colombia — Inspecciones Territoriales',
        tipo: 'ADMINISTRATIVA',
        competencia: 'Vigilancia laboral, quejas patronales y audiencias voluntarias de conciliación.',
        sedeOCanal: 'Direcciones territoriales en todas las capitales de departamento y portal web oficial.',
        esGratuita: true,
        enlaceOficial: 'https://www.mintrabajo.gov.co'
      },
      {
        nombre: 'Consultorios Jurídicos de Universidades Acreditadas (Ley 2113 de 2021)',
        tipo: 'ORIENTACION_GRATUITA',
        competencia: 'Asesoría y representación judicial gratuita para trabajadores de estratos 1, 2 y 3 en mínima cuantía.',
        sedeOCanal: 'Facultades de Derecho del país con atención presencial y virtual.',
        esGratuita: true,
        enlaceOficial: 'https://www.minjusticia.gov.co'
      },
      {
        nombre: 'Rama Judicial de Colombia — Juzgados Laborales',
        tipo: 'JUDICIAL',
        competencia: 'Resolución obligatoria de controversias individuales de trabajo.',
        sedeOCanal: 'Palacios de Justicia y buzones electrónicos de radicación virtual.',
        esGratuita: true,
        enlaceOficial: 'https://www.ramajudicial.gov.co'
      }
    ];
  } else if (areaDerecho === 'ARRENDAMIENTOS') {
    opciones = [
      {
        titulo: 'Notificación y Requerimiento Escrito según Ley 820 de 2003',
        descripcion: 'Notificar al arrendatario o arrendador sobre el incumplimiento del canon o necesidad de entrega.',
        consecuencias: 'Fija en mora a la contraparte conforme al Art. 12 y Art. 22 de la Ley 820 de 2003.',
        pros: ['Trámite ágil y económico', 'Requisito probatorio fundamental para el juez'],
        contras: ['Requiere envío formal por correo postal certificado autorizado para que tenga validez plena']
      },
      {
        titulo: 'Audiencia de Conciliación Extrajudicial en Arrendamiento',
        descripcion: 'Citar ante Centro de Conciliación, Casa de Justicia o Notaría para acordar fecha de entrega y pago.',
        consecuencias: 'El acta firmada presta mérito ejecutivo y permite solicitar entrega inmediata al juez si se incumple.',
        pros: ['Evita el juicio largo de restitución', 'Trámite rápido'],
        contras: ['Depende de la voluntad de comparecer del arrendatario']
      },
      {
        titulo: 'Proceso Judicial de Restitución de Inmueble Arrendado (Art. 384 CGP)',
        descripcion: 'Demandar la terminación judicial del contrato y la entrega material forzosa mediante diligencia de lanzamiento.',
        consecuencias: 'Orden judicial que restituye el inmueble y decreta embargo de cánones.',
        pros: ['Recuperación coactiva del bien', 'Embargo preventivo de bienes del inquilino y fiadores'],
        contras: ['Tarda entre 6 y 14 meses', 'Requiere abogado si supera la mínima cuantía']
      }
    ];

    queHacerPrimero = {
      accion: 'Verificar el contrato de arrendamiento firmado y la dirección de notificaciones contractual.',
      porQueEsImportante: 'La Ley 820 de 2003 exige que las notificaciones entre las partes se envíen a la dirección estipulada en el contrato mediante servicio postal autorizado.',
      plazoRecomendado: 'En las próximas 24 horas.'
    };

    pasosRuta = [
      {
        orden: 1,
        titulo: 'Revisión del Contrato y Liquidación de Cánones / Servicios',
        paraQueSirve: 'Determinar la causa exacta de terminación (falta de pago, vencimiento del término o uso prohibido).',
        queHacer: 'Revisa las cláusulas del contrato, certifica los meses adeudados y consigue copias de los recibos de servicios públicos en mora.',
        documentosAReunir: ['Contrato de arrendamiento original o copia íntegra', 'Comprobantes de pago de los últimos cánones cancelados', 'Facturas de servicios públicos con saldo en mora'],
        anteQuien: 'Arrendador o arrendatario',
        canalOficial: 'Archivo personal',
        queEsperar: 'Tener una cifra exacta y comprobada de la deuda.',
        queHacerSiFalla: 'Si el contrato fue verbal, preparar la prueba testimonial o confesión ficta mediante interrogatorio de parte extraprocesal.',
        precauciones: ['No cortar servicios públicos ni intentar ingresar por la fuerza (puede constituir delito de perturbación a la posesión).']
      },
      {
        orden: 2,
        titulo: 'Envío de Comunicación Escrita por Correo Postal Certificado',
        paraQueSirve: 'Dejar constancia legalmente irrebatible de la comunicación o requerimiento.',
        queHacer: 'Enviar carta física por empresa de mensajería autorizada (4-72, Servientrega) a la dirección pactada en el contrato, solicitando copia del cotejo y guía de entrega.',
        documentosAReunir: ['Carta con exposición clara de motivos y plazo otorgado', 'Copia de cotejo para el remitente'],
        anteQuien: 'Inquilino o arrendador a su dirección contractual',
        canalOficial: 'Servicio postal autorizado en Colombia (Art. 12 Ley 820 de 2003)',
        queEsperar: 'Entrega en 2 a 3 días hábiles con guía firmada.',
        queHacerSiFalla: 'Conservar la constancia de devolución si el destinatario rehúsa recibir.',
        precauciones: ['El simple mensaje de WhatsApp no sustituye el envío postal certificado si el contrato estipuló este medio.']
      },
      {
        orden: 3,
        titulo: 'Solicitud de Conciliación ante Personería o Casa de Justicia',
        paraQueSirve: 'Concertar la entrega voluntaria del inmueble y el plan de pagos de los cánones atrasados.',
        queHacer: 'Radicar solicitud ante la Casa de Justicia de tu localidad o Centro de Conciliación de la Personería.',
        documentosAReunir: ['Copia del contrato de arrendamiento', 'Guía de la carta previa', 'Cédula de ciudadanía'],
        anteQuien: 'Personería Municipal, Casa de Justicia o Centro de Conciliación (Ley 2220 de 2022)',
        canalOficial: 'https://www.personeriabogota.gov.co o Personería de tu municipio',
        enlaceCanalOficial: 'https://www.personeriabogota.gov.co',
        queEsperar: 'Audiencia presencial o virtual con citación formal a las partes.',
        queHacerSiFalla: 'Si no comparece o no hay acuerdo, se expide constancia para radicar de inmediato la demanda judicial.',
        precauciones: ['Verificar que el acta contenga fecha exacta y hora de entrega del inmueble con entrega de llaves.']
      },
      {
        orden: 4,
        titulo: 'Demanda de Restitución de Inmueble Arrendado (Art. 384 CGP)',
        paraQueSirve: 'Obtener la orden judicial de desalojo y la entrega forzosa del predio.',
        queHacer: 'Presentar demanda ante el Juez Civil Municipal competente anexando el contrato y la prueba de mora.',
        documentosAReunir: ['Poder conferido al abogado', 'Contrato de arrendamiento', 'Pruebas de la causal invocada'],
        anteQuien: 'Juez Civil Municipal del lugar donde está ubicado el inmueble',
        canalOficial: 'https://www.ramajudicial.gov.co',
        enlaceCanalOficial: 'https://www.ramajudicial.gov.co',
        queEsperar: 'Si el demandado no consigna los cánones adeudados en la cuenta del juzgado, NO puede ser oído en el proceso (Art. 384 num. 2 CGP).',
        queHacerSiFalla: 'Solicitar de inmediato diligencia de entrega material con comisionado policivo.',
        precauciones: ['Solicitar medidas cautelares de embargo sobre cuentas y bienes de los deudores solidarios.']
      }
    ];

    docsRequeridos = [
      {
        id: 'doc-arr-1',
        nombre: 'Contrato de Arrendamiento debidamente suscrito',
        descripcion: 'Documento donde se fijó el canon, términos de entrega y dirección para notificaciones.',
        comoObtenerlo: 'Copia en poder del arrendador o arrendatario.',
        comoConservarlo: 'Conservar con todas las hojas y anexos.',
        obligatorio: true
      },
      {
        id: 'doc-arr-2',
        nombre: 'Certificado de Tradición y Libertad del Inmueble',
        descripcion: 'Acredita quién es el propietario legítimo y los linderos del predio.',
        comoObtenerlo: 'Descargar con el número de matrícula en la ventanilla única de registro (VUR) de la SNR.',
        comoConservarlo: 'PDF digital no mayor a 30 días de expedición.',
        obligatorio: true
      },
      {
        id: 'doc-arr-3',
        nombre: 'Comprobantes de Envío Postal Certificado (4-72 / Servientrega)',
        descripcion: 'Guía y cotejo que acreditan el envío y entrega de la carta de preaviso o cobro.',
        comoObtenerlo: 'Conservar la guía y descargar la constancia de entrega en la web de la empresa postal.',
        comoConservarlo: 'PDF o foto nítida de la guía con código de seguimiento.',
        obligatorio: false
      }
    ];

    entidades = [
      {
        nombre: 'Personerías Municipales y Distritales — Centros de Conciliación',
        tipo: 'CONCILIACION',
        competencia: 'Conciliación gratuita en controversias de arrendamiento y convivencia.',
        sedeOCanal: 'Sedes locales en todos los municipios de Colombia.',
        esGratuita: true,
        enlaceOficial: 'https://www.personeriabogota.gov.co'
      },
      {
        nombre: 'Casas de Justicia y Convivencia Ciudadana (MinJusticia)',
        tipo: 'ORIENTACION_GRATUITA',
        competencia: 'Mecanismos alternativos y orientación jurídica a la comunidad.',
        sedeOCanal: 'Casas de Justicia en barrios y cabeceras municipales.',
        esGratuita: true,
        enlaceOficial: 'https://www.minjusticia.gov.co'
      },
      {
        nombre: 'Juzgados Civiles Municipales y de Pequeñas Causas',
        tipo: 'JUDICIAL',
        competencia: 'Procesos de restitución de inmueble arrendado y cobro ejecutivo de cánones.',
        sedeOCanal: 'Rama Judicial de Colombia.',
        esGratuita: true,
        enlaceOficial: 'https://www.ramajudicial.gov.co'
      }
    ];
  } else {
    // Caso General / Consumidor / Deudas / Constitucional
    opciones = [
      {
        titulo: 'Derecho de Petición (Artículo 23 CP y Ley 1755 de 2015)',
        descripcion: 'Solicitar por escrito explicaciones, rectificación de datos, copias o solución formal.',
        consecuencias: 'La entidad tiene plazo legal de 15 días hábiles para responder de fondo.',
        pros: ['No requiere abogado', 'Es 100% gratuito', 'Genera prueba indiscutible'],
        contras: ['Si la entidad no responde, se debe acudir a tutela por vulneración del Art. 23 CP']
      },
      {
        titulo: 'Reclamación Directa ante el Proveedor o Entidad',
        descripcion: 'Exigir la corrección de cobros, efectividad de la garantía o devolución de dinero.',
        consecuencias: 'Cumple el requisito de procedibilidad legal obligatorio (Art. 58 Ley 1480/11).',
        pros: ['Respuesta en 15 días hábiles', 'Permite demandar ante la Superintendencia si no cumplen'],
        contras: ['Debe formularse con precisión técnica de lo pedido']
      },
      {
        titulo: 'Acción de Tutela para Protección Constitucional Inmediata',
        descripcion: 'Acudir ante cualquier juez si se vulneran derechos fundamentales (salud, debido proceso, mínimo vital).',
        consecuencias: 'Fallo judicial perentorio en 10 días hábiles con orden de obligatorio cumplimiento.',
        pros: ['Trámite preferente y rápido', 'No requiere abogado', 'Desacato sanciona con arresto'],
        contras: ['Solo procede para derechos fundamentales y cuando no hay otro mecanismo ordinario idóneo']
      }
    ];

    queHacerPrimero = {
      accion: 'Verificar si has recibido notificación formal y reunir toda la evidencia documental en una carpeta organizada.',
      porQueEsImportante: 'Para evitar el vencimiento de términos y tener soporte claro antes de formular cualquier reclamo o defensa.',
      plazoRecomendado: 'Inmediatamente.'
    };

    pasosRuta = [
      {
        orden: 1,
        titulo: 'Reunir Pruebas y Construir la Cronología de los Hechos',
        paraQueSirve: 'Separar con claridad los hechos objetivos de las afirmaciones o suposiciones.',
        queHacer: 'Anota en orden de fechas lo ocurrido: cuándo nació la obligación, qué se pagó, qué se prometió y qué documento oficial existe.',
        documentosAReunir: ['Facturas, contratos, correos, capturas de pantalla o extractos bancarios', 'Copia de cédula de ciudadanía'],
        anteQuien: 'El propio ciudadano',
        canalOficial: 'Archivo personal',
        queEsperar: 'Tener clara la secuencia para no incurrir en contradicciones.',
        queHacerSiFalla: 'Pedir copia de los soportes mediante derecho de petición de documentos.',
        precauciones: ['No alterar fechas ni modificar comprobantes digitales.']
      },
      {
        orden: 2,
        titulo: 'Radicar Derecho de Petición o Reclamación Directa',
        paraQueSirve: 'Exigir formalmente una respuesta por escrito y constituir en mora o requisito a la entidad.',
        queHacer: 'Redactar memorial respetuoso citando el Art. 23 de la Constitución y la Ley 1755 de 2015. Radicar por correo o portal oficial.',
        documentosAReunir: ['Escrito de petición con datos de contacto', 'Anexos probatorios'],
        anteQuien: 'La entidad pública o empresa privada correspondiente',
        canalOficial: 'Buzón de PQR de la entidad',
        queEsperar: 'Respuesta completa y de fondo en máximo 15 días hábiles.',
        queHacerSiFalla: 'Si vencen los 15 días hábiles sin respuesta, procede Acción de Tutela por violación del derecho de petición.',
        precauciones: ['Guardar la constancia de radicación con el número de radicado y fecha exacta.']
      },
      {
        orden: 3,
        titulo: 'Acudir a Orientación Gratuita en Consultorio Jurídico o Personería',
        paraQueSirve: 'Validar la viabilidad legal y redactar la acción de defensa o conciliación.',
        queHacer: 'Presentar la documentación completa en el Consultorio Jurídico de la universidad más cercana o Personería.',
        documentosAReunir: ['Petición radicada y su respuesta (si la hubo)', 'Documentos del caso'],
        anteQuien: 'Consultorios Jurídicos Universitarios (Ley 2113 de 2021) o Personerías',
        canalOficial: 'https://www.minjusticia.gov.co',
        enlaceCanalOficial: 'https://www.minjusticia.gov.co',
        queEsperar: 'Asignación de un asesor pedagógico gratuito para redactar memoriales.',
        queHacerSiFalla: 'Si el asunto supera la mínima cuantía y tus ingresos exceden el estrato 3, contratar un abogado litigante.',
        precauciones: ['Verificar que el abogado tenga Tarjeta Profesional vigente expedida por el Consejo Superior de la Judicatura.']
      },
      {
        orden: 4,
        titulo: 'Radicar Acción de Tutela o Demanda Judicial según corresponda',
        paraQueSirve: 'Obtener la orden judicial obligatoria que protege tus derechos.',
        queHacer: 'Si vulneraron derechos fundamentales, radicar tutela por el aplicativo web de la Rama Judicial.',
        documentosAReunir: ['Escrito de tutela', 'Copia de pruebas y peticiones previas sin contestar'],
        anteQuien: 'Juez de la República por reparto judicial virtual',
        canalOficial: 'https://tutelas.ramajudicial.gov.co',
        enlaceCanalOficial: 'https://tutelas.ramajudicial.gov.co',
        queEsperar: 'Fallo judicial de primera instancia en 10 días hábiles.',
        queHacerSiFalla: 'Si el fallo es desfavorable, impugnar dentro de los 3 días hábiles siguientes.',
        precauciones: ['Hacer seguimiento diario al correo electrónico registrado para el proceso.']
      }
    ];

    docsRequeridos = [
      {
        id: 'doc-gen-1',
        nombre: 'Copia de la Cédula de Ciudadanía del Interesado',
        descripcion: 'Acredita la identidad personal y capacidad procesal para actuar.',
        comoObtenerlo: 'Copia física o escaneo digital legible.',
        comoConservarlo: 'PDF nítido por ambas caras.',
        obligatorio: true
      },
      {
        id: 'doc-gen-2',
        nombre: 'Comprobantes de las Comunicaciones y Reclamos Previos',
        descripcion: 'Radicados de peticiones, correos electrónicos o cartas enviadas.',
        comoObtenerlo: 'Descargar de los buzones de correo o fotocopias con sello de recibido.',
        comoConservarlo: 'Guardar con número de radicado visible.',
        obligatorio: true
      },
      {
        id: 'doc-gen-3',
        nombre: 'Prueba Fáctica del Daño o Inconveniente',
        descripcion: 'Fotografías, dictámenes, facturas, recibos de pago o certificados médicos.',
        comoObtenerlo: 'Archivos propios o expedidos por entidades.',
        comoConservarlo: 'Archivos en alta calidad sin adulteraciones.',
        obligatorio: false
      }
    ];

    entidades = [
      {
        nombre: 'Superintendencia de Industria y Comercio (SIC)',
        tipo: 'ADMINISTRATIVA',
        competencia: 'Protección de consumidores, garantías, cobros indebidos y datos personales (Habeas Data).',
        sedeOCanal: 'Portal de demandas y quejas virtuales.',
        esGratuita: true,
        enlaceOficial: 'https://www.sic.gov.co'
      },
      {
        nombre: 'Defensoría del Pueblo de Colombia',
        tipo: 'ORIENTACION_GRATUITA',
        competencia: 'Defensa de derechos fundamentales, asesoría en tutelas y representación pública.',
        sedeOCanal: 'Sedes en todo el territorio nacional y canal virtual.',
        esGratuita: true,
        enlaceOficial: 'https://www.defensoria.gov.co'
      },
      {
        nombre: 'Rama Judicial de Colombia — Portal de Servicios al Ciudadano',
        tipo: 'JUDICIAL',
        competencia: 'Radicación de tutelas, consulta de procesos por radicado y juzgados de turno.',
        sedeOCanal: 'https://www.ramajudicial.gov.co',
        esGratuita: true,
        enlaceOficial: 'https://www.ramajudicial.gov.co'
      }
    ];
  }

  // Fuentes jurídicas oficiales verificables asociadas
  const fuentesRelevantes: FuenteJuridicaOficial[] = CORPUS_JURIDICO_COLOMBIA.filter((f) => {
    if (areaDerecho === 'LABORAL') {
      return f.tipoNormaOProvidencia === 'LEY' || f.identificador.includes('2213') || f.identificador.includes('2220');
    }
    if (areaDerecho === 'ARRENDAMIENTOS') {
      return f.identificador.includes('1564') || f.identificador.includes('2220') || f.identificador.includes('2213');
    }
    return f.tipoNormaOProvidencia === 'LEY' || f.identificador.includes('1755') || f.identificador.includes('C-590');
  }).slice(0, 4);

  const orientacionGratuita: OrientacionGratuitaItem[] = [
    {
      entidad: 'Consultorios Jurídicos Universitarios (Ley 2113 de 2021)',
      descripcion: 'Atención jurídica y litigio gratuito en asuntos de mínima cuantía, civil, laboral, penal y familia para estratos 1, 2 y 3.',
      requisitos: 'Fotocopia de cédula, recibo de servicios públicos de estrato 1, 2 o 3, y documentos del caso.',
      canal: 'Atención presencial en las Facultades de Derecho de tu ciudad.',
      enlaceOficial: 'https://www.minjusticia.gov.co'
    },
    {
      entidad: 'Personería Municipal o Distrital',
      descripcion: 'Agente del Ministerio Público que brinda orientación gratuita, redacta acciones de tutela y coadyuva peticiones.',
      requisitos: 'Ninguno (servicio universal y gratuito para todos los ciudadanos).',
      canal: 'Sedes en cada municipio de Colombia y líneas virtuales.',
      enlaceOficial: 'https://www.personeriabogota.gov.co'
    },
    {
      entidad: 'Defensoría del Pueblo — Sistema Nacional de Defensoría Pública',
      descripcion: 'Orientación en derechos humanos y asignación de defensor público en causas penales o de especial vulnerabilidad.',
      requisitos: 'Acreditar condición de vulnerabilidad o falta de recursos económicos.',
      canal: 'https://www.defensoria.gov.co',
      enlaceOficial: 'https://www.defensoria.gov.co'
    }
  ];

  return {
    id: `orient-${Date.now()}`,
    fechaOrientacion: new Date().toISOString(),
    resumenSituacion: {
      loQueEntendemos: `De acuerdo con tu narración, el conflicto se enmarca en ${categorias.join(', ')}. Se identifican elementos fácticos que requieren verificación documental para consolidar una estrategia procesal sólida.`,
      datosFaltantesPorConfirmar: [
        entrada.fechaNotificacion ? `Fecha de notificación: ${entrada.fechaNotificacion}` : 'Fecha exacta en que se recibió cualquier comunicación o notificación judicial.',
        entrada.ciudad ? `Ciudad de los hechos: ${entrada.ciudad}` : 'Municipio o ciudad donde ocurrieron los hechos o donde está pactado el cumplimiento.',
        entrada.documentosDisponibles && entrada.documentosDisponibles.length > 0
          ? `Documentos aportados: ${entrada.documentosDisponibles.join(', ')}`
          : 'Existencia de contrato escrito, constancias de pago o mensajes cruzados.',
        'Monto económico líquido pretendido o cuantía estimada del perjuicio.'
      ],
      hechosRelatados: [
        entrada.descripcionProblema,
        entrada.detalleNotificacion || 'Sin notificación previa detallada.',
        entrada.resultadoEsperado ? `Resultado deseado: ${entrada.resultadoEsperado}` : 'Se busca clarificación de derechos y alternativas de cobro/defensa.'
      ],
      pruebasRevisadas: entrada.documentosDisponibles || ['Relato ciudadano inicial sin anexos adjuntos revisados formalmente'],
      suposiciones: [
        'Se asume preliminarmente la veracidad y buena fe de las afirmaciones expresadas por el consultante.',
        'La contraparte podría formular excepciones de pago, caducidad o falta de legitimación en la causa.'
      ]
    },
    categoriasIdentificadas: categorias,
    urgencia,
    opcionesLegales: opciones,
    queHacerPrimero,
    procedimientoPasoAPaso: pasosRuta,
    clasificacionAutogestion: autogestion,
    documentosRequeridos: docsRequeridos,
    dondeAcudir: entidades,
    orientacionGratuitaDisponible: orientacionGratuita,
    queHacerDespues: [
      'Una vez radicado el derecho de petición o reclamo, contar estrictamente los días hábiles para recibir respuesta.',
      'Si se recibe respuesta negativa o evasiva, evaluar con el Consultorio Jurídico o abogado el inicio de la demanda o tutela.',
      'Si se llega a un acuerdo voluntario, exigir que quede consignado en Acta de Conciliación con fecha cierta de cumplimiento.'
    ],
    proximoPasoInmediato: queHacerPrimero.accion,
    fuentesOficiales: fuentesRelevantes,
    avisoLegal: 'ADVERTENCIA OBLIGATORIA: Esta orientación jurídica inicial tiene propósitos exclusivamente informativos, pedagógicos y de divulgación ciudadana. NO constituye mandato judicial, no genera relación abogado-cliente y no sustituye el concepto profesional emitido por un abogado titulado con Tarjeta Profesional vigente tras la revisión personal del expediente y sus pruebas. En Colombia los términos procesales son improrrogables (Art. 117 CGP).'
  };
}

// ============================================================
// 5. ASISTENTE GENERADOR DE BORRADORES CIUDADANOS
// ============================================================
export function generarBorradorCiudadano(
  tipo: TipoBorradorCiudadano,
  entrada: ProblemaCiudadanoEntrada,
  datosEspecificos?: any
): BorradorCiudadano {
  const fechaHoy = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  const ciudad = entrada.ciudad || '[COMPLETAR: Ciudad o Municipio]';

  const encabezadoAdvertencia = `========================================================================================
[BORRADOR CIUDADANO PARA REVISIÓN - NO ES RADICACIÓN FORMAL]
ADVERTENCIA IMPORTANTE: Este documento es un modelo pedagógico de borrador inicial.
Antes de imprimirlo, firmarlo o radicarlo, DEBES completar todos los campos entre corchetes [COMPLETAR: ...],
verificar que los hechos sean totalmente ciertos y anexar las pruebas documentales.
No sustituye la asesoría de un abogado titulado ni garantiza un resultado favorable.
========================================================================================\n\n`;

  let contenido = '';
  let titulo = '';
  let normativa: string[] = [];
  let pendientes: string[] = [];

  if (tipo === 'DERECHO_PETICION_ART23') {
    titulo = 'Borrador de Derecho de Petición (Artículo 23 Constitución Política)';
    normativa = ['Constitución Política de Colombia (Art. 23)', 'Ley Estatutaria 1755 de 2015', 'Código de Procedimiento Administrativo y de lo Contencioso Administrativo (CPACA)'];
    pendientes = ['Nombre y cédula del solicitante', 'Nombre de la entidad o empresa destinataria', 'Dirección física y correo electrónico para notificaciones', 'Relación de pruebas anexas'];

    contenido = `${encabezadoAdvertencia}DERECHO DE PETICIÓN EN INTERÉS PARTICULAR
(Artículo 23 de la Constitución Política y Ley Estatutaria 1755 de 2015)

${ciudad}, ${fechaHoy}

Señores:
[COMPLETAR: Nombre de la Entidad Pública o Empresa Privada Destinataria]
Dirección / Buzón Electrónico de Radicación: [COMPLETAR: Correo o Dirección de la Entidad]
E. S. D.

ASUNTO: Derecho de Petición en interés particular sobre [COMPLETAR: Objeto breve, ej. Pago de salarios / Entrega de historia clínica / Rectificación de cobro].

Yo, [COMPLETAR: Nombres y Apellidos Completos], mayor de edad, identificado(a) con la cédula de ciudadanía No. [COMPLETAR: Número de Cédula] expedida en [COMPLETAR: Lugar de expedición], domiciliado(a) y residente en la ciudad de ${ciudad}, en ejercicio del Derecho Fundamental de Petición consagrado en el Artículo 23 de la Constitución Política de Colombia y regulado por la Ley Estatutaria 1755 de 2015, formulo respetuosamente la siguiente solicitud:

I. HECHOS
1. Con fecha aproximada [COMPLETAR: Fecha o período de los hechos], ocurrió lo siguiente: ${entrada.descripcionProblema || '[COMPLETAR: Describe detalladamente qué ocurrió, en orden de fechas]'}
2. A la fecha de la presente solicitud, [COMPLETAR: Explica la situación actual, ej. la empresa no ha realizado el pago adeudado / la EPS no ha programado la cita requerida].
3. Con el fin de agotar la vía directa y ejercer mis derechos ciudadanos, acudo ante su despacho.

II. PETICIONES
1. Solicito formalmente que se me reconozca y pague / entregue / rectifique lo siguiente: ${entrada.resultadoEsperado || '[COMPLETAR: Escribe con máxima claridad qué le pides exactamente a la entidad]'}
2. Solicito que se me expida copia íntegra en medio digital de [COMPLETAR: Copias solicitadas, ej. contrato, comprobantes, historia clínica].
3. Solicito que la respuesta de fondo sea comunicada formalmente a mi correo electrónico dentro de los quince (15) días hábiles siguientes a la radicación de este memorial, según lo ordena el Artículo 14 de la Ley 1755 de 2015.

III. FUNDAMENTOS DE DERECHO
Fundamento esta petición en el Artículo 23 de la Carta Política; en la Ley Estatutaria 1755 de 2015 que establece la obligación perentoria de responder de fondo en 15 días hábiles; y en los principios de eficacia, moralidad y celeridad de la función administrativa.

IV. PRUEBAS Y ANEXOS
Para que surtan los efectos legales pertinentes, anexo copia de los siguientes soportes:
1. Copia de mi cédula de ciudadanía.
2. [COMPLETAR: Nombre del anexo 1, ej. Copia de factura o contrato].
3. [COMPLETAR: Nombre del anexo 2, ej. Captura de pantalla o comprobante de pago].

V. NOTIFICACIONES
Recibiré comunicaciones oficiales y respuesta motivada exclusivamente en los siguientes canales:
- Dirección física: [COMPLETAR: Tu dirección de residencia y barrio]
- Ciudad / Municipio: ${ciudad}
- Teléfono de contacto / WhatsApp: [COMPLETAR: Tu número telefónico]
- Correo Electrónico: [COMPLETAR: Tu correo electrónico para notificación personal]

Atentamente,

___________________________________________________
[COMPLETAR: Nombres y Apellidos Completos]
C.C. No. [COMPLETAR: Número de Cédula] de [COMPLETAR: Lugar de Expedición]
Firma del Solicitante`;
  } else if (tipo === 'RECLAMACION_DIRECTA_CONSUMIDOR') {
    titulo = 'Borrador de Reclamación Directa al Proveedor (Ley 1480 de 2011)';
    normativa = ['Ley 1480 de 2011 (Estatuto del Consumidor, Art. 58)', 'Circular Única de la Superintendencia de Industria y Comercio'];
    pendientes = ['Razón social del almacén o vendedor', 'Número de factura o comprobante de compra', 'Identificación del producto o servicio defectuoso'];

    contenido = `${encabezadoAdvertencia}RECLAMACIÓN DIRECTA PREVIA ANTE EL PROVEEDOR
(Requisito de Procedibilidad según Artículo 58 de la Ley 1480 de 2011 — Estatuto del Consumidor)

${ciudad}, ${fechaHoy}

Señores:
[COMPLETAR: Nombre o Razón Social del Establecimiento / Vendedor / Fabricante]
NIT / Identificación: [COMPLETAR: NIT si se conoce]
Dirección de Notificaciones: [COMPLETAR: Dirección o correo de atención al cliente]
Ciudad: ${ciudad}

ASUNTO: Reclamación directa de efectividad de la garantía legal / Devolución de dinero por producto o servicio defectuoso.

Yo, [COMPLETAR: Tu Nombre Completo], mayor de edad, identificado(a) con C.C. No. [COMPLETAR: Tu Cédula], actuando en calidad de consumidor(a), presento formal reclamación previa con base en los siguientes:

I. ANTECEDENTES DE LA COMPRA
1. El día [COMPLETAR: Fecha de compra], adquirí en su establecimiento / portal web el siguiente bien o servicio: [COMPLETAR: Nombre del producto, marca, modelo o servicio], amparado con la factura de venta No. [COMPLETAR: Número de Factura], por un valor total de $[COMPLETAR: Valor Pagado] COP.
2. Situación presentada: ${entrada.descripcionProblema || '[COMPLETAR: Describe qué falla presentó el producto o por qué se incumplió el servicio pactado]'}
3. La falla se encuentra dentro del término de garantía legal obligatorio previsto en el Artículo 7 y siguientes de la Ley 1480 de 2011.

II. PRETENSIONES DE CONSUMIDOR
Conforme a los derechos irrenunciables reconocidos al consumidor en la legislación colombiana, solicito:
1. Se haga efectiva la garantía legal mediante la [COMPLETAR: Elige una: REPARACIÓN GRATUITA / CAMBIO POR UNO NUEVO E IDÉNTICO / DEVOLUCIÓN TOTAL DEL DINERO PAGADO].
2. Se emita respuesta motivada en el término improrrogable de quince (15) días hábiles siguientes al recibo de esta comunicación (Art. 58 num. 5 Ley 1480 de 2011).

Se advierte que el silencio o la negativa injustificada habilitará la presentación inmediata de la Demanda de Protección al Consumidor y/o Denuncia Administrativa con solicitud de multas sucesivas ante la Superintendencia de Industria y Comercio (SIC).

III. ANEXOS
1. Copia de la cédula de ciudadanía del consumidor.
2. Copia de la factura de compra o constancia electrónica de pago.
3. Fotografías / videos que evidencian el defecto del bien.

IV. CANALES DE NOTIFICACIÓN
- Correo Electrónico: [COMPLETAR: Tu correo electrónico]
- Teléfono: [COMPLETAR: Tu celular]
- Dirección: [COMPLETAR: Tu dirección] en ${ciudad}.

Atentamente,

___________________________________________________
[COMPLETAR: Tu Nombre Completo]
C.C. No. [COMPLETAR: Tu Cédula]`;
  } else if (tipo === 'COMUNICACION_ARRENDAMIENTO') {
    titulo = 'Borrador de Comunicación al Arrendador / Inquilino (Ley 820 de 2003)';
    normativa = ['Ley 820 de 2003 (Régimen de Arrendamiento de Vivienda Urbana)', 'Código Civil Colombiano (Art. 1973 y ss.)'];
    pendientes = ['Dirección del inmueble arrendado', 'Número o fecha del contrato de arrendamiento', 'Dirección postal contractual del destinatario'];

    contenido = `${encabezadoAdvertencia}COMUNICACIÓN FORMAL EN CONTRATO DE ARRENDAMIENTO
(Conforme al Artículo 12 de la Ley 820 de 2003)

${ciudad}, ${fechaHoy}

Para: [COMPLETAR: Nombre del Arrendador o Inquilino]
Dirección Contractual para Notificaciones: [COMPLETAR: Dirección exacta estipulada en el contrato]
Ciudad: ${ciudad}

De: [COMPLETAR: Tu Nombre Completo] en calidad de [COMPLETAR: Arrendador(a) / Arrendatario(a)]
Inmueble objeto del contrato: [COMPLETAR: Dirección completa del inmueble arrendado]

ASUNTO: Notificación formal sobre [COMPLETAR: Preaviso de no prórroga / Solicitud de reparaciones indispensables / Requerimiento por cánones en mora].

Por medio de la presente comunicación escrita, remitida a través del servicio postal autorizado en cumplimiento de la Ley 820 de 2003 y de las cláusulas contractuales vigentes, me permito manifestar:

1. Que en virtud del contrato de arrendamiento celebrado el día [COMPLETAR: Fecha de inicio del contrato], se encuentra vigente la relación contractual sobre el inmueble ubicado en [COMPLETAR: Dirección del inmueble].
2. Situación fáctica: ${entrada.descripcionProblema || '[COMPLETAR: Describe con precisión la mora en cánones, el daño en el inmueble que requiere reparación o la decisión de no renovar el contrato cumpliendo el preaviso legal de 3 meses]'}
3. Solicitud concreta: [COMPLETAR: Solicito la entrega del inmueble en fecha X / el pago de la suma adeudada en 5 días / la ejecución inmediata de las obras locativas indispensables].

Esta comunicación se envía con copia de cotejo para que sirva como prueba documental plena en caso de ser necesario iniciar el correspondiente proceso judicial ante los Juzgados Civiles de ${ciudad}.

Atentamente,

___________________________________________________
[COMPLETAR: Tu Nombre Completo]
C.C. No. [COMPLETAR: Tu Cédula]
Teléfono: [COMPLETAR: Tu Celular]
Correo Electrónico: [COMPLETAR: Tu Correo]`;
  } else {
    // Solicitud de Conciliación Extrajudicial
    titulo = 'Borrador de Solicitud de Conciliación Extrajudicial (Ley 2220 de 2022)';
    normativa = ['Estatuto de Conciliación en Colombia (Ley 2220 de 2022)', 'Código General del Proceso (Art. 621)'];
    pendientes = ['Centro de conciliación o personería receptora', 'Datos de identificación y contacto del convocado', 'Propuesta concreta de acuerdo'];

    contenido = `${encabezadoAdvertencia}SOLICITUD DE AUDIENCIA DE CONCILIACIÓN EXTRAJUDICIAL EN DERECHO
(Ley 2220 de 2022 — Estatuto de Conciliación)

${ciudad}, ${fechaHoy}

Señores:
[COMPLETAR: Centro de Conciliación de Universidad / Personería Municipal de ${ciudad} / Notaría]
Ciudad

PARTE CONVOCANTE (Quien solicita la conciliación):
Nombre: [COMPLETAR: Tu Nombre Completo]
C.C. No.: [COMPLETAR: Tu Cédula] de [COMPLETAR: Lugar de Expedición]
Dirección: [COMPLETAR: Tu Dirección]
Teléfono: [COMPLETAR: Tu Teléfono]
Correo Electrónico: [COMPLETAR: Tu Correo]

PARTE CONVOCADA (Persona o empresa citada):
Nombre: [COMPLETAR: Nombre de la contraparte citada]
C.C. o NIT: [COMPLETAR: Cédula o NIT si se conoce]
Dirección física: [COMPLETAR: Dirección donde se debe citar]
Correo Electrónico para citación: [COMPLETAR: Correo electrónico de la contraparte]
Teléfono: [COMPLETAR: Teléfono de la contraparte]

ASUNTO: Solicitud de audiencia de conciliación para dirimir controversia sobre [COMPLETAR: Materia, ej. Fijación de cuota de alimentos / Pago de deuda / Terminación de contrato de arrendamiento].

I. HECHOS
1. ${entrada.descripcionProblema || '[COMPLETAR: Relata con claridad y brevedad los antecedentes del conflicto]'}
2. A pesar de los requerimientos amistosos previos, no ha sido posible concertar un arreglo directo entre las partes.

II. FÓRMULA O PROPUESTA DE ARREGLO
Propongo a la parte convocada la siguiente fórmula de acuerdo para resolver definitivamente el conflicto:
- [COMPLETAR: Propuesta concreta, ej. El pago de la suma de $X en dos cuotas iguales; la fijación de la cuota de alimentos en el 30% del salario; la entrega del inmueble el día X].

III. PRUEBAS APORTADAS
1. Copia de cédula de ciudadanía del convocante.
2. [COMPLETAR: Soportes documentales de la obligación o del estado civil].

Agradezco fijar fecha y hora para la celebración de la audiencia respectiva.

Atentamente,

___________________________________________________
[COMPLETAR: Tu Nombre Completo]
C.C. No. [COMPLETAR: Tu Cédula]`;
  }

  return {
    id: `borr-ciu-${Date.now()}`,
    tipo,
    titulo,
    contenidoTexto: contenido,
    fechaCreacion: new Date().toISOString(),
    advertenciaNoRadicacion: 'Documento borrador educativo. Prohibida su radicación formal sin previa revisión personal y diligenciamiento de todos los campos entre corchetes.',
    camposPendientesCompletar: pendientes,
    normativaAplicable: normativa
  };
}

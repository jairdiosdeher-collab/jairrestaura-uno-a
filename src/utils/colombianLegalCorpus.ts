/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — CORPUS JURÍDICO OFICIAL COLOMBIANO
 * Normas orgánicas y sentencias hito con fuentes oficiales verificables (SUIN-Juriscol, Relatoría Corte Constitucional, CSJ, Consejo de Estado).
 */

import { FuenteJuridicaOficial } from '../types/legal';

export const CORPUS_JURIDICO_COLOMBIA: FuenteJuridicaOficial[] = [
  {
    id: 'norma-cp1991',
    nombreFuente: 'SUIN_JURISCOL',
    tipoNormaOProvidencia: 'CONSTITUCION',
    identificador: 'Constitución Política de Colombia de 1991',
    autoridadEmisora: 'Asamblea Nacional Constituyente',
    fechaExpedicion: '1991-07-07',
    epigrafeOTitulo: 'Constitución Política de Colombia',
    articulosOFundamentosClave: 'Art. 23 (Derecho de Petición), Art. 29 (Debido Proceso), Art. 86 (Acción de Tutela), Art. 228 (Administración de Justicia)',
    enlaceVerificado: 'http://www.suin-juriscol.gov.co/viewDocument.asp?ruta=Constitucion/1687988',
    estadoVigenciaComprobado: 'VIGENTE',
    fechaUltimaConsulta: '2026-10-28',
    resumenExtracto: 'Norma de normas. Consagra los derechos fundamentales, las acciones constitucionales de protección inmediata y las garantías sustanciales y procesales de acceso a la justicia.',
    materias: ['Constitucional', 'Derechos Fundamentales', 'Debido Proceso']
  },
  {
    id: 'norma-cgp-1564',
    nombreFuente: 'SUIN_JURISCOL',
    tipoNormaOProvidencia: 'LEY',
    identificador: 'Ley 1564 de 2012',
    autoridadEmisora: 'Congreso de la República de Colombia',
    fechaExpedicion: '2012-07-12',
    epigrafeOTitulo: 'Código General del Proceso (CGP)',
    articulosOFundamentosClave: 'Art. 82 (Requisitos de la demanda), Art. 117-121 (Términos procesales y duración del proceso), Art. 206 (Juramento estimatorio), Art. 372-373 (Audiencia inicial y de instrucción)',
    enlaceVerificado: 'http://www.suin-juriscol.gov.co/viewDocument.asp?ruta=Leyes/1684370',
    estadoVigenciaComprobado: 'VIGENTE',
    fechaUltimaConsulta: '2026-10-28',
    resumenExtracto: 'Regula los procesos civiles, comerciales, de familia y agrarios. Establece el sistema oral y por audiencias, las cargas probatorias y los términos perentorios procesales.',
    materias: ['Civil', 'Comercial', 'Procedimiento', 'Familia']
  },
  {
    id: 'norma-ley2213',
    nombreFuente: 'SUIN_JURISCOL',
    tipoNormaOProvidencia: 'LEY',
    identificador: 'Ley 2213 de 2022',
    autoridadEmisora: 'Congreso de la República de Colombia',
    fechaExpedicion: '2022-06-13',
    epigrafeOTitulo: 'Uso de las tecnologías de la información y las comunicaciones en las actuaciones judiciales (Permanencia Decreto 806 de 2020)',
    articulosOFundamentosClave: 'Art. 3 (Deberes procesales digitales), Art. 6 (Demanda electrónica), Art. 8 (Notificaciones personales por mensaje de datos y término de 2 días hábiles)',
    enlaceVerificado: 'http://www.suin-juriscol.gov.co/viewDocument.asp?ruta=Leyes/30044569',
    estadoVigenciaComprobado: 'VIGENTE',
    fechaUltimaConsulta: '2026-10-28',
    resumenExtracto: 'Adopta como legislación permanente las normas del Decreto Legislativo 806 de 2020. Reglamenta el envío simultáneo de la demanda y sus anexos al demandado y la validez de los poderes conferidos mediante mensaje de datos sin necesidad de presentación personal.',
    materias: ['Tecnologías Judiciales', 'Notificaciones', 'Poderes', 'Procesal']
  },
  {
    id: 'norma-cpaca-1437-2080',
    nombreFuente: 'SUIN_JURISCOL',
    tipoNormaOProvidencia: 'LEY',
    identificador: 'Ley 1437 de 2011 (Modificada por Ley 2080 de 2021)',
    autoridadEmisora: 'Congreso de la República de Colombia',
    fechaExpedicion: '2011-01-18',
    epigrafeOTitulo: 'Código de Procedimiento Administrativo y de lo Contencioso Administrativo (CPACA)',
    articulosOFundamentosClave: 'Art. 135-148 (Medios de control: Nulidad, Nulidad y Restablecimiento del Derecho, Reparación Directa, Controversias Contractuales), Art. 164 (Oportunidad para demandar y caducidad)',
    enlaceVerificado: 'http://www.suin-juriscol.gov.co/viewDocument.asp?ruta=Leyes/1681347',
    estadoVigenciaComprobado: 'VIGENTE',
    fechaUltimaConsulta: '2026-10-28',
    resumenExtracto: 'Regula las actuaciones administrativas, el procedimiento administrativo sancionatorio y el trámite de los procesos ante la jurisdicción contencioso-administrativa, fortaleciendo el sistema mixto e incorporando las reformas de la Ley 2080.',
    materias: ['Administrativo', 'Contencioso', 'Caducidad', 'Medios de Control']
  },
  {
    id: 'norma-ley1755',
    nombreFuente: 'SUIN_JURISCOL',
    tipoNormaOProvidencia: 'LEY',
    identificador: 'Ley Estatutaria 1755 de 2015',
    autoridadEmisora: 'Congreso de la República de Colombia',
    fechaExpedicion: '2015-06-30',
    epigrafeOTitulo: 'Por medio de la cual se regula el Derecho Fundamental de Petición y se sustituye un título del CPACA',
    articulosOFundamentosClave: 'Art. 13 (Objeto y modalidades), Art. 14 (Términos: 15 días generales, 10 días peticiones de documentos o información, 30 días consultas), Art. 21 (Peticiones irrespetuosas u oscuras)',
    enlaceVerificado: 'http://www.suin-juriscol.gov.co/viewDocument.asp?ruta=Leyes/30019888',
    estadoVigenciaComprobado: 'VIGENTE',
    fechaUltimaConsulta: '2026-10-28',
    resumenExtracto: 'Estatuto del derecho fundamental de petición ante autoridades públicas y organizaciones o personas privadas. Establece plazos improrrogables y consecuencias disciplinarias ante el silencio administrativo.',
    materias: ['Derecho de Petición', 'Constitucional', 'Administrativo']
  },
  {
    id: 'norma-ley1581',
    nombreFuente: 'SUIN_JURISCOL',
    tipoNormaOProvidencia: 'LEY',
    identificador: 'Ley Estatutaria 1581 de 2012',
    autoridadEmisora: 'Congreso de la República de Colombia',
    fechaExpedicion: '2012-10-17',
    epigrafeOTitulo: 'Régimen General de Protección de Datos Personales (Habeas Data)',
    articulosOFundamentosClave: 'Art. 4 (Principios del tratamiento), Art. 9 (Autorización previa, expresa e informada), Art. 12 (Deber de informar al titular), Art. 17 (Deberes de los responsables)',
    enlaceVerificado: 'http://www.suin-juriscol.gov.co/viewDocument.asp?ruta=Leyes/1684537',
    estadoVigenciaComprobado: 'VIGENTE',
    fechaUltimaConsulta: '2026-10-28',
    resumenExtracto: 'Desarrolla el derecho constitucional de todas las personas a conocer, actualizar y rectificar las informaciones que se hayan recogido sobre ellas en bases de datos o archivos.',
    materias: ['Habeas Data', 'Privacidad', 'Protección de Datos', 'Cumplimiento']
  },
  {
    id: 'norma-decreto2591',
    nombreFuente: 'SUIN_JURISCOL',
    tipoNormaOProvidencia: 'DECRETO_REGLAMENTARIO',
    identificador: 'Decreto 2591 de 1991',
    autoridadEmisora: 'Presidencia de la República de Colombia',
    fechaExpedicion: '1991-11-19',
    epigrafeOTitulo: 'Por el cual se reglamenta la acción de tutela consagrada en el artículo 86 de la Constitución Política',
    articulosOFundamentosClave: 'Art. 7 (Medidas cautelares provisionales), Art. 10 (Legitimidad e interés), Art. 14 (Contenido de la solicitud), Art. 29 (Término perentorio de 10 días para fallo), Art. 52 (Trámite de Desacato)',
    enlaceVerificado: 'http://www.suin-juriscol.gov.co/viewDocument.asp?ruta=Decretos/1042735',
    estadoVigenciaComprobado: 'VIGENTE',
    fechaUltimaConsulta: '2026-10-28',
    resumenExtracto: 'Reglamento procesal fundamental de la acción de tutela. Define la procedencia, trámite expedito, medidas de protección provisional y sanciones por desacato a providencias de tutela.',
    materias: ['Tutela', 'Constitucional', 'Medidas Cautelares', 'Desacato']
  },
  {
    id: 'juris-c-590-05',
    nombreFuente: 'CORTE_CONSTITUCIONAL',
    tipoNormaOProvidencia: 'SENTENCIA_C',
    identificador: 'Sentencia C-590 de 2005',
    autoridadEmisora: 'Corte Constitucional de Colombia',
    fechaExpedicion: '2005-06-08',
    epigrafeOTitulo: 'Doctrina constitucional sobre causales de procedibilidad de la acción de tutela contra providencias judiciales',
    articulosOFundamentosClave: 'Requisitos generales (relevancia constitucional, inmediatez, subsidiariedad) y causales específicas (defecto sustantivo, fáctico, procedimental absoluto, orgánico, fáctico y error inducido)',
    enlaceVerificado: 'https://www.corteconstitucional.gov.co/relatoria/2005/C-590-05.htm',
    estadoVigenciaComprobado: 'JURISPRUDENCIA_VIGENTE',
    fechaUltimaConsulta: '2026-10-28',
    resumenExtracto: 'Precedente unificado y vinculante que sistematiza las condiciones excepcionales y taxativas bajo las cuales procede la acción de tutela contra sentencias y providencias judiciales ejecutoriadas.',
    materias: ['Tutela contra Providencias', 'Vía de Hecho', 'Precedente Vinculante']
  },
  {
    id: 'juris-su-091-00',
    nombreFuente: 'CORTE_CONSTITUCIONAL',
    tipoNormaOProvidencia: 'SENTENCIA_SU',
    identificador: 'Sentencia SU-091 de 2000',
    autoridadEmisora: 'Corte Constitucional de Colombia',
    fechaExpedicion: '2000-02-02',
    epigrafeOTitulo: 'Alcance del principio de confianza legítima y deber de motivación de actos de desvinculación en provisionalidad',
    articulosOFundamentosClave: 'Motivación obligatoria de actos administrativos que declaran insubsistencias de empleados provisionales',
    enlaceVerificado: 'https://www.corteconstitucional.gov.co/relatoria/2000/SU091-00.htm',
    estadoVigenciaComprobado: 'JURISPRUDENCIA_VIGENTE',
    fechaUltimaConsulta: '2026-10-28',
    resumenExtracto: 'Sentencia de unificación sobre la obligatoriedad ineludible de motivar los actos de retiro de servidores públicos nombrados en cargos de carrera en provisionalidad.',
    materias: ['Laboral Administrativo', 'Carrera Administrativa', 'Motivación']
  },
  {
    id: 'norma-ley1123',
    nombreFuente: 'SUIN_JURISCOL',
    tipoNormaOProvidencia: 'LEY',
    identificador: 'Ley 1123 de 2007',
    autoridadEmisora: 'Congreso de la República de Colombia',
    fechaExpedicion: '2007-01-22',
    epigrafeOTitulo: 'Código Disciplinario del Abogado',
    articulosOFundamentosClave: 'Art. 28 (Deberes profesionales del abogado: lealtad, diligencia, custodia de documentos, secreto profesional), Art. 34 (Faltas a la debida diligencia profesional)',
    enlaceVerificado: 'http://www.suin-juriscol.gov.co/viewDocument.asp?ruta=Leyes/1673898',
    estadoVigenciaComprobado: 'VIGENTE',
    fechaUltimaConsulta: '2026-10-28',
    resumenExtracto: 'Estatuto deontológico que regula el ejercicio ético y la responsabilidad disciplinaria de los profesionales del derecho en Colombia ante la Comisión Nacional de Disciplina Judicial.',
    materias: ['Deontología Jurídica', 'Responsabilidad Profesional', 'Ética']
  }
];

export const PORTALES_OFICIALES_COLOMBIA = [
  {
    nombre: 'SUIN - Juriscol',
    sigla: 'SUIN-Juriscol',
    descripcion: 'Sistema Único de Información Normativa del Ministerio de Justicia y del Derecho. Textos oficiales, vigencias y afectaciones.',
    url: 'https://www.suin-juriscol.gov.co',
    autoridad: 'Ministerio de Justicia y del Derecho'
  },
  {
    nombre: 'Corte Constitucional de Colombia - Relatoría',
    sigla: 'Corte Constitucional',
    descripcion: 'Buscador oficial de jurisprudencia de tutelas (T), constitucionalidad (C), unificación (SU) y autos.',
    url: 'https://www.corteconstitucional.gov.co/relatoria/',
    autoridad: 'Corte Constitucional'
  },
  {
    nombre: 'Corte Suprema de Justicia - Consulta de Jurisprudencia',
    sigla: 'CSJ',
    descripcion: 'Relatoría de las Salas de Casación Civil y Agraria, Laboral, Penal y Sala Plena.',
    url: 'https://cortesuprema.gov.co/corte/index.php/consulta-de-jurisprudencia/',
    autoridad: 'Corte Suprema de Justicia'
  },
  {
    nombre: 'Consejo de Estado - Sistema SAMAI y Relatoría',
    sigla: 'Consejo de Estado',
    descripcion: 'Jurisprudencia de la Sala de lo Contencioso Administrativo (Secciones 1 a 5) y Sala de Consulta y Servicio Civil.',
    url: 'https://www.consejodeestado.gov.co',
    autoridad: 'Consejo de Estado'
  },
  {
    nombre: 'Rama Judicial de Colombia - Portal de Consulta de Procesos',
    sigla: 'Rama Judicial',
    descripcion: 'Sistema unificado de consulta de procesos nacionales (Siglo XXI, Justicia XXI Web, SAMAI) con radicado de 23 dígitos.',
    url: 'https://consultaprocesos.ramajudicial.gov.co/Procesos/NumeroRadicacion',
    autoridad: 'Consejo Superior de la Judicatura'
  },
  {
    nombre: 'Secretaría Jurídica de la Presidencia',
    sigla: 'Presidencia Jurídica',
    descripcion: 'Decretos del Gobierno Nacional, compilaciones reglamentarias y directivas presidenciales.',
    url: 'https://secretariajuridica.presidencia.gov.co',
    autoridad: 'Presidencia de la República'
  },
  {
    nombre: 'Diario Oficial - Imprenta Nacional',
    sigla: 'Diario Oficial',
    descripcion: 'Publicación oficial obligatoria para la promulgación y entrada en vigencia de leyes y actos generales.',
    url: 'https://www.imprenta.gov.co',
    autoridad: 'Imprenta Nacional de Colombia'
  }
];

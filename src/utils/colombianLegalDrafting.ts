/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — PLANTILLAS DE REDACCIÓN Y ESTRUCTURA PROCESAL COLOMBIANA
 * Estructuras canónicas rigurosas conforme al CGP, CPACA, D. 2591/91 y Ley 2213/2022.
 */

export interface PlantillaDefinicion {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  camposRequeridos: {
    clave: string;
    etiqueta: string;
    tipo: 'texto' | 'textarea' | 'select' | 'fecha' | 'numero';
    placeholder?: string;
    opciones?: string[];
    obligatorio: boolean;
  }[];
  advertenciasPrevias: string[];
  generarBorrador: (datos: Record<string, any>) => string;
}

export const PLANTILLAS_JURIDICAS: PlantillaDefinicion[] = [
  {
    id: 'ACCION_TUTELA',
    nombre: 'Acción de Tutela Constitucional',
    descripcion: 'Mecanismo preferente y sumario para la protección inmediata de derechos fundamentales conculcados o amenazados (Art. 86 C.P. y Decreto 2591 de 1991).',
    categoria: 'Constitucional',
    advertenciasPrevias: [
      'Verificar requisito de subsidiariedad: corroborar que no exista otro medio idóneo de defensa judicial, o invocar perjuicio irremediable.',
      'Verificar requisito de inmediatez: evaluar el lapso transcurrido entre la vulneración y la radicación.',
      'Verificar juramento de no duplicidad bajo gravedad de juramento (Art. 37 D. 2591/91).'
    ],
    camposRequeridos: [
      { clave: 'ciudad', etiqueta: 'Ciudad de Radicación', tipo: 'texto', placeholder: 'Bogotá D.C.', obligatorio: true },
      { clave: 'despacho', etiqueta: 'Juez de Tutela (Reparto)', tipo: 'texto', placeholder: 'Señor Juez Constitucional (Reparto)', obligatorio: true },
      { clave: 'accionanteNombre', etiqueta: 'Nombre del Accionante', tipo: 'texto', placeholder: 'Nombre completo o apoderado', obligatorio: true },
      { clave: 'accionanteId', etiqueta: 'Identificación del Accionante', tipo: 'texto', placeholder: 'C.C. 1.020.300.400', obligatorio: true },
      { clave: 'accionadoNombre', etiqueta: 'Entidad o Persona Accionada', tipo: 'texto', placeholder: 'EPS Sanitas / Entidad Pública', obligatorio: true },
      { clave: 'derechosVulnerados', etiqueta: 'Derechos Fundamentales Invocados', tipo: 'texto', placeholder: 'Salud, Vida Digna, Mínimo Vital, Debido Proceso', obligatorio: true },
      { clave: 'hechos', etiqueta: 'Hechos Cronológicos', tipo: 'textarea', placeholder: '1. El día... 2. Con fecha...', obligatorio: true },
      { clave: 'pretensiones', etiqueta: 'Pretensiones Concretas', tipo: 'textarea', placeholder: 'PRIMERO: Tutelar los derechos... SEGUNDO: Ordenar a la accionada...', obligatorio: true },
      { clave: 'medidaCautelar', etiqueta: 'Medida Cautelar Provisional (Art. 7 D. 2591)', tipo: 'textarea', placeholder: 'Decretar de manera provisional mientras se falla el fondo...', obligatorio: false },
      { clave: 'pruebas', etiqueta: 'Relación de Pruebas y Anexos', tipo: 'textarea', placeholder: 'Historia clínica, copia de peticiones sin respuesta...', obligatorio: true },
      { clave: 'emailNotificacion', etiqueta: 'Correo de Notificaciones (Ley 2213)', tipo: 'texto', placeholder: 'abogado@jairrestaura.co', obligatorio: true }
    ],
    generarBorrador: (d) => `Señor(a)
${d.despacho || 'JUEZ CONSTITUCIONAL (REPARTO)'}
${d.ciudad || 'Ciudad de Radicación'}
E. S. D.

ASUNTO: ACCIÓN DE TUTELA
ACCIONANTE: ${d.accionanteNombre || '[NOMBRE DEL ACCIONANTE]'}, identificado con ${d.accionanteId || '[NÚMERO IDENTIFICACIÓN]'}
ACCIONADO: ${d.accionadoNombre || '[ENTIDAD O PERSONA ACCIONADA]'}
DERECHOS FUNDAMENTALES VULNERADOS: ${d.derechosVulnerados || '[DERECHOS FUNDAMENTALES INVOCADOS]'}

${d.accionanteNombre || '[NOMBRE DEL ACCIONANTE]'}, mayor de edad, domiciliado en esta ciudad, actuando en nombre propio / mediante apoderado judicial, acudo respetuosamente ante su Despacho para interponer ACCIÓN DE TUTELA consagrada en el Artículo 86 de la Constitución Política y regulada por el Decreto 2591 de 1991, en contra de ${d.accionadoNombre || '[ENTIDAD ACCIONADA]'}, con el fin de que se ordene el cese inmediato de la vulneración o amenaza de los derechos fundamentales invocados, con base en los siguientes:

I. HECHOS
${d.hechos || '1. [Relato cronológico y ordenado de los hechos fácticos].\n2. [Indicar fechas, circunstancias de modo y lugar].\n3. [Manifestar la afectación directa o la inminencia de daño irremediable].'}

${d.medidaCautelar ? `II. SOLICITUD DE MEDIDA CAUTELAR PROVISIONAL (Art. 7 Decreto 2591 de 1991)
Ruego al Señor Juez decretar con carácter de urgencia la siguiente medida provisional:
${d.medidaCautelar}
Lo anterior ante la inminencia de un perjuicio irremediable e irreparable.` : ''}

III. DERECHOS FUNDAMENTALES VULNERADOS Y CONCEPTO DE VIOLACIÓN
Se evidencia la vulneración palmaria de los derechos a: ${d.derechosVulnerados || '[Derechos invocados]'}. La jurisprudencia consolidada de la Honorable Corte Constitucional ha reiterado que las entidades tienen la obligación constitucional estricta de abstenerse de dilaciones injustificadas.

IV. PRETENSIONES
Con fundamento en los hechos y consideraciones expuestas, solicito:
${d.pretensiones || 'PRIMERO: TUTELAR los derechos fundamentales invocados.\nSEGUNDO: ORDENAR a la accionada que en el término perentorio de cuarenta y ocho (48) horas proceda a restablecer el goce efectivo de los mismos.'}

V. JURAMENTO DE NO DUPLICIDAD (Art. 37 Decreto 2591 de 1991)
Bajo la gravedad de juramento manifiesto que no he instaurado otra acción de tutela ante autoridad judicial alguna por los mismos hechos y pretensiones aquí descritos.

VI. PRUEBAS Y ANEXOS
Aporto los siguientes medios probatorios:
${d.pruebas || '- Copia de documento de identidad del accionante.\n- Documentales que sustentan la vulneración y los hechos invocados.'}

VII. NOTIFICACIONES
Para efectos del trámite y conforme a la Ley 2213 de 2022:
- Accionante: Recibirá notificaciones en el correo electrónico: ${d.emailNotificacion || '[Correo electrónico de notificación judicial]'}
- Accionado: Recibirá notificaciones en el buzón oficial de notificaciones judiciales de la entidad.

Del Señor Juez, atentamente,

___________________________________________
${d.accionanteNombre || '[NOMBRE Y FIRMA DEL ACCIONANTE/APODERADO]'}
C.C. ${d.accionanteId || '[NÚMERO CÉDULA]'}`
  },

  {
    id: 'DERECHO_PETICION',
    nombre: 'Derecho de Petición en Interés Particular / General',
    descripcion: 'Petición formal amparada en el Art. 23 C.P. y Ley Estatutaria 1755 de 2015 ante autoridades públicas o particulares.',
    categoria: 'Administrativo / Constitucional',
    advertenciasPrevias: [
      'Plazos legales de respuesta: 15 días hábiles para peticiones generales, 10 días para solicitud de información/documentos, 30 días para consultas.',
      'Si se solicitan copias, verificar si tienen reserva legal o arancel de reproducción.'
    ],
    camposRequeridos: [
      { clave: 'ciudadFecha', etiqueta: 'Ciudad y Fecha', tipo: 'texto', placeholder: 'Bogotá D.C., 28 de octubre de 2026', obligatorio: true },
      { clave: 'destinatario', etiqueta: 'Autoridad o Entidad Destinataria', tipo: 'texto', placeholder: 'Señores Secretaría Distrital / Entidad', obligatorio: true },
      { clave: 'peticionarioNombre', etiqueta: 'Nombre del Peticionario', tipo: 'texto', placeholder: 'Nombre completo o Razón Social', obligatorio: true },
      { clave: 'peticionarioId', etiqueta: 'Identificación (C.C. / NIT)', tipo: 'texto', placeholder: 'C.C. / NIT', obligatorio: true },
      { clave: 'objetoPeticion', etiqueta: 'Objeto de la Petición', tipo: 'texto', placeholder: 'Solicitud de copias de expediente / Certificación / Información pública', obligatorio: true },
      { clave: 'hechos', etiqueta: 'Fundamentos Fácticos (Hechos)', tipo: 'textarea', placeholder: 'Hechos que sustentan la solicitud...', obligatorio: true },
      { clave: 'peticionesConcretas', etiqueta: 'Solicitud Concreta', tipo: 'textarea', placeholder: '1. Se sirva expedir copia... 2. Se informe el estado...', obligatorio: true },
      { clave: 'emailNotificacion', etiqueta: 'Correo Electrónico para Notificación', tipo: 'texto', placeholder: 'peticionario@dominio.com', obligatorio: true }
    ],
    generarBorrador: (d) => `${d.ciudadFecha || 'Bogotá D.C., fecha actual'}

Señores:
${d.destinatario || '[AUTORIDAD O DESTINATARIO]'}
Atn: Oficina de Atención al Ciudadano / Correspondencia
${d.ciudadFecha ? d.ciudadFecha.split(',')[0] : 'Ciudad'}

REF: EJERCICIO DEL DERECHO FUNDAMENTAL DE PETICIÓN (Art. 23 C.P. y Ley 1755 de 2015)
OBJETO: ${d.objetoPeticion || '[OBJETO DE LA PETICIÓN]'}

${d.peticionarioNombre || '[NOMBRE DEL PETICIONARIO]'}, mayor de edad, identificado con ${d.peticionarioId || '[NÚMERO DE IDENTIFICACIÓN]'}, en ejercicio del Derecho Fundamental de Petición consagrado en el Artículo 23 de la Constitución Política de Colombia y regulado integralmente por la Ley Estatutaria 1755 de 2015, respetuosamente solicito a su entidad lo siguiente:

I. FUNDAMENTOS FÁCTICOS
${d.hechos || '1. [Describir con precisión los antecedentes y situaciones fácticas].\n2. [Exponer las razones que motivan la solicitud].'}

II. FUNDAMENTOS JURÍDICOS
La presente solicitud se ampara en los Artículos 23 y 74 de la Constitución Política, y en los Artículos 13, 14, 15 y siguientes de la Ley Estatutaria 1755 de 2015. Se recuerda a la entidad que el término perentorio e improrrogable para responder de fondo la presente petición es de quince (15) días hábiles (o diez (10) días hábiles en caso de requerirse documentos o copias), so pena de las sanciones disciplinarias de ley.

III. PETICIONES CONCRETAS
${d.peticionesConcretas || '1. [Petición concreta y específica número uno].\n2. [Petición concreta y específica número dos].'}

IV. ANEXOS
Se adjuntan como soporte:
- Copia del documento de identificación del peticionario.
- Soportes documentales pertinentes.

V. NOTIFICACIONES
Autorizo expresamente el envío de la respuesta al correo electrónico institucional/personal:
Correo Electrónico: ${d.emailNotificacion || '[Correo electrónico autorizado para respuesta]'}

Atentamente,

___________________________________________
${d.peticionarioNombre || '[NOMBRE COMPLETO]'}
${d.peticionarioId || '[DOCUMENTO DE IDENTIDAD]'}`
  },

  {
    id: 'PODER_ESPECIAL',
    nombre: 'Poder Especial Amplio y Suficiente (Art. 74 CGP)',
    descripcion: 'Concesión de representación procesal y facultades judiciales conforme a las leyes 1564 de 2012 y 2213 de 2022.',
    categoria: 'Procesal / Civil',
    advertenciasPrevias: [
      'Conforme a la Ley 2213 de 2022 Art. 5, el poder mediante mensaje de datos se presume auténtico sin necesidad de presentación personal ante notario.',
      'Debe especificarse con claridad el asunto, las partes y el despacho correspondiente.'
    ],
    camposRequeridos: [
      { clave: 'ciudad', etiqueta: 'Ciudad', tipo: 'texto', placeholder: 'Bogotá D.C.', obligatorio: true },
      { clave: 'poderdanteNombre', etiqueta: 'Nombre del Poderdante', tipo: 'texto', placeholder: 'Cliente o Representante', obligatorio: true },
      { clave: 'poderdanteId', etiqueta: 'Identificación Poderdante', tipo: 'texto', placeholder: 'C.C. / NIT', obligatorio: true },
      { clave: 'apoderadoNombre', etiqueta: 'Nombre del Abogado Apoderado', tipo: 'texto', placeholder: 'Dr. Jair / Abogado', obligatorio: true },
      { clave: 'apoderadoId', etiqueta: 'Identificación del Abogado', tipo: 'texto', placeholder: 'C.C. del abogado', obligatorio: true },
      { clave: 'apoderadoTP', etiqueta: 'Tarjeta Profesional C.S.J.', tipo: 'texto', placeholder: 'T.P. No. 000000 del C.S. de la J.', obligatorio: true },
      { clave: 'asuntoObjeto', etiqueta: 'Asunto o Proceso Específico', tipo: 'textarea', placeholder: 'Representación en proceso declarativo / ejecutivo...', obligatorio: true },
      { clave: 'contraparte', etiqueta: 'Contraparte Procesal', tipo: 'texto', placeholder: 'Nombre de la contraparte', obligatorio: true }
    ],
    generarBorrador: (d) => `PODER ESPECIAL, AMPLIO Y SUFICIENTE
(Artículos 74 y siguientes del Código General del Proceso y Ley 2213 de 2022)

${d.ciudad || 'Bogotá D.C.'}

Señor(a)
JUEZ COMPETENTE / AUTORIDAD JUDICIAL O ADMINISTRATIVA
${d.ciudad || 'Ciudad'}
E. S. D.

${d.poderdanteNombre || '[NOMBRE DEL PODERDANTE]'}, mayor de edad, domiciliado en esta ciudad, identificado con ${d.poderdanteId || '[NÚMERO DE IDENTIFICACIÓN]'}, por medio del presente documento confiero PODER ESPECIAL, AMPLIO Y SUFICIENTE al(a la) doctor(a) ${d.apoderadoNombre || '[NOMBRE DEL ABOGADO]'}, mayor de edad, identificado con la cédula de ciudadanía No. ${d.apoderadoId || '[CÉDULA ABOGADO]'} y portador(a) de la Tarjeta Profesional No. ${d.apoderadoTP || '[TARJETA PROFESIONAL]'} expedida por el Consejo Superior de la Judicatura, para que en mi nombre y representación inicie, tramite y lleve hasta su total culminación el siguiente asunto:

ASUNTO: ${d.asuntoObjeto || '[DESCRIPCIÓN PUNTUAL DEL OBJETO DEL PODER Y PROCESO JUDICIAL O EXTRAJUDICIAL]'}
CONTRAPARTE: En contra de / Con intervención de ${d.contraparte || '[NOMBRE DE LA CONTRAPARTE]'}.

FACULTADES:
Mi apoderado(a) queda expresamente facultado(a) para realizar todas las actuaciones procesales y extrajudiciales inherentes al mandato, en los términos del Artículo 77 del Código General del Proceso (Ley 1564 de 2012), entre ellas: conciliar, transigir, desistir, recibir, sustituir total o parcialmente el presente mandato, reasumirlo, tachar de falsedad, interponer recursos ordinarios y extraordinarios de reposición, apelación, queja, casación, tutela y nulidad, solicitar medidas cautelares, y en general todas aquellas que tiendan a la más eficaz defensa de mis derechos e intereses.

El presente poder se otorga con las prerrogativas y presunción de autenticidad establecidas en el Artículo 5 de la Ley 2213 de 2022.

Acepto el mandato,

___________________________________________
${d.poderdanteNombre || '[FIRMA DEL PODERDANTE]'}
C.C. ${d.poderdanteId || '[DOCUMENTO PODERDANTE]'}
Poderdante

___________________________________________
${d.apoderadoNombre || '[FIRMA DEL APODERADO]'}
C.C. ${d.apoderadoId || '[CÉDULA APODERADO]'}
T.P. No. ${d.apoderadoTP || '[TARJETA PROFESIONAL]'} del C.S. de la J.
Apoderado(a) Judicial`
  },

  {
    id: 'CONTRATO_PRESTACION_SERVICIOS',
    nombre: 'Contrato de Prestación de Servicios Profesionales de Abogacía',
    descripcion: 'Acuerdo privado de honorarios profesionales, etapas, cuota litis, confidencialidad y Ley 1581/2012.',
    categoria: 'Contractual / Administrativo',
    advertenciasPrevias: [
      'Debe estipularse claramente si los honorarios pactados incluyen o no los gastos procesales y agencias en derecho.',
      'Obligatorio incorporar cláusula de protección de datos (Ley 1581/2012) y secreto profesional (Ley 1123/2007).'
    ],
    camposRequeridos: [
      { clave: 'ciudadFecha', etiqueta: 'Ciudad y Fecha', tipo: 'texto', placeholder: 'Bogotá D.C., 28 de octubre de 2026', obligatorio: true },
      { clave: 'clienteNombre', etiqueta: 'Nombre o Razón Social del Cliente', tipo: 'texto', placeholder: 'Cliente o Representante', obligatorio: true },
      { clave: 'clienteId', etiqueta: 'NIT o C.C. del Cliente', tipo: 'texto', placeholder: 'NIT 900.123.456-7', obligatorio: true },
      { clave: 'abogadoNombre', etiqueta: 'Firma / Abogado Responsable', tipo: 'texto', placeholder: 'JAIRRESTAURA UNO A / Abogado Titular', obligatorio: true },
      { clave: 'objetoContrato', etiqueta: 'Alcance y Objeto del Servicio', tipo: 'textarea', placeholder: 'Asesoría y representación judicial en el proceso...', obligatorio: true },
      { clave: 'modalidadHonorarios', etiqueta: 'Modalidad de Honorarios', tipo: 'select', opciones: ['Cuota Fija por Etapas', 'Cuota Litis (% sobre lo recuperado)', 'Mixto (Fijo + Éxito)', 'Tarifa por Hora Profesional'], obligatorio: true },
      { clave: 'valorHonorariosCOP', etiqueta: 'Monto Pactado en COP o Porcentaje', tipo: 'texto', placeholder: '$15.000.000 COP o 20% de cuota litis', obligatorio: true },
      { clave: 'formaPago', etiqueta: 'Forma y Calendario de Pagos', tipo: 'textarea', placeholder: '50% anticipo al firmar, 25% al admitir la demanda...', obligatorio: true }
    ],
    generarBorrador: (d) => `CONTRATO DE PRESTACIÓN DE SERVICIOS PROFESIONALES JURÍDICOS

Entre los suscritos a saber:
Por una parte, ${d.clienteNombre || '[NOMBRE O RAZÓN SOCIAL DEL CLIENTE]'}, identificado con ${d.clienteId || '[DOCUMENTO DE IDENTIDAD/NIT]'}, quien en adelante se denominará EL CLIENTE; y por la otra, ${d.abogadoNombre || 'JAIRRESTAURA UNO A'}, en adelante EL ABOGADO, se ha convenido celebrar el presente Contrato de Prestación de Servicios Profesionales de Abogacía, regido por las siguientes cláusulas:

CLÁUSULA PRIMERA. OBJETO: EL ABOGADO se compromete a prestar sus servicios profesionales de asesoría, estructuración y/o representación legal a favor de EL CLIENTE en el siguiente asunto:
${d.objetoContrato || '[DESCRIPCIÓN DEL ASUNTO JURÍDICO ESPECÍFICO]'}.

CLÁUSULA SEGUNDA. OBLIGACIÓN DE MEDIO Y NO DE RESULTADO: Las partes dejan expresa constancia de que, de conformidad con el régimen legal y jurisprudencial colombiano, el ejercicio de la abogacía constituye una OBLIGACIÓN DE MEDIO y no de resultado. En consecuencia, EL ABOGADO pondrá a disposición toda su diligencia, conocimiento técnico y cuidado profesional (Lex Artis), sin que pueda garantizar una decisión judicial o administrativa favorable en fallo definitivo.

CLÁUSULA TERCERA. HONORARIOS PROFESIONALES:
Por concepto de honorarios profesionales, EL CLIENTE pagará a EL ABOGADO:
- Modalidad: ${d.modalidadHonorarios || 'Cuota pactada'}
- Valor o Porcentaje: ${d.valorHonorariosCOP || '[Monto en COP o % pactado]'}
- Forma de Pago:
${d.formaPago || '1. [Condiciones y fechas de pago pactadas].'}

CLÁUSULA CUARTA. GASTOS PROCESALES: Los aranceles judiciales, pólizas judiciales, publicaciones en prensa, honorarios de peritos, expensas de copias y desplazamientos procesales extraordinarios serán de cargo exclusivo de EL CLIENTE.

CLÁUSULA QUINTA. CONFIDENCIALIDAD Y PROTECCIÓN DE DATOS (LEY 1581 DE 2012): Las partes guardarán estricta reserva profesional sobre toda la información conocida con ocasión de este contrato. EL CLIENTE autoriza de forma expresa, informada y previa el tratamiento de sus datos personales para los fines exclusivos de la gestión jurídica y judicial encomendada.

En constancia de lo anterior, se firma en ${d.ciudadFecha || 'la ciudad de Bogotá'}.

___________________________________________
EL CLIENTE: ${d.clienteNombre || '[NOMBRE DEL CLIENTE]'}
${d.clienteId || '[NIT / CÉDULA]'}

___________________________________________
EL ABOGADO: ${d.abogadoNombre || '[FIRMA DEL ABOGADO]'}
T.P. No. expedida por el C.S. de la Judicatura`
  }
];

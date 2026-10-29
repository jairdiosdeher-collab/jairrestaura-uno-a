/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * JAIRRESTAURA UNO A — CÁLCULO DE TÉRMINOS JUDICIALES EN COLOMBIA
 * Implementación de la Ley 51 de 1983 (Ley Emiliani), Código General del Proceso (CGP - Ley 1564/2012),
 * CPACA (Ley 1437/2011 - Ley 2080/2021), Decreto Ley 2213 de 2022 y Ley 270 de 1996 (Estatutaria de Adm. de Justicia).
 */

// Algoritmo de Butcher / Meeus para calcular el Domingo de Pascua (Resurrección)
export function calcularPascua(year: number): { month: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = Marzo, 4 = Abril
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

// Mueve una fecha al siguiente lunes si no cae en lunes (Ley Emiliani)
function siguienteLunes(date: Date): Date {
  const res = new Date(date);
  const dayOfWeek = res.getDay(); // 0: Dom, 1: Lun, ...
  if (dayOfWeek === 1) return res;
  const diff = (8 - dayOfWeek) % 7;
  res.setDate(res.getDate() + diff);
  return res;
}

export function obtenerFestivosColombia(year: number): { fechaStr: string; nombre: string }[] {
  const festivos: { fechaStr: string; nombre: string }[] = [];

  const add = (d: Date, nombre: string) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    festivos.push({ fechaStr: `${y}-${m}-${day}`, nombre });
  };

  // 1. Festivos Fijos
  add(new Date(year, 0, 1), 'Año Nuevo');
  add(new Date(year, 4, 1), 'Día del Trabajo');
  add(new Date(year, 6, 20), 'Día de la Independencia de Colombia');
  add(new Date(year, 7, 7), 'Batalla de Boyacá');
  add(new Date(year, 11, 8), 'Inmaculada Concepción');
  add(new Date(year, 11, 25), 'Navidad');

  // 2. Festivos Ley Emiliani (trasladados al siguiente lunes)
  add(siguienteLunes(new Date(year, 0, 6)), 'Reyes Magos');
  add(siguienteLunes(new Date(year, 2, 19)), 'Día de San José');
  add(siguienteLunes(new Date(year, 5, 29)), 'San Pedro y San Pablo');
  add(siguienteLunes(new Date(year, 7, 15)), 'Asunción de la Virgen');
  add(siguienteLunes(new Date(year, 9, 12)), 'Día de la Raza');
  add(siguienteLunes(new Date(year, 10, 1)), 'Todos los Santos');
  add(siguienteLunes(new Date(year, 10, 11)), 'Independencia de Cartagena');

  // 3. Festivos dependientes de la Pascua
  const { month: pMonth, day: pDay } = calcularPascua(year);
  const pascua = new Date(year, pMonth - 1, pDay);

  // Jueves y Viernes Santo
  const juevesSanto = new Date(pascua);
  juevesSanto.setDate(pascua.getDate() - 3);
  add(juevesSanto, 'Jueves Santo');

  const viernesSanto = new Date(pascua);
  viernesSanto.setDate(pascua.getDate() - 2);
  add(viernesSanto, 'Viernes Santo');

  // Ascensión del Señor (40 días después de pascua, trasladado al siguiente lunes)
  const ascension = new Date(pascua);
  ascension.setDate(pascua.getDate() + 40);
  add(siguienteLunes(ascension), 'Ascensión del Señor');

  // Corpus Christi (61 días después de pascua, trasladado al siguiente lunes)
  const corpus = new Date(pascua);
  corpus.setDate(pascua.getDate() + 61);
  add(siguienteLunes(corpus), 'Corpus Christi');

  // Sagrado Corazón de Jesús (68 días después de pascua, trasladado al siguiente lunes)
  const sagradoCorazon = new Date(pascua);
  sagradoCorazon.setDate(pascua.getDate() + 68);
  add(siguienteLunes(sagradoCorazon), 'Sagrado Corazón de Jesús');

  return festivos;
}

/**
 * Determina si una fecha dada es día hábil judicial en Colombia.
 * Excluye sábados (6), domingos (0), festivos oficiales y vacancia judicial individual/colectiva
 * (20 de diciembre a 10 de enero de cada año según Art. 146 Ley 270 de 1996).
 */
export function esDiaHabilJudicial(
  date: Date,
  opciones?: { incluirVacanciaJudicial?: boolean }
): { esHabil: boolean; motivo?: string } {
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0) return { esHabil: false, motivo: 'Domingo' };
  if (dayOfWeek === 6) return { esHabil: false, motivo: 'Sábado (Inhabil judicial Art. 118 CGP)' };

  const year = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${m}-${d}`;

  // Vacancia judicial (20 Dic - 10 Ene)
  const incluirVacancia = opciones?.incluirVacanciaJudicial ?? true;
  if (incluirVacancia) {
    const mes = date.getMonth(); // 0=Ene, 11=Dic
    const dia = date.getDate();
    if (mes === 11 && dia >= 20) {
      return { esHabil: false, motivo: 'Vacancia Judicial Colectiva (Art. 146 Ley 270/1996)' };
    }
    if (mes === 0 && dia <= 10) {
      return { esHabil: false, motivo: 'Vacancia Judicial Colectiva (Art. 146 Ley 270/1996)' };
    }
  }

  const festivos = obtenerFestivosColombia(year);
  const festivoEncontrado = festivos.find((f) => f.fechaStr === dateStr);
  if (festivoEncontrado) {
    return { esHabil: false, motivo: `Día Festivo Oficial: ${festivoEncontrado.nombre}` };
  }

  return { esHabil: true };
}

export interface ResultadoCalculoTermino {
  fechaInicio: string;
  fechaEfectivaInicioTermino: string;
  diasGraciaLey2213: number;
  diasHabilesCalculados: number;
  fechaVencimientoCalculada: string;
  cronologiaDetallada: {
    fecha: string;
    diaSemana: string;
    esHabil: boolean;
    motivo?: string;
    consecutivoDia?: number;
  }[];
  fundamentoLegal: string;
  advertenciaDeontologica: string;
}

/**
 * Calcula un término procesal exacto bajo las reglas colombianas.
 * @param fechaNotificacion Fecha de notificación o envío (YYYY-MM-DD)
 * @param diasTermino Duración del término en días
 * @param tipoDias 'HABILES_JUDICIALES' | 'CALENDARIO'
 * @param aplicaLey2213 Si aplica el Art. 8 Ley 2213/2022 (notificación por correo: 2 días hábiles de gracia previa)
 */
export function calcularTerminoColombiano(
  fechaNotificacionStr: string,
  diasTermino: number,
  tipoDias: 'HABILES_JUDICIALES' | 'CALENDARIO' = 'HABILES_JUDICIALES',
  aplicaLey2213: boolean = true
): ResultadoCalculoTermino {
  const cronologia: ResultadoCalculoTermino['cronologiaDetallada'] = [];
  const diasSemanaNombres = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  // Parse fecha inicial YYYY-MM-DD
  const [y, m, d] = fechaNotificacionStr.split('-').map(Number);
  const cursor = new Date(y, m - 1, d);

  cronologia.push({
    fecha: fechaNotificacionStr,
    diaSemana: diasSemanaNombres[cursor.getDay()],
    esHabil: esDiaHabilJudicial(cursor).esHabil,
    motivo: 'Fecha de recepción o notificación inicial',
  });

  // 1. Aplicación de los 2 días de gracia Ley 2213 de 2022 (si aplica)
  let diasGraciaContados = 0;
  if (aplicaLey2213) {
    while (diasGraciaContados < 2) {
      cursor.setDate(cursor.getDate() + 1);
      const evalHabil = esDiaHabilJudicial(cursor);
      const currStr = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
      
      if (evalHabil.esHabil) {
        diasGraciaContados++;
        cronologia.push({
          fecha: currStr,
          diaSemana: diasSemanaNombres[cursor.getDay()],
          esHabil: true,
          motivo: `Día de gracia ${diasGraciaContados}/2 (Art. 8 Ley 2213/2022)`,
        });
      } else {
        cronologia.push({
          fecha: currStr,
          diaSemana: diasSemanaNombres[cursor.getDay()],
          esHabil: false,
          motivo: `Inhábil durante gracia: ${evalHabil.motivo}`,
        });
      }
    }
  }

  // La fecha efectiva a partir de la cual empezará a correr el término
  const fechaEfectivaInicioTermino = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;

  // 2. Conteo de los días del término procesal
  let diasContados = 0;
  while (diasContados < diasTermino) {
    cursor.setDate(cursor.getDate() + 1);
    const currStr = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
    
    if (tipoDias === 'HABILES_JUDICIALES') {
      const evalHabil = esDiaHabilJudicial(cursor);
      if (evalHabil.esHabil) {
        diasContados++;
        cronologia.push({
          fecha: currStr,
          diaSemana: diasSemanaNombres[cursor.getDay()],
          esHabil: true,
          consecutivoDia: diasContados,
          motivo: `Día hábil procesal ${diasContados}/${diasTermino}`,
        });
      } else {
        cronologia.push({
          fecha: currStr,
          diaSemana: diasSemanaNombres[cursor.getDay()],
          esHabil: false,
          motivo: `Inhábil: ${evalHabil.motivo}`,
        });
      }
    } else {
      // Días calendario continuo
      diasContados++;
      cronologia.push({
        fecha: currStr,
        diaSemana: diasSemanaNombres[cursor.getDay()],
        esHabil: true,
        consecutivoDia: diasContados,
        motivo: `Día calendario ${diasContados}/${diasTermino}`,
      });
    }
  }

  const fechaVencimientoCalculada = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;

  const fundamentoLegal = aplicaLey2213
    ? 'Código General del Proceso (Art. 118 CGP) en consonancia con el Artículo 8 de la Ley 2213 de 2022 (2 días hábiles siguientes al envío del mensaje de datos).'
    : 'Código General del Proceso (Art. 118 CGP: el término corre a partir del día siguiente al de la notificación).';

  const advertenciaDeontologica = 'ADVERTENCIA OBLIGATORIA: El cómputo automatizado constituye una herramienta auxiliar. El abogado titular debe verificar personalmente posibles suspensiones intempestivas de términos decretadas por el Consejo Superior de la Judicatura o cese de actividades del despacho competente antes de refrendar el vencimiento.';

  return {
    fechaInicio: fechaNotificacionStr,
    fechaEfectivaInicioTermino,
    diasGraciaLey2213: aplicaLey2213 ? 2 : 0,
    diasHabilesCalculados: diasTermino,
    fechaVencimientoCalculada,
    cronologiaDetallada: cronologia,
    fundamentoLegal,
    advertenciaDeontologica,
  };
}

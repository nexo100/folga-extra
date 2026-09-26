/**
 * holidays.js - Motor de Calendário e Feriados Oficiais
 * Suporte completo a:
 * - Feriados Nacionais (incluindo Consciência Negra - Lei 14.759/2023)
 * - Feriados Municipais de Salvador / BA e Estaduais da Bahia (São João, 2 de Julho, Conceição da Praia)
 * - Circuito de Carnaval da UFBA (suspensão pré-Carnaval até Quarta de Cinzas)
 * - Pontes Enforcadas do MGI / Executivo Federal (Terças e Quintas)
 * - Cálculo Astronômico da Páscoa e Carnaval (Algoritmo Meeus/Computus)
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.HolidaysEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const DAYS_NAME = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

  // Algoritmo astronômico exato do Computus (Meeus/Gauss)
  function getEasterDate(year) {
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
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
  }

  function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  function formatDate(date) {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  }

  function formatISODate(date) {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${y}-${m}-${d}`;
  }

  function parseDate(str) {
    if (!str) return null;
    if (str instanceof Date) {
      return isNaN(str.getTime()) ? null : new Date(str.getFullYear(), str.getMonth(), str.getDate());
    }
    if (typeof str === 'number') {
      const d = new Date(str);
      return isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }
    if (typeof str === 'string') {
      const trimmed = str.trim();
      if (!trimmed) return null;
      if (trimmed.includes('/')) {
        const parts = trimmed.split(' ')[0].split('/');
        if (parts.length === 3) {
          const [d, m, y] = parts.map(Number);
          if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
            const dt = new Date(y, m - 1, d);
            return isNaN(dt.getTime()) ? null : dt;
          }
        }
      }
      if (trimmed.includes('-')) {
        const datePart = trimmed.split('T')[0].split(' ')[0];
        const parts = datePart.split('-');
        if (parts.length === 3) {
          const [y, m, d] = parts.map(Number);
          if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
            const dt = new Date(y, m - 1, d);
            return isNaN(dt.getTime()) ? null : dt;
          }
        }
      }
      const d = new Date(trimmed);
      return isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }
    return null;
  }

  function getRecessWeeks(year) {
    const christmas = new Date(year, 11, 25);
    const dow = christmas.getDay(); // 0: Dom, 1: Seg, ..., 6: Sáb
    let natalMonday;
    if (dow === 0) {
      natalMonday = addDays(christmas, -6);
    } else if (dow === 6) {
      natalMonday = addDays(christmas, -5);
    } else {
      natalMonday = addDays(christmas, -(dow - 1));
    }

    const anoNovoMonday = addDays(natalMonday, 7);

    const natalDays = [0, 1, 2, 3, 4].map(offset => addDays(natalMonday, offset));
    const anoNovoDays = [0, 1, 2, 3, 4].map(offset => addDays(anoNovoMonday, offset));

    return { natalMonday, anoNovoMonday, natalDays, anoNovoDays };
  }

  const TYPE_PRIORITY = {
    national: 10,
    state: 9,
    municipal: 8,
    carnaval: 7,
    recesso: 6,
    vespera: 5,
    ponte: 4,
    servidor: 3,
    custom: 2
  };

  function generateHolidays(yearOrYears, locationOrOptions = 'UFBA_SALVADOR', autoBridgeArg = true, carnavalCircuitoArg = true, recessShiftArg = 'none', includeVesperasArg = false) {
    if (Array.isArray(yearOrYears)) {
      const allHolidays = [];
      yearOrYears.forEach(y => {
        allHolidays.push(...generateHolidays(y, locationOrOptions, autoBridgeArg, carnavalCircuitoArg, recessShiftArg, includeVesperasArg));
      });

      const uniqueMap = new Map();
      allHolidays.forEach(h => {
        const key = formatISODate(h.date);
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, h);
        } else {
          const existing = uniqueMap.get(key);
          const existingPrio = TYPE_PRIORITY[existing.type] || 0;
          const newPrio = TYPE_PRIORITY[h.type] || 0;
          if (newPrio > existingPrio) {
            uniqueMap.set(key, h);
          }
        }
      });

      const unique = Array.from(uniqueMap.values());
      unique.sort((a, b) => a.date - b.date);
      return unique;
    }

    const year = Number(yearOrYears);
    let location = 'UFBA_SALVADOR';
    let autoBridge = autoBridgeArg;
    let carnavalCircuito = carnavalCircuitoArg;
    let recessShift = recessShiftArg;
    let includeVesperas = includeVesperasArg;

    if (typeof locationOrOptions === 'object' && locationOrOptions !== null) {
      location = locationOrOptions.location || 'UFBA_SALVADOR';
      autoBridge = locationOrOptions.autoBridge !== undefined ? locationOrOptions.autoBridge : true;
      carnavalCircuito = locationOrOptions.carnavalCircuito !== undefined ? locationOrOptions.carnavalCircuito : true;
      recessShift = locationOrOptions.recessShift || 'none';
      includeVesperas = locationOrOptions.includeVesperas !== undefined ? locationOrOptions.includeVesperas : false;
    } else if (typeof locationOrOptions === 'string') {
      location = locationOrOptions;
    }

    const easter = getEasterDate(year);
    const carnavalTer = addDays(easter, -47);
    const carnavalSeg = addDays(easter, -48);
    const quartaCinzas = addDays(easter, -46);
    const paixaoCristo = addDays(easter, -2);
    const corpusChristi = addDays(easter, 60);

    // 1. Feriados Nacionais e Federais Oficiais (Lei 662/49, Lei 10.607/02, Lei 14.759/23)
    const base = [
      { date: new Date(year, 0, 1), name: 'Ano Novo (Confraternização Universal)', type: 'national' },
      { date: paixaoCristo, name: 'Sexta-feira Santa (Paixão de Cristo)', type: 'national' },
      { date: easter, name: 'Domingo de Páscoa', type: 'national' },
      { date: new Date(year, 3, 21), name: 'Tiradentes', type: 'national' },
      { date: new Date(year, 4, 1), name: 'Dia do Trabalhador', type: 'national' },
      { date: corpusChristi, name: 'Corpus Christi (Feriado Salvador / Facultativo Federal)', type: 'municipal' },
      { date: new Date(year, 8, 7), name: 'Independência do Brasil', type: 'national' },
      { date: new Date(year, 9, 12), name: 'Nossa Senhora Aparecida', type: 'national' },
      { date: new Date(year, 9, 28), name: 'Dia do Servidor Público (Ponto Facultativo)', type: 'servidor' },
      { date: new Date(year, 10, 2), name: 'Finados', type: 'national' },
      { date: new Date(year, 10, 15), name: 'Proclamação da República', type: 'national' },
      { date: new Date(year, 10, 20), name: 'Dia Nacional de Zumbi e Consciência Negra (Lei 14.759)', type: 'national' },
      { date: new Date(year, 11, 25), name: 'Natal', type: 'national' },
      // Buffer de transição de ano (permite emendas perfeitas em férias de Dezembro/Janeiro)
      { date: new Date(year + 1, 0, 1), name: 'Ano Novo (Confraternização Universal)', type: 'national' },
      { date: new Date(year - 1, 11, 25), name: 'Natal (Ano Anterior)', type: 'national' },
    ];

    // Vésperas de Natal e Ano Novo (Portaria MGI anual de pontos facultativos)
    if (includeVesperas) {
      base.push({ date: new Date(year, 11, 24), name: 'Véspera de Natal (Ponto Facultativo MGI)', type: 'vespera' });
      base.push({ date: new Date(year, 11, 31), name: 'Véspera de Ano Novo (Ponto Facultativo MGI)', type: 'vespera' });
      base.push({ date: new Date(year - 1, 11, 31), name: 'Véspera de Ano Novo (Ano Anterior)', type: 'vespera' });
    }

    // 2. Normalização de Localidade (case-insensitive e flexível)
    const locUpper = (location || '').toUpperCase();
    const isSalvadorOrUFBA = locUpper.includes('SALVADOR') || locUpper.includes('UFBA') || locUpper.includes('BA');

    // Feriados Locais de Salvador / Bahia que a UFBA respeita
    if (isSalvadorOrUFBA) {
      base.push({ date: new Date(year, 5, 24), name: 'São João (Feriado Municipal Salvador / BA)', type: 'municipal' });
      base.push({ date: new Date(year, 6, 2), name: 'Independência da Bahia (Dois de Julho)', type: 'state' });
      base.push({ date: new Date(year, 11, 8), name: 'N. Sra. da Conceição da Praia (Padroeira Salvador)', type: 'municipal' });
    }

    // 3. CARNAVAL: No circuito da UFBA (Canela/Reitoria/Ondina) vs. Padrão
    if (carnavalCircuito && isSalvadorOrUFBA) {
      base.push({ date: addDays(carnavalTer, -6), name: 'Quarta pré-Carnaval (Suspensão Circuito UFBA)', type: 'carnaval' });
      base.push({ date: addDays(carnavalTer, -5), name: 'Quinta pré-Carnaval (Suspensão Circuito UFBA)', type: 'carnaval' });
      base.push({ date: addDays(carnavalTer, -4), name: 'Sexta pré-Carnaval (Suspensão Circuito UFBA)', type: 'carnaval' });
      base.push({ date: carnavalSeg, name: 'Carnaval (Segunda-feira)', type: 'carnaval' });
      base.push({ date: carnavalTer, name: 'Carnaval (Terça-feira)', type: 'carnaval' });
      base.push({ date: quartaCinzas, name: 'Quarta de Cinzas (Expediente Suspenso UFBA)', type: 'carnaval' });
    } else {
      base.push({ date: carnavalSeg, name: 'Carnaval (Segunda-feira)', type: 'carnaval' });
      base.push({ date: carnavalTer, name: 'Carnaval (Terça-feira)', type: 'carnaval' });
      base.push({ date: quartaCinzas, name: 'Quarta-feira de Cinzas (Facultativo)', type: 'servidor' });
    }

    // 4. RECESSO DE FIM DE ANO COM REVEZAMENTO (Portaria SRT/MGI & UFBA)
    // O recesso cobre apenas os dias úteis remanescentes da semana escalada.
    // 25/12 e 01/01 são SEMPRE feriados nacionais para todos.
    if (recessShift && recessShift !== 'none') {
      const { natalDays, anoNovoDays } = getRecessWeeks(year);
      const christmasStr = formatISODate(new Date(year, 11, 25));
      const newYearStr = formatISODate(new Date(year + 1, 0, 1));

      if (recessShift === 'natal') {
        natalDays.forEach(d => {
          const dStr = formatISODate(d);
          if (dStr !== christmasStr) {
            base.push({
              date: d,
              name: d.getMonth() === 11 && d.getDate() === 24 
                ? 'Recesso MGI / Véspera de Natal' 
                : 'Recesso de Fim de Ano MGI (Turma Natal)',
              type: 'recesso'
            });
          }
        });
      } else if (recessShift === 'ano_novo') {
        anoNovoDays.forEach(d => {
          const dStr = formatISODate(d);
          if (dStr !== newYearStr) {
            base.push({
              date: d,
              name: d.getMonth() === 11 && d.getDate() === 31 
                ? 'Recesso MGI / Véspera de Ano Novo' 
                : 'Recesso de Fim de Ano MGI (Turma Ano Novo)',
              type: 'recesso'
            });
          }
        });
      }
    }

    // 5. PONTES ENFORCADAS (Decretos do MGI / UFBA para feriados em Quinta ou Terça)
    const bridges = [];
    if (autoBridge) {
      base.forEach(h => {
        // Pontes só se aplicam a feriados oficiais nacionais/municipais/estaduais, não a recessos
        if (h.type === 'recesso' || h.type === 'ponte') return;

        const day = h.date.getDay();
        if (day === 4) { // Cai em Quinta-feira -> enforca Sexta-feira
          const bridgeDate = addDays(h.date, 1);
          bridges.push({ date: bridgeDate, name: `Ponte MGI (Sexta-feira pós-${h.name.split(' ')[0]})`, type: 'ponte' });
        } else if (day === 2) { // Cai em Terça-feira -> enforca Segunda-feira
          const bridgeDate = addDays(h.date, -1);
          bridges.push({ date: bridgeDate, name: `Ponte MGI (Segunda-feira pré-${h.name.split(' ')[0]})`, type: 'ponte' });
        }
      });
    }

    const all = [...base, ...bridges];
    const uniqueMap = new Map();

    all.forEach(h => {
      const key = formatISODate(h.date);
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, h);
      } else {
        const existing = uniqueMap.get(key);
        const existingPrio = TYPE_PRIORITY[existing.type] || 0;
        const newPrio = TYPE_PRIORITY[h.type] || 0;
        if (newPrio > existingPrio) {
          uniqueMap.set(key, h);
        }
      }
    });

    const unique = Array.from(uniqueMap.values());
    unique.sort((a, b) => a.date - b.date);
    return unique;
  }

  function generateHolidaysForRange(startYear, endYear, locationOrOptions, autoBridgeArg, carnavalCircuitoArg, recessShiftArg, includeVesperasArg) {
    const years = [];
    for (let y = Number(startYear); y <= Number(endYear); y++) {
      years.push(y);
    }
    return generateHolidays(years, locationOrOptions, autoBridgeArg, carnavalCircuitoArg, recessShiftArg, includeVesperasArg);
  }

  return {
    DAYS_NAME,
    getEasterDate,
    getRecessWeeks,
    addDays,
    formatDate,
    formatISODate,
    parseDate,
    generateHolidays,
    generateHolidaysForRange
  };
});

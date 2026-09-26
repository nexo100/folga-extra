/**
 * optimizer.js - Motor Matemático Puro de Otimização de Férias
 * Responsabilidade única:
 * - Algoritmo combinatório com Programação Dinâmica (DP) e Interval Scheduling
 * - Otimização multiobjetivo: teto de descanso (totalOff) vs. zero desperdício (zero waste)
 * - Rastreamento exato de emendas, pontes, feriados e dias úteis
 * - Alocação estratégica e proporcional de banco de horas (sem inflacionar)
 * - Zero dependência de DOM / HTML
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    const holidays = require('./holidays.js');
    module.exports = factory(holidays);
  } else {
    root.VacationOptimizerEngine = factory(root.HolidaysEngine);
  }
})(typeof self !== 'undefined' ? self : this, function (HolidaysEngine) {
  'use strict';

  const { addDays, formatDate, formatISODate } = HolidaysEngine;

  function normalizeDate(d) {
    if (!d) return null;
    if (HolidaysEngine && typeof HolidaysEngine.parseDate === 'function') {
      return HolidaysEngine.parseDate(d);
    }
    if (d instanceof Date) return isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (typeof d === 'number') {
      const dt = new Date(d);
      return isNaN(dt.getTime()) ? null : new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    }
    if (typeof d === 'string') {
      const trimmed = d.trim();
      if (!trimmed) return null;
      if (trimmed.includes('/')) {
        const parts = trimmed.split(' ')[0].split('/');
        if (parts.length === 3) {
          const [day, mon, yr] = parts.map(Number);
          if (!isNaN(day) && !isNaN(mon) && !isNaN(yr)) {
            const dt = new Date(yr, mon - 1, day);
            return isNaN(dt.getTime()) ? null : dt;
          }
        }
      }
      if (trimmed.includes('-')) {
        const datePart = trimmed.split('T')[0].split(' ')[0];
        const parts = datePart.split('-');
        if (parts.length === 3) {
          const [yr, mon, day] = parts.map(Number);
          if (!isNaN(yr) && !isNaN(mon) && !isNaN(day)) {
            const dt = new Date(yr, mon - 1, day);
            return isNaN(dt.getTime()) ? null : dt;
          }
        }
      }
      const dt = new Date(trimmed);
      return isNaN(dt.getTime()) ? null : new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    }
    return null;
  }

  class VacationOptimizer {
    constructor(options = {}) {
      this.workingDays = options.workingDays || [false, true, true, true, true, true, false];
      this.profile = options.profile || 'servidor_ufba';
      this.compensationDays = parseInt(options.compensationDays) || 0;
      this.year = parseInt(options.year) || parseInt(options.selectedYear) || new Date().getFullYear();
      this.distributeThroughoutYear = Boolean(options.distributeThroughoutYear);

      // Ponto 2: Janela Temporal Customizada (Data Início + Alcance 1 ou 2 anos)
      this.windowStartDate = options.windowStartDate ? normalizeDate(options.windowStartDate) : null;
      this.windowEndDate = options.windowEndDate ? normalizeDate(options.windowEndDate) : null;
      this.windowYears = options.windowYears || (options.windowDuration === 2 || options.windowDuration === '2y' || options.windowDuration === 24 ? 2 : 1);

      // Ponto 2: Períodos a Evitar / Excluir da busca
      this.excludedPeriods = [];
      if (Array.isArray(options.excludedPeriods)) {
        options.excludedPeriods.forEach(p => {
          if (!p) return;
          const s = normalizeDate(p.start || p.startDate);
          const e = normalizeDate(p.end || p.endDate);
          if (s && e) {
            this.excludedPeriods.push({
              start: s <= e ? s : e,
              end: s <= e ? e : s
            });
          }
        });
      }

      if (options.holidays && Array.isArray(options.holidays)) {
        this.holidays = options.holidays;
      } else if (HolidaysEngine && typeof HolidaysEngine.generateHolidays === 'function') {
        const sYr = this.windowStartDate ? this.windowStartDate.getFullYear() : this.year;
        const eYr = this.windowEndDate ? this.windowEndDate.getFullYear() : (this.windowStartDate ? sYr + this.windowYears : this.year);
        const yrs = [];
        for (let y = sYr; y <= eYr; y++) yrs.push(y);
        this.holidays = HolidaysEngine.generateHolidays(yrs, {
          location: options.selectedLocation || options.location || 'UFBA_SALVADOR',
          autoBridge: options.autoBridge !== undefined ? options.autoBridge : true,
          carnavalCircuito: options.carnavalCircuito !== undefined ? options.carnavalCircuito : true,
          recessShift: options.recessShift || 'none',
          includeVesperas: options.includeVesperas !== undefined ? options.includeVesperas : true
        });
      } else {
        this.holidays = [];
      }
    }

    isPeriodExcluded(period) {
      if (!this.excludedPeriods || this.excludedPeriods.length === 0 || !period) return false;
      const pStart = normalizeDate(period.startDate);
      const pEnd = normalizeDate(period.endDate);
      if (!pStart || !pEnd) return false;
      return this.excludedPeriods.some(ex => {
        const s = normalizeDate(ex.start || ex.startDate);
        const e = normalizeDate(ex.end || ex.endDate);
        if (!s || !e) return false;
        return pStart <= e && pEnd >= s;
      });
    }

    isCompPeriodExcluded(period) {
      if (!this.excludedPeriods || this.excludedPeriods.length === 0 || !period) return false;
      const pStart = normalizeDate(period.startDate);
      const pEnd = normalizeDate(period.compDaysApplied > 0 ? addDays(period.returnDate, -1) : period.endDate);
      if (!pStart || !pEnd) return false;
      return this.excludedPeriods.some(ex => {
        const s = normalizeDate(ex.start || ex.startDate);
        const e = normalizeDate(ex.end || ex.endDate);
        if (!s || !e) return false;
        return pStart <= e && pEnd >= s;
      });
    }

    isWorkingDay(date) {
      return this.workingDays[date.getDay()];
    }

    isHoliday(date) {
      const dateStr = formatISODate(date);
      return this.holidays.some(h => formatISODate(h.date) === dateStr);
    }

    getHolidayInfo(date) {
      const dateStr = formatISODate(date);
      return this.holidays.find(h => formatISODate(h.date) === dateStr) || null;
    }

    isDayOff(date) {
      return !this.isWorkingDay(date) || this.isHoliday(date);
    }

    isValidStart(startDate) {
      // No regime estatutário federal (Lei 8.112/90), as férias iniciam obrigatoriamente em dia útil
      return !this.isDayOff(startDate);
    }

    /**
     * Avalia rigorosamente uma janela de férias oficial [startDate, endDate]
     * @param {Date} startDate - Início oficial das férias (dia útil)
     * @param {number} length - Quantidade de dias oficiais da parcela
     * @param {number} compDays - Folgas compensatórias/banco de horas aplicadas a esta parcela
     */
    evaluatePeriod(startDate, length, compDays = 0) {
      const endDate = addDays(startDate, length - 1);

      // 1. Dias anteriores contínuos de folga (fins de semana + feriados/pontes imediatamente anteriores)
      let daysBefore = 0;
      let curr = addDays(startDate, -1);
      const holidaysBefore = [];
      while (this.isDayOff(curr)) {
        daysBefore++;
        const hol = this.getHolidayInfo(curr);
        if (hol) holidaysBefore.push({ date: new Date(curr), name: hol.name, type: hol.type });
        curr = addDays(curr, -1);
      }
      const effectiveStart = addDays(startDate, -daysBefore);

      // 2. Dias posteriores contínuos de folga (fins de semana + feriados/pontes imediatamente posteriores)
      let daysAfter = 0;
      curr = addDays(endDate, 1);
      const holidaysAfter = [];
      while (this.isDayOff(curr)) {
        daysAfter++;
        const hol = this.getHolidayInfo(curr);
        if (hol) holidaysAfter.push({ date: new Date(curr), name: hol.name, type: hol.type });
        curr = addDays(curr, 1);
      }

      // 3. Feriados dentro do período oficial de férias
      const holidaysInside = [];
      for (let i = 0; i < length; i++) {
        const d = addDays(startDate, i);
        const hol = this.getHolidayInfo(d);
        if (hol) holidaysInside.push({ date: new Date(d), name: hol.name, type: hol.type });
      }

      // 4. Verificação de dias no encerramento (dias de folga consumidos no fim da parcela)
      let wastedEndDays = 0;
      let currEnd = new Date(endDate);
      while (currEnd >= startDate && this.isDayOff(currEnd)) {
        wastedEndDays++;
        currEnd = addDays(currEnd, -1);
      }

      // 5. Aplicação controlada de folgas compensatórias / banco de horas
      let returnDate = curr;
      if (compDays > 0) {
        let compLeft = compDays;
        while (compLeft > 0) {
          if (!this.isDayOff(returnDate)) {
            compLeft--;
          }
          returnDate = addDays(returnDate, 1);
        }
        while (this.isDayOff(returnDate)) {
          returnDate = addDays(returnDate, 1);
        }
      }

      // Total de descanso contínuo real
      const totalOff = Math.round((returnDate - effectiveStart) / (1000 * 60 * 60 * 24));
      const totalHolidaysJoined = holidaysBefore.length + holidaysAfter.length;

      // Score de qualidade:
      // - Prioriza alto descanso total e emendas de feriados
      // - Aplica penalização suave a dias de repouso no fim da fração (sem bloqueios cegos)
      const qualityScore = (totalOff * 10) + (totalHolidaysJoined * 3) - (wastedEndDays * 8);

      const effectiveTotalDays = length + compDays;

      return {
        startDate,
        endDate,
        effectiveStart,
        returnDate,
        length,
        compDaysApplied: compDays,
        daysBefore,
        daysAfter,
        wastedEndDays,
        isWeekendEnd: endDate.getDay() === 0 || endDate.getDay() === 6,
        isHolidayEnd: this.isHoliday(endDate),
        qualityScore,
        totalOff,
        leverage: (totalOff / effectiveTotalDays).toFixed(1),
        holidaysBefore,
        holidaysAfter,
        holidaysInside,
        totalHolidaysJoined
      };
    }

    getSplits(totalDays, splitCount) {
      if (totalDays <= 0) return [[1]];
      if (splitCount === 1 || totalDays < splitCount) return [[totalDays]];

      // Regime Estatutário Federal (Art. 77 Lei 8.112/1990): etapas a partir de 1 dia
      const minParcel = 1;

      if (splitCount === 2) {
        const pairs = [];
        const minA = minParcel;
        const maxA = totalDays - minParcel;
        for (let a = minA; a <= maxA; a++) {
          const b = totalDays - a;
          if (b >= minParcel) {
            const sorted = [a, b].sort((x, y) => y - x);
            if (!pairs.some(p => p[0] === sorted[0] && p[1] === sorted[1])) {
              pairs.push(sorted);
            }
          }
        }
        if (pairs.length === 0) return [[totalDays]];
        pairs.sort((x, y) => Math.abs(x[0] - x[1]) - Math.abs(y[0] - y[1]));
        return pairs;
      }

      if (splitCount === 3) {
        const triplets = [];
        const minA = minParcel;
        const maxA = totalDays - (2 * minParcel);
        for (let a = minA; a <= maxA; a++) {
          for (let b = minParcel; b <= totalDays - a - minParcel; b++) {
            const c = totalDays - a - b;
            if (c >= minParcel) {
              const sorted = [a, b, c].sort((x, y) => y - x);
              if (!triplets.some(t => t[0] === sorted[0] && t[1] === sorted[1] && t[2] === sorted[2])) {
                triplets.push(sorted);
              }
            }
          }
        }

        if (triplets.length === 0) return [[totalDays]];

        // Ordenação de preferência por divisões clássicas
        triplets.sort((a, b) => {
          const strA = a.join('+');
          const strB = b.join('+');
          const getScore = (s) => {
            if (s === '10+10+10') return 120;
            if (s === '15+10+5') return 115;
            if (s === '11+10+9') return 110;
            if (s === '15+9+6') return 108;
            if (s === '16+9+5') return 105;
            if (s === '14+11+5') return 100;
            if (s === '14+8+8') return 95;
            if (s === '20+5+5') return 90;
            if (s === '12+10+8') return 85;
            return 50;
          };
          return getScore(strB) - getScore(strA);
        });

        return triplets;
      }

      return [[totalDays]];
    }

    /**
     * Motor Combinatório com Programação Dinâmica e Interval Scheduling
     * Identifica o teto matemático dinâmico para o ano e alternativas pareto-ótimas
     */
    optimize(totalDays, splitCount) {
      const splits = this.getSplits(totalDays, splitCount);
      const startWindowDate = this.windowStartDate ? new Date(this.windowStartDate) : new Date(this.year, 0, 1);

      let endWindowDate;
      if (this.windowEndDate) {
        endWindowDate = new Date(this.windowEndDate);
      } else if (this.windowStartDate) {
        const yrs = this.windowYears === 2 ? 2 : 1;
        endWindowDate = addDays(new Date(startWindowDate.getFullYear() + yrs, startWindowDate.getMonth(), startWindowDate.getDate()), -1);
      } else {
        endWindowDate = new Date(this.year, 11, 31);
      }

      function dayIndex(d) {
        return Math.round((d - startWindowDate) / (1000 * 60 * 60 * 24));
      }

      // Conjunto de comprimentos necessários
      const allLengths = new Set();
      splits.forEach(s => s.forEach(len => allLengths.add(len)));

      // 1. Gera todos os períodos candidatos por comprimento (sem compensação inicial)
      const candidatesByLen = {};
      allLengths.forEach(len => {
        candidatesByLen[len] = [];
        let curr = new Date(startWindowDate);
        while (curr <= endWindowDate) {
          if (this.isValidStart(curr)) {
            const period = this.evaluatePeriod(new Date(curr), len, 0);
            if (!this.isPeriodExcluded(period)) {
              candidatesByLen[len].push({
                period,
                effStartIdx: dayIndex(period.effectiveStart),
                returnIdx: dayIndex(period.returnDate),
                totalOff: period.totalOff,
                wasted: period.wastedEndDays
              });
            }
          }
          curr = addDays(curr, 1);
        }
      });

      const validScenarios = [];
      const minGap = this.distributeThroughoutYear ? (splitCount === 2 ? 75 : 60) : 0;
      const offset = 40; // Offset para absorver dias antes do início do ano / janela
      const totalWindowDays = Math.round((endWindowDate - startWindowDate) / (1000 * 60 * 60 * 24));
      const maxDay = Math.max(450, totalWindowDays + offset + 140);

      // 2. Otimização exata por Programação Dinâmica para cada partição de férias
      for (const split of splits) {
        if (splitCount === 1) {
          const len = split[0];
          const list = candidatesByLen[len] || [];
          list.sort((a, b) => b.totalOff - a.totalOff || a.wasted - b.wasted);
          const topList = list.slice(0, 5);

          for (const item of topList) {
            let finalPeriod = item.period;
            let finalOff = item.totalOff;
            let actualComp = 0;
            if (this.compensationDays > 0) {
              const compP = this.evaluatePeriod(item.period.startDate, item.period.length, this.compensationDays);
              if (!this.isCompPeriodExcluded(compP)) {
                finalPeriod = compP;
                finalOff = finalPeriod.totalOff;
                actualComp = this.compensationDays;
              }
            }

            const effectiveTotalDays = totalDays + actualComp;
            validScenarios.push({
              split,
              periods: [finalPeriod],
              totalOff: finalOff,
              vacationDays: totalDays,
              compensationDays: actualComp,
              extraGain: finalOff - effectiveTotalDays,
              totalWasted: finalPeriod.wastedEndDays,
              leverage: (finalOff / effectiveTotalDays).toFixed(2),
              windowStartDate: startWindowDate,
              windowEndDate: endWindowDate
            });
          }
        } else if (splitCount === 2) {
          const [a, b] = split;
          const perms = a === b ? [[a, b]] : [[a, b], [b, a]];

          for (const [L1, L2] of perms) {
            const list1 = candidatesByLen[L1] || [];
            const list2 = candidatesByLen[L2] || [];

            // DP prefixo Estágio 1
            const best1 = new Array(maxDay + 1).fill(null);
            for (const p of list1) {
              const r = p.returnIdx + offset;
              if (r < 0 || r > maxDay) continue;
              if (!best1[r] || p.totalOff > best1[r].totalOff || (p.totalOff === best1[r].totalOff && p.wasted < best1[r].wasted)) {
                best1[r] = { totalOff: p.totalOff, wasted: p.wasted, periods: [p.period] };
              }
            }
            for (let d = 1; d <= maxDay; d++) {
              if (!best1[d] || (best1[d - 1] && (best1[d - 1].totalOff > best1[d].totalOff || (best1[d - 1].totalOff === best1[d].totalOff && best1[d - 1].wasted < best1[d].wasted)))) {
                best1[d] = best1[d - 1];
              }
            }

            // Testa candidatos Estágio 2
            let bestCombo = null;
            for (const p2 of list2) {
              const startD = p2.effStartIdx - minGap + offset;
              if (startD <= 0) continue;
              const prev = best1[startD];
              if (!prev) continue;
              const combinedOff = prev.totalOff + p2.totalOff;
              const combinedWasted = prev.wasted + p2.wasted;

              if (!bestCombo || combinedOff > bestCombo.totalOff || (combinedOff === bestCombo.totalOff && combinedWasted < bestCombo.totalWasted)) {
                bestCombo = {
                  split,
                  periods: [...prev.periods, p2.period],
                  totalOff: combinedOff,
                  totalWasted: combinedWasted
                };
              }
            }

            if (bestCombo) {
              this._applyCompensationAndPushScenario(validScenarios, bestCombo, totalDays);
            }
          }
        } else if (splitCount === 3) {
          const [a, b, c] = split;
          const rawPerms = [
            [a, b, c], [a, c, b],
            [b, a, c], [b, c, a],
            [c, a, b], [c, b, a]
          ];
          const permSet = new Set();
          const perms = rawPerms.filter(p => {
            const k = p.join(',');
            if (permSet.has(k)) return false;
            permSet.add(k);
            return true;
          });

          for (const [L1, L2, L3] of perms) {
            const list1 = candidatesByLen[L1] || [];
            const list2 = candidatesByLen[L2] || [];
            const list3 = candidatesByLen[L3] || [];

            // DP prefixo Estágio 1
            const best1 = new Array(maxDay + 1).fill(null);
            for (const p of list1) {
              const r = p.returnIdx + offset;
              if (r < 0 || r > maxDay) continue;
              if (!best1[r] || p.totalOff > best1[r].totalOff || (p.totalOff === best1[r].totalOff && p.wasted < best1[r].wasted)) {
                best1[r] = { totalOff: p.totalOff, wasted: p.wasted, periods: [p.period] };
              }
            }
            for (let d = 1; d <= maxDay; d++) {
              if (!best1[d] || (best1[d - 1] && (best1[d - 1].totalOff > best1[d].totalOff || (best1[d - 1].totalOff === best1[d].totalOff && best1[d - 1].wasted < best1[d].wasted)))) {
                best1[d] = best1[d - 1];
              }
            }

            // DP prefixo Estágio 2 com espaçamento saudável
            const best2 = new Array(maxDay + 1).fill(null);
            for (const p2 of list2) {
              const startD = p2.effStartIdx - minGap + offset;
              if (startD <= 0) continue;
              const prev = best1[startD];
              if (!prev) continue;
              const r2 = p2.returnIdx + offset;
              if (r2 < 0 || r2 > maxDay) continue;
              const combinedOff = prev.totalOff + p2.totalOff;
              const combinedWasted = prev.wasted + p2.wasted;

              if (!best2[r2] || combinedOff > best2[r2].totalOff || (combinedOff === best2[r2].totalOff && combinedWasted < best2[r2].wasted)) {
                best2[r2] = { totalOff: combinedOff, wasted: combinedWasted, periods: [...prev.periods, p2.period] };
              }
            }
            for (let d = 1; d <= maxDay; d++) {
              if (!best2[d] || (best2[d - 1] && (best2[d - 1].totalOff > best2[d].totalOff || (best2[d - 1].totalOff === best2[d].totalOff && best2[d - 1].wasted < best2[d].wasted)))) {
                best2[d] = best2[d - 1];
              }
            }

            // Testa candidatos Estágio 3
            let bestCombo = null;
            for (const p3 of list3) {
              const startD = p3.effStartIdx - minGap + offset;
              if (startD <= 0) continue;
              const prev = best2[startD];
              if (!prev) continue;
              const combinedOff = prev.totalOff + p3.totalOff;
              const combinedWasted = prev.wasted + p3.wasted;

              if (!bestCombo || combinedOff > bestCombo.totalOff || (combinedOff === bestCombo.totalOff && combinedWasted < bestCombo.totalWasted)) {
                bestCombo = {
                  split,
                  periods: [...prev.periods, p3.period],
                  totalOff: combinedOff,
                  totalWasted: combinedWasted
                };
              }
            }

            if (bestCombo) {
              this._applyCompensationAndPushScenario(validScenarios, bestCombo, totalDays);
            }
          }
        }
      }

      // Ordena cenários pelo descanso total (1º) e menor desperdício no fim (2º)
      validScenarios.sort((a, b) => {
        if (b.totalOff !== a.totalOff) return b.totalOff - a.totalOff;
        return a.totalWasted - b.totalWasted;
      });

      // 3. Montagem de ranking transparente e diversificado
      const uniqueScenarios = [];
      const seenSplits = new Set();
      const seenKeys = new Set();

      // Top absoluto (sem filtros cegos)
      for (const s of validScenarios) {
        const splitKey = s.split.join('+');
        const key = s.periods.map(p => `${formatISODate(p.startDate)}_${p.length}`).join('|');
        if (!seenSplits.has(splitKey) && !seenKeys.has(key)) {
          seenSplits.add(splitKey);
          seenKeys.add(key);
          uniqueScenarios.push(s);
          if (uniqueScenarios.length >= 4) break;
        }
      }

      // Garante presença do clássico 10+10+10 se houver
      if (totalDays === 30 && splitCount === 3 && !seenSplits.has('10+10+10')) {
        const best10 = validScenarios.find(s => s.split.join('+') === '10+10+10');
        if (best10) {
          const key = best10.periods.map(p => `${formatISODate(p.startDate)}_${p.length}`).join('|');
          seenSplits.add('10+10+10');
          seenKeys.add(key);
          uniqueScenarios.push(best10);
        }
      }

      // Garante presença do clássico 15+10+5 se houver
      if (totalDays === 30 && splitCount === 3 && !seenSplits.has('15+10+5')) {
        const best15 = validScenarios.find(s => s.split.join('+') === '15+10+5');
        if (best15) {
          const key = best15.periods.map(p => `${formatISODate(p.startDate)}_${p.length}`).join('|');
          seenSplits.add('15+10+5');
          seenKeys.add(key);
          uniqueScenarios.push(best15);
        }
      }

      // Completa com opções de zero desperdício se existirem
      const zeroWasteOption = validScenarios.find(s => s.totalWasted === 0 && !seenKeys.has(s.periods.map(p => `${formatISODate(p.startDate)}_${p.length}`).join('|')));
      if (zeroWasteOption && uniqueScenarios.length < 6) {
        const key = zeroWasteOption.periods.map(p => `${formatISODate(p.startDate)}_${p.length}`).join('|');
        seenKeys.add(key);
        uniqueScenarios.push(zeroWasteOption);
      }

      // Completa com outras ótimas alternativas até 6 opções
      for (const s of validScenarios) {
        const key = s.periods.map(p => `${formatISODate(p.startDate)}_${p.length}`).join('|');
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          uniqueScenarios.push(s);
          if (uniqueScenarios.length >= 6) break;
        }
      }

      return uniqueScenarios.sort((a, b) => {
        if (b.totalOff !== a.totalOff) return b.totalOff - a.totalOff;
        return a.totalWasted - b.totalWasted;
      });
    }

    /**
     * Aplica o banco de horas de forma cirúrgica e proporcional:
     * Testa qual parcela entrega a maior alavancagem marginal com os dias extras informados,
     * sem multiplicar o banco de horas nem causar sobreposição.
     */
    _applyCompensationAndPushScenario(targetList, combo, totalDays) {
      let finalPeriods = combo.periods;
      let finalTotalOff = combo.totalOff;
      let finalWasted = combo.totalWasted;
      let actualComp = 0;

      if (this.compensationDays > 0) {
        let bestStageIdx = -1;
        let maxCompGain = 0;
        let bestCompPeriod = null;

        for (let i = 0; i < combo.periods.length; i++) {
          const baseP = combo.periods[i];
          const evaluatedComp = this.evaluatePeriod(baseP.startDate, baseP.length, this.compensationDays);
          const nextP = combo.periods[i + 1];

          // Garante que a extensão de compensação não colida com o período seguinte e não toque períodos excluídos
          if ((!nextP || evaluatedComp.returnDate <= nextP.effectiveStart) && !this.isCompPeriodExcluded(evaluatedComp)) {
            const gain = evaluatedComp.totalOff - baseP.totalOff;
            if (gain > maxCompGain) {
              maxCompGain = gain;
              bestStageIdx = i;
              bestCompPeriod = evaluatedComp;
            }
          }
        }

        if (bestStageIdx !== -1) {
          actualComp = this.compensationDays;
          finalPeriods = [...combo.periods];
          finalPeriods[bestStageIdx] = {
            ...bestCompPeriod,
            compDaysApplied: this.compensationDays
          };
          finalTotalOff += maxCompGain;
          finalWasted = finalPeriods.reduce((acc, p) => acc + p.wastedEndDays, 0);
        }
      }

      const effectiveTotalDays = totalDays + actualComp;
      targetList.push({
        split: combo.split,
        periods: finalPeriods,
        totalOff: finalTotalOff,
        vacationDays: totalDays,
        compensationDays: actualComp,
        extraGain: finalTotalOff - effectiveTotalDays,
        totalWasted: finalWasted,
        leverage: (finalTotalOff / effectiveTotalDays).toFixed(2),
        windowStartDate: this.windowStartDate || new Date(this.year, 0, 1),
        windowEndDate: this.windowEndDate || new Date(this.year, 11, 31)
      });
    }
  }

  return { VacationOptimizer };
});

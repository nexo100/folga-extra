/**
 * ribbon.js - Motor da Fita Anual do Tempo (Annual Rhythm Ribbon)
 * Renderiza uma linha do tempo panorâmica horizontal de 12 meses (Jan a Dez),
 * destacando a cadência, densidade de pausas e o ritmo de recarga ao longo do ano.
 * Atualiza dinamicamente conforme o cenário selecionado pelo usuário.
 * Zero dependência de DOM / HTML.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    const holidays = require('./holidays.js');
    module.exports = factory(holidays);
  } else {
    root.AnnualRibbonEngine = factory(root.HolidaysEngine);
  }
})(typeof self !== 'undefined' ? self : this, function (HolidaysEngine) {
  'use strict';

  const { formatDate, parseDate } = HolidaysEngine || {};

  const MONTH_SHORT = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  const MONTH_FULL = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  /**
   * Renderiza a Fita Anual do Tempo para um cenário específico de férias
   * @param {Object} scenario - Cenário retornado pelo VacationOptimizer
   * @param {number} year - Ano de referência
   * @param {number} scenarioIndex - Índice do cenário selecionado (0-based)
   * @param {Array} holidaysList - Lista opcional de feriados para enriquecer meses sem férias
   * @returns {string} HTML da fita panorâmica
   */
  function renderAnnualRibbon(scenario, year, scenarioIndex = 0, holidaysList = null, customWindow = null) {
    if (!scenario || !scenario.periods) return '';

    let isCustomWindow = false;
    let winStart = null;
    let winEnd = null;

    if (customWindow && (customWindow.enabled !== false) && (customWindow.windowStartDate || customWindow.startDate)) {
      isCustomWindow = true;
      winStart = parseDate ? parseDate(customWindow.windowStartDate || customWindow.startDate) : new Date(customWindow.windowStartDate || customWindow.startDate);
      if (customWindow.windowEndDate || customWindow.endDate) {
        winEnd = parseDate ? parseDate(customWindow.windowEndDate || customWindow.endDate) : new Date(customWindow.windowEndDate || customWindow.endDate);
      } else if (scenario && (scenario.windowEndDate || scenario.endDate)) {
        winEnd = parseDate ? parseDate(scenario.windowEndDate || scenario.endDate) : new Date(scenario.windowEndDate || scenario.endDate);
      } else if (customWindow.windowYears === 2 || customWindow.durationYears === 2) {
        winEnd = new Date(winStart.getFullYear() + 2, winStart.getMonth(), winStart.getDate() - 1);
      } else {
        winEnd = new Date(winStart.getFullYear() + 1, winStart.getMonth(), winStart.getDate() - 1);
      }
    } else if (scenario && scenario.windowStartDate && scenario.windowEndDate) {
      const s = parseDate ? parseDate(scenario.windowStartDate) : new Date(scenario.windowStartDate);
      const e = parseDate ? parseDate(scenario.windowEndDate) : new Date(scenario.windowEndDate);
      if (s.getMonth() !== 0 || s.getDate() !== 1 || e.getFullYear() !== s.getFullYear() || e.getMonth() !== 11) {
        isCustomWindow = true;
        winStart = s;
        winEnd = e;
      }
    }

    const monthsData = [];
    if (isCustomWindow && winStart) {
      if (!winEnd) {
        winEnd = new Date(winStart.getFullYear() + 1, winStart.getMonth(), winStart.getDate());
      }
      let currMonth = new Date(winStart.getFullYear(), winStart.getMonth(), 1);
      let lastMonth = new Date(winEnd.getFullYear(), winEnd.getMonth(), 1);

      // Garante que meses onde as férias terminam (mesmo pós-janela) sejam renderizados na fita
      if (scenario.periods && Array.isArray(scenario.periods)) {
        scenario.periods.forEach(p => {
          const pEnd = parseDate ? parseDate(p.returnDate || p.endDate) : new Date(p.returnDate || p.endDate);
          if (pEnd) {
            const pEndMonth = new Date(pEnd.getFullYear(), pEnd.getMonth(), 1);
            if (pEndMonth > lastMonth) {
              lastMonth = pEndMonth;
            }
          }
        });
      }

      const isMultiYear = lastMonth.getFullYear() > winStart.getFullYear();

      while (currMonth <= lastMonth) {
        const mIdx = currMonth.getMonth();
        const mYear = currMonth.getFullYear();
        monthsData.push({
          monthIndex: mIdx,
          year: mYear,
          monthName: isMultiYear ? `${MONTH_SHORT[mIdx]}'${String(mYear).slice(2)}` : MONTH_SHORT[mIdx],
          fullName: `${MONTH_FULL[mIdx]} de ${mYear}`,
          activeStages: [],
          totalOffInMonth: 0,
          holidaysCount: 0
        });
        currMonth = new Date(mYear, mIdx + 1, 1);
      }
    } else {
      for (let mIdx = 0; mIdx < 12; mIdx++) {
        monthsData.push({
          monthIndex: mIdx,
          year: typeof year === 'number' ? year : (parseInt(year) || new Date().getFullYear()),
          monthName: MONTH_SHORT[mIdx],
          fullName: MONTH_FULL[mIdx],
          activeStages: [],
          totalOffInMonth: 0,
          holidaysCount: 0
        });
      }
    }

    if (holidaysList && Array.isArray(holidaysList)) {
      holidaysList.forEach(h => {
        const d = new Date(h.date);
        const m = monthsData.find(md => md.year === d.getFullYear() && md.monthIndex === d.getMonth());
        if (m) {
          m.holidaysCount++;
        }
      });
    }

    scenario.periods.forEach((p, pIdx) => {
      let curr = new Date(p.effectiveStart);
      const end = new Date(p.returnDate);

      while (curr < end) {
        const cYear = curr.getFullYear();
        const cMonth = curr.getMonth();
        const m = monthsData.find(md => md.year === cYear && md.monthIndex === cMonth);
        if (m) {
          if (!m.activeStages.some(s => s.stageIndex === pIdx + 1)) {
            m.activeStages.push({
              stageIndex: pIdx + 1,
              length: p.length,
              totalOff: p.totalOff,
              startDate: p.startDate,
              endDate: p.endDate
            });
          }
          m.totalOffInMonth++;
        }
        curr.setDate(curr.getDate() + 1);
      }
    });

    const isChampion = scenarioIndex === 0;
    const splitText = scenario.split ? scenario.split.join(' + ') : '';
    const yearHeaderText = isCustomWindow && winStart && winEnd
      ? `${formatDate(winStart)} a ${formatDate(winEnd)}`
      : `${year}`;

    let html = `
      <div class="bg-white text-slate-900 rounded-3xl p-5 sm:p-6 shadow-card border border-slate-200/90 space-y-4 transition-all duration-300">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div class="flex items-center gap-3">
            <span class="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
              <i data-lucide="activity" class="w-4 h-4 text-slate-700"></i>
            </span>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h4 class="font-extrabold text-sm sm:text-base text-slate-950 tracking-tight">
                  Fita Anual do Tempo • Distribuição em ${yearHeaderText}
                </h4>
                <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isChampion ? 'bg-amber-100 text-amber-950 border border-amber-300' : 'bg-slate-100 text-slate-800 border border-slate-200'} shadow-2xs">
                  ${isChampion ? '<i data-lucide="crown" class="w-3 h-3 text-amber-600"></i>' : ''}
                  Visualizando: Opção ${scenarioIndex + 1} (${splitText} dias)
                </span>
              </div>
              <p class="text-[11px] text-slate-500 mt-0.5">Mostrando a cadência real da opção selecionada abaixo (${scenario.totalOff} dias livres no total).</p>
            </div>
          </div>
          
          <div class="flex items-center gap-2 text-xs self-start sm:self-auto">
            <span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[11px] font-bold shadow-2xs">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              ${scenario.totalOff} Dias Sem Trabalhar (${scenario.extraGain >= 0 ? '+' : ''}${scenario.extraGain}d Ganho)
            </span>
          </div>
        </div>

        <!-- GRADE DOS MESES DA JANELA -->
        <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2 text-center">
    `;

    monthsData.forEach((m) => {
      const hasVacation = m.activeStages.length > 0;
      const hCount = m.holidaysCount;

      const stageLabels = m.activeStages.map(s => {
        return `<span class="px-1.5 py-0.5 rounded-md bg-slate-900 text-white font-bold text-[9px] shadow-2xs whitespace-nowrap" title="Etapa ${s.stageIndex} (${s.length}d)">${s.stageIndex}ª Parcela</span>`;
      }).join(' ');

      const daysInMonth = new Date(m.year, m.monthIndex + 1, 0).getDate();
      const vacationDays = Math.min(daysInMonth, m.totalOffInMonth);
      const vacationPct = Math.round((vacationDays / daysInMonth) * 100);
      const holidayDays = Math.min(daysInMonth, hCount);
      const holidayPct = Math.round((holidayDays / daysInMonth) * 100);

      html += `
        <div class="flex flex-col justify-between rounded-2xl p-2.5 transition-all duration-300 ${
          hasVacation 
            ? 'bg-gradient-to-br from-amber-100/90 via-sky-50/90 to-indigo-100/80 border-2 border-amber-400 shadow-md scale-[1.02]' 
            : 'bg-slate-50/70 border border-slate-200/70 hover:border-slate-300'
        }" title="${hasVacation ? `${m.totalOffInMonth} dias livres de ${daysInMonth} dias (${vacationPct}% do mês)` : (hCount > 0 ? `${hCount} feriado(s) de ${daysInMonth} dias (${holidayPct}% do mês)` : `${daysInMonth} dias de expediente pleno`)}">
          <div class="flex items-center justify-between gap-1 mb-1.5">
            <span class="font-extrabold text-[11px] tracking-wider ${hasVacation ? 'text-slate-950 font-black' : 'text-slate-400'}">
              ${m.monthName}
            </span>
            ${hasVacation ? '<i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-600"></i>' : ''}
          </div>

          <div class="min-h-[46px] flex flex-col items-center justify-center gap-1 py-1">
            ${hasVacation ? `
              <div class="flex flex-col items-center gap-1 w-full">
                ${stageLabels}
                <span class="text-[10px] text-slate-950 font-mono font-black">
                  ${m.totalOffInMonth}d folga
                </span>
              </div>
            ` : `
              <div class="flex flex-col items-center gap-1 w-full">
                <span class="text-[10px] text-slate-400 font-medium">Expediente</span>
                ${hCount > 0 ? `
                  <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200/70 shadow-2xs">
                    <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    ${hCount} ${hCount === 1 ? 'feriado' : 'feriados'}
                  </span>
                ` : `
                  <span class="text-[9px] text-slate-300 font-mono">0 feriados</span>
                `}
              </div>
            `}
          </div>

          <div class="mt-1 w-full bg-slate-200/60 rounded-full h-1.5 overflow-hidden">
            <div class="${hasVacation ? 'bg-amber-500' : (hCount > 0 ? 'bg-amber-400/80' : 'bg-transparent')} h-full rounded-full transition-all duration-500"
              style="width: ${hasVacation ? vacationPct : (hCount > 0 ? Math.max(6, holidayPct) : 0)}%;">
            </div>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    return html;
  }

  return {
    renderAnnualRibbon
  };
});

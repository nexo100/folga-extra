/**
 * mini-calendar.js - Renderizador Visual da Grade 7xN do Mês (Design System Elevado)
 * Responsabilidade única:
 * - Grade mensal 7xN com contraste aprimorado e tipografia limpa
 * - Destaques visuais elegantes (Design System Oficial):
 *   - Slate-900 (Preenchimento Escuro Único): Férias Regulamentares
 *   - Borda Âmbar-400: Feriado Oficial (Nacional, Estadual ou Municipal)
 *   - Borda Azul-400: Ponto Facultativo / Recesso MGI / Pontes
 *   - Borda Índigo-400: Repouso Semanal (Sábado e Domingo)
 *   - Fundo Esmeralda-600: 1º Dia Útil de Retorno ao Trabalho
 * - Zero dependência de DOM / HTML
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    const holidays = require('./holidays.js');
    module.exports = factory(holidays);
  } else {
    root.MiniCalendarEngine = factory(root.HolidaysEngine);
  }
})(typeof self !== 'undefined' ? self : this, function (HolidaysEngine) {
  'use strict';

  const { formatISODate } = HolidaysEngine;

  function getHolidayCategory(hInfo) {
    if (!hInfo) return 'feriado';
    const type = (hInfo.type || '').toLowerCase();
    const name = (hInfo.name || '').toLowerCase();
    if (
      type === 'recesso' ||
      type === 'vespera' ||
      type === 'ponte' ||
      type === 'servidor' ||
      name.includes('facultativo') ||
      name.includes('recesso') ||
      name.includes('ponte') ||
      name.includes('véspera') ||
      name.includes('vespera')
    ) {
      return 'facultativo';
    }
    return 'feriado';
  }

  function renderMiniCalendar(p, optimizer) {
    const startMonth = p.effectiveStart.getMonth();
    const startYear = p.effectiveStart.getFullYear();
    const endMonth = p.returnDate.getMonth();
    const endYear = p.returnDate.getFullYear();

    const months = [];
    let curY = startYear;
    let curM = startMonth;
    while (curY < endYear || (curY === endYear && curM <= endMonth)) {
      months.push({ month: curM, year: curY });
      curM++;
      if (curM > 11) {
        curM = 0;
        curY++;
      }
    }

    const MONTH_NAMES = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const DOW_HEADERS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

    let html = `<div class="grid grid-cols-1 ${months.length > 1 ? 'md:grid-cols-2' : ''} gap-3 pt-2">`;

    months.forEach(({ month, year }) => {
      const firstDayIndex = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      html += `
        <div class="bg-white border-2 border-slate-300/80 rounded-2xl p-3.5 sm:p-4 shadow-sm">
          <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
            <span class="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <i data-lucide="calendar" class="w-3.5 h-3.5 text-slate-700"></i> ${MONTH_NAMES[month]} ${year}
            </span>
            <span class="text-[10px] text-slate-500 font-medium tracking-wide">Dias da Etapa</span>
          </div>
          <div class="grid grid-cols-7 gap-1 text-center text-[9px] font-bold text-slate-400 mb-1.5">
            ${DOW_HEADERS.map(d => `<div>${d}</div>`).join('')}
          </div>
          <div class="grid grid-cols-7 gap-1 text-center text-[11px] font-mono">
      `;

      for (let b = 0; b < firstDayIndex; b++) {
        html += `<div class="py-1"></div>`;
      }

      for (let day = 1; day <= daysInMonth; day++) {
        const curDate = new Date(year, month, day);
        const iso = formatISODate(curDate);
        const isReturn = formatISODate(p.returnDate) === iso;
        const isOffPeriod = curDate >= p.effectiveStart && curDate < p.returnDate;
        const isHoliday = optimizer.isHoliday(curDate);
        const isWeekend = !optimizer.isWorkingDay(curDate);
        const hInfo = isHoliday ? optimizer.getHolidayInfo(curDate) : null;
        const holCat = hInfo ? getHolidayCategory(hInfo) : null;

        let cellStyle = 'py-1 rounded-xl transition-all font-semibold select-none ';
        let tooltip = `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;

        if (isReturn) {
          cellStyle += 'bg-emerald-600 text-white font-black shadow-xs border-[3px] border-emerald-500';
          tooltip += ' • Retorno ao Trabalho';
        } else if (isOffPeriod) {
          // TODOS os dias de férias recebem RIGOROSAMENTE o mesmo fundo de preenchimento escuro
          // As particularidades (Feriado, Ponto Facultativo, Fim de Semana) são destacadas por bordas grossas!
          cellStyle += 'bg-slate-900 text-white font-bold shadow-xs ';
          if (isHoliday) {
            if (holCat === 'facultativo') {
              cellStyle += 'border-[3px] border-blue-400 ring-1 ring-blue-300/50';
              tooltip += ` • Férias (Ponto Facultativo: ${hInfo.name || 'Ponto Facultativo'})${isWeekend ? ' • Fim de Semana' : ''}`;
            } else {
              cellStyle += 'border-[3px] border-amber-400 ring-1 ring-amber-400/50';
              tooltip += ` • Férias (Feriado: ${hInfo.name || 'Feriado'})${isWeekend ? ' • Fim de Semana' : ''}`;
            }
          } else if (isWeekend) {
            cellStyle += 'border-[3px] border-indigo-400 ring-1 ring-indigo-300/50';
            tooltip += ' • Férias (Fim de Semana)';
          } else {
            cellStyle += 'border-[3px] border-slate-700';
            tooltip += ' • Férias';
          }
        } else if (isHoliday) {
          if (holCat === 'facultativo') {
            cellStyle += 'text-blue-800 font-bold bg-blue-50/70 border-[3px] border-blue-300';
            tooltip += ` • Ponto Facultativo: ${hInfo ? hInfo.name : 'Ponto Facultativo'}`;
          } else {
            cellStyle += 'text-amber-800 font-bold bg-amber-50/70 border-[3px] border-amber-300';
            tooltip += ` • Feriado: ${hInfo ? hInfo.name : 'Feriado'}`;
          }
        } else {
          cellStyle += isWeekend ? 'text-slate-300 font-normal border-[3px] border-transparent' : 'text-slate-600 hover:bg-slate-100 border-[3px] border-transparent';
        }

        html += `<div class="${cellStyle}" title="${tooltip}">${day}</div>`;
      }

      html += `
          </div>
        </div>
      `;
    });

    html += `</div>`;

    // Legenda moderna, nítida e unificada: todas as caixas de férias usam o mesmo preenchimento e bordas grossas distintivas
    html += `
      <div class="flex items-center gap-3 pt-2 text-[10px] text-slate-600 flex-wrap font-medium">
        <span class="flex items-center gap-1.5"><span class="w-4 h-4 rounded-md bg-slate-900 border-[3px] border-slate-700 inline-block shadow-xs"></span> Férias</span>
        <span class="flex items-center gap-1.5"><span class="w-4 h-4 rounded-md bg-slate-900 border-[3px] border-amber-400 inline-block shadow-xs"></span> Feriado</span>
        <span class="flex items-center gap-1.5"><span class="w-4 h-4 rounded-md bg-slate-900 border-[3px] border-blue-400 inline-block shadow-xs"></span> Ponto Facultativo</span>
        <span class="flex items-center gap-1.5"><span class="w-4 h-4 rounded-md bg-slate-900 border-[3px] border-indigo-400 inline-block shadow-xs"></span> Fim de Semana</span>
        <span class="flex items-center gap-1.5"><span class="w-4 h-4 rounded-md bg-emerald-600 border-[3px] border-emerald-500 inline-block shadow-xs"></span> Retorno ao Trabalho</span>
      </div>
    `;

    return html;
  }

  return { renderMiniCalendar };
});

/**
 * render.js - Motor de Renderização de Templates e Componentes Visuais
 * Responsabilidade:
 * - Geração de markup HTML para Cards de Cenários (Boarding Pass Itinerary)
 * - Badges de mérito e sazonalidade (Campeã, Desperdício Zero, Julho, Fim de Ano)
 * - Tabela corporativa formatada para exportação ao SEI-UFBA, Word e E-mail
 * - Padrão UMD compatível com navegador e Node.js
 * - Zero acoplamento de estado mutável direto (recebe dados como parâmetro)
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    const holidays = require('./holidays.js');
    module.exports = factory(holidays);
  } else {
    root.RenderEngine = factory(root.HolidaysEngine);
  }
})(typeof self !== 'undefined' ? self : this, function (HolidaysEngine) {
  'use strict';

  const { formatDate, DAYS_NAME } = HolidaysEngine || {
    formatDate: (d) => (d instanceof Date ? d.toLocaleDateString('pt-BR') : String(d)),
    DAYS_NAME: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  };

  /**
   * Gera os badges de mérito do card de cenário
   */
  function buildBadgesHtml(sc, sIdx, distributeThroughoutYear) {
    let html = '';
    const partitionKey = sc.partition ? sc.partition.join('+') : (sc.split ? sc.split.slice().sort((a, b) => b - a).join('+') : '');
    const splitKey = sc.split ? sc.split.join('+') : '';

    if (sIdx === 0 || sc.category === 'Campeã') {
      html += `<span class="bg-amber-100 text-amber-950 border border-amber-300 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider shadow-2xs flex items-center gap-1.5"><i data-lucide="crown" class="w-3.5 h-3.5 text-amber-700"></i> Campeã</span>`;
    } else if (sIdx === 1 || sc.category === 'Campeã Alternativa') {
      html += `<span class="bg-amber-50 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xs"><i data-lucide="crown" class="w-3.5 h-3.5 text-amber-600"></i> Campeã Alternativa</span>`;
    } else if (sc.category === 'Férias de Julho' || sc.category === 'Férias de Julho Alternativa') {
      html += `<span class="bg-sky-50 text-sky-900 border border-sky-300 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-2xs"><i data-lucide="sun" class="w-3.5 h-3.5 text-sky-600"></i> Férias de Julho</span>`;
    } else if (sc.category === 'Recesso Fim de Ano' || sc.category === 'Recesso Fim de Ano Alternativo') {
      html += `<span class="bg-purple-50 text-purple-900 border border-purple-300 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-2xs"><i data-lucide="calendar-heart" class="w-3.5 h-3.5 text-purple-600"></i> Recesso Fim de Ano</span>`;
    } else if (sc.category === 'Outono / Páscoa') {
      html += `<span class="bg-orange-50 text-orange-900 border border-orange-300 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-2xs"><i data-lucide="flower" class="w-3.5 h-3.5 text-orange-600"></i> Outono / Páscoa</span>`;
    } else if (partitionKey === '10+10+10' || splitKey === '10+10+10') {
      html += `<span class="bg-slate-100 text-slate-800 border border-slate-200 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-2xs"><i data-lucide="star" class="w-3.5 h-3.5 text-slate-600"></i> 10+10+10</span>`;
    } else if (partitionKey === '15+10+5') {
      html += `<span class="bg-indigo-50 text-indigo-900 border border-indigo-200 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-2xs"><i data-lucide="zap" class="w-3.5 h-3.5 text-indigo-600"></i> 15+10+5</span>`;
    } else {
      html += `<span class="bg-slate-100 text-slate-800 border border-slate-200 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-2xs"><i data-lucide="sparkles" class="w-3.5 h-3.5 text-slate-600"></i> Alta Alavancagem</span>`;
    }

    if (sc.totalWasted === 0) {
      html += `<span class="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-2xs"><i data-lucide="check-check" class="w-3.5 h-3.5 text-emerald-600"></i> Desperdício Zero</span>`;
    }

    if (distributeThroughoutYear) {
      html += `<span class="bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-2xs"><i data-lucide="shield-check" class="w-3.5 h-3.5 text-teal-600"></i> Anti-Fadiga</span>`;
    }
    return html;
  }

  /**
   * Gera o bloco HTML de uma etapa individual (itinerário boarding pass + mini-calendário)
   */
  function buildPeriodHtml(sc, sIdx, p, pIdx, optimizer, state, miniCalendarRenderer) {
    const joinedHolidays = [...(p.holidaysBefore || []), ...(p.holidaysAfter || []), ...(p.holidaysInside || [])];
    const holidayTags = joinedHolidays.map(h => {
      const isFacultativo = h.type === 'recesso' || h.type === 'vespera' || h.type === 'ponte' || h.type === 'servidor' || (h.name && h.name.toLowerCase().includes('facultativo'));
      const colorClass = isFacultativo
        ? 'bg-blue-50 text-blue-900 border border-blue-300'
        : 'bg-amber-100 text-amber-950 border border-amber-300';
      return `<span class="${colorClass} px-2.5 py-0.5 rounded-lg text-[10px] font-bold shadow-2xs">${h.name}</span>`;
    }).join(' ');

    const endStatusHtml = p.wastedEndDays === 0
      ? `<span class="text-emerald-700 font-bold text-[10px] flex items-center gap-1 mt-0.5"><i data-lucide="check" class="w-3 h-3 text-emerald-600"></i> Termina em dia útil (${DAYS_NAME[p.endDate.getDay()]})</span>`
      : `<span class="text-amber-800 font-bold text-[10px] flex items-center gap-1 mt-0.5" title="O último dia oficial cai em repouso"><i data-lucide="alert-circle" class="w-3 h-3 text-amber-600"></i> Termina em ${DAYS_NAME[p.endDate.getDay()]} (${p.wastedEndDays}d em repouso)</span>`;

    let gapHtml = '';
    if (pIdx > 0) {
      const prevP = sc.periods[pIdx - 1];
      const gapDays = Math.round((p.effectiveStart - prevP.returnDate) / (1000 * 60 * 60 * 24));
      const monthsVal = (gapDays / 30.4).toFixed(1);
      const monthsStr = monthsVal.endsWith('.0') ? `${parseInt(monthsVal)} meses` : `${monthsVal} meses`;
      const isAntiFadiga = state && state.distributeThroughoutYear;

      gapHtml = `
        <div id="gapConnector_${sIdx}_${pIdx}" class="hidden flex items-center justify-center my-4 relative select-none">
          <div class="absolute inset-0 flex items-center" aria-hidden="true">
            <div class="w-full border-t-2 border-dashed border-slate-400"></div>
          </div>
          <div class="relative z-10 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-300 border-2 border-slate-400 text-slate-800 text-xs shadow-xs font-bold">
            <div class="w-2 h-2 rounded-full ${isAntiFadiga ? 'bg-teal-500' : 'bg-slate-600'}"></div>
            <i data-lucide="clock" class="w-3.5 h-3.5 text-slate-700"></i>
            <span>Intervalo de Trabalho: <strong class="text-slate-950 font-mono font-bold">${gapDays} dias</strong> <span class="text-slate-700 font-medium">(~${monthsStr} de recarga)</span></span>
            ${isAntiFadiga ? `
              <span class="ml-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-teal-50 text-teal-800 border border-teal-200/80 flex items-center gap-1 shadow-2xs">
                <i data-lucide="shield-check" class="w-3 h-3 text-teal-600"></i> Espaçamento Anti-Fadiga
              </span>
            ` : ''}
          </div>
        </div>
      `;
    }

    let bottomNav = '';
    if (sc.periods.length > 1) {
      bottomNav = `
        <div class="flex items-center justify-between pt-3 border-t border-slate-200 text-xs">
          ${pIdx > 0 ? `
            <button type="button" onclick="event.stopPropagation(); window.OtimizaApp.selectStageTab(${sIdx}, ${pIdx - 1}, ${sc.periods.length})"
              class="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs">
              <i data-lucide="chevron-left" class="w-3.5 h-3.5"></i>
              <span>Etapa ${pIdx} (${sc.periods[pIdx - 1].length}d)</span>
            </button>
          ` : '<div></div>'}
          ${pIdx < sc.periods.length - 1 ? `
            <button type="button" onclick="event.stopPropagation(); window.OtimizaApp.selectStageTab(${sIdx}, ${pIdx + 1}, ${sc.periods.length})"
              class="px-3.5 py-1.5 rounded-xl border border-slate-900 bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs">
              <span>Próxima: Etapa ${pIdx + 2} (${sc.periods[pIdx + 1].length}d)</span>
              <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
            </button>
          ` : `
            <button type="button" onclick="event.stopPropagation(); window.OtimizaApp.selectStageTab(${sIdx}, 'all', ${sc.periods.length})"
              class="text-[11px] font-bold text-slate-600 hover:text-slate-950 flex items-center gap-1 cursor-pointer">
              <span>Ver todas as etapas juntas</span>
              <i data-lucide="layers" class="w-3 h-3"></i>
            </button>
          `}
        </div>
      `;
    }

    const calendarHtml = typeof miniCalendarRenderer === 'function' ? miniCalendarRenderer(p, optimizer) : '';

    return `
      ${gapHtml}
      <div id="stageContainer_${sIdx}_${pIdx}" class="${(sc.periods.length === 1 || pIdx === 0) ? '' : 'hidden'} space-y-3">
        <div class="bg-white/95 border-2 border-amber-300/80 rounded-2xl p-5 space-y-4 shadow-sm ring-1 ring-amber-400/20">

          <!-- HEADER DA ETAPA -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-amber-200/80 pb-3">
            <div class="flex items-center gap-2.5">
              <span class="w-7 h-7 rounded-lg bg-slate-900 text-white font-mono font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">${String(pIdx + 1).padStart(2, '0')}</span>
              <span class="font-extrabold text-slate-900 text-sm tracking-tight">Etapa ${pIdx + 1} • <span class="font-mono">${p.length}</span> Dias Marcados</span>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
              ${p.compDaysApplied > 0 ? `
                <span class="text-xs font-bold text-sky-800 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1 shadow-2xs" title="Aplicação de ${p.compDaysApplied} dias de banco de horas">
                  <i data-lucide="clock" class="w-3 h-3 text-sky-600"></i> +${p.compDaysApplied}d Banco
                </span>
              ` : ''}
              <span class="text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg shadow-2xs">
                🔥 ${p.totalOff} Dias Livres
              </span>
              <span class="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-2xs">
                <i data-lucide="trending-up" class="w-3 h-3 text-slate-500"></i> ${p.leverage}x
              </span>
            </div>
          </div>

          <!-- FLATTENED 3-COLUMN LINEAR BOARDING PASS ITINERARY -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-0 items-center py-1">
            <!-- COLUNA 1: 🛫 1º DIA LIVRE REAL -->
            <div class="space-y-1">
              <div class="flex items-center justify-between gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <span>🛫 1º DIA LIVRE REAL</span>
                <i data-lucide="arrow-right" class="w-3.5 h-3.5 text-amber-400 hidden md:block"></i>
              </div>
              <div class="text-base sm:text-lg font-black font-mono text-slate-950">
                ${formatDate(p.effectiveStart)}
              </div>
              <div class="text-xs text-slate-600 font-medium">
                ${DAYS_NAME[p.effectiveStart.getDay()]} • ${optimizer.isWorkingDay(p.effectiveStart) ? 'Início de Férias' : 'Repouso Semanal'}
              </div>
            </div>

            <!-- COLUNA 2: 📋 OFICIAL NO SOUGOV / SIGRH -->
            <div class="space-y-1 md:border-l md:border-r border-amber-200/80 md:px-5 relative">
              <div class="flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-wider text-slate-700">
                <span class="flex items-center gap-1">📋 PERÍODO NO SIGRH</span>
                <div class="flex items-center gap-1.5">
                  <span class="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono font-bold text-[10px]">
                    ${p.length}d
                  </span>
                  <i data-lucide="arrow-right" class="w-3.5 h-3.5 text-amber-400 hidden md:block"></i>
                </div>
              </div>
              <div class="text-base sm:text-lg font-black font-mono text-slate-950">
                ${formatDate(p.startDate)} a ${formatDate(p.endDate)}
              </div>
              <div class="text-xs">
                ${endStatusHtml}
              </div>
            </div>

            <!-- COLUNA 3: 💼 VOLTA AO TRABALHO -->
            <div class="space-y-1 md:pl-5">
              <div class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                <span>💼 VOLTA AO TRABALHO</span>
              </div>
              <div class="text-base sm:text-lg font-black font-mono text-slate-950">
                ${formatDate(p.returnDate)}
              </div>
              <div class="text-xs text-emerald-800 font-medium flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block"></span>
                <span>${DAYS_NAME[p.returnDate.getDay()]} • 1º Dia de Expediente</span>
              </div>
            </div>
          </div>

          <!-- SUB-BARRA: EMENDAS & BOTÃO EXPANSOR DO CALENDÁRIO -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-amber-200/80">
            <div class="flex items-center gap-1.5 flex-wrap">
              ${joinedHolidays.length > 0 ? `
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mr-0.5">
                  <i data-lucide="sparkles" class="w-3 h-3 text-amber-500"></i> Emenda:
                </span>
                ${holidayTags}
              ` : '<span class="text-[11px] text-slate-500 font-medium">Sem feriados adicionais na etapa</span>'}
            </div>

            <button type="button" onclick="event.stopPropagation(); window.OtimizaApp.toggleMiniCalendar(${sIdx}, ${pIdx})" class="self-start sm:self-auto text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs">
              <i data-lucide="chevron-up" id="btnCalendarIcon_${sIdx}_${pIdx}" class="w-3.5 h-3.5 text-slate-600"></i>
              <span id="btnCalendarText_${sIdx}_${pIdx}">Ocultar Calendário</span>
            </button>
          </div>

          <!-- CONTAINER EXPANDIDO POR PADRÃO DO MINI-CALENDÁRIO -->
          <div id="miniCalendar_${sIdx}_${pIdx}" class="pt-3 border-t border-amber-200/80">
            ${calendarHtml}
          </div>

          ${bottomNav}

        </div>
      </div>
    `;
  }

  /**
   * Gera o HTML completo do card de cenário (header acordeão + corpo com itinerários)
   */
  function buildScenarioCardHtml(sc, sIdx, isChampion, isRibbonActive, isCompared, theme, badgesHtml, tabsHtml, periodsBodyHtml, isHidden = false) {
    const topAccentClass = 'bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500';

    const optionBadgeHtml = (isChampion || sIdx === 0)
      ? `<span class="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 border border-amber-500 shadow-xs flex items-center gap-1"><i data-lucide="crown" class="w-3.5 h-3.5 text-slate-950"></i> OPÇÃO ${String(sIdx + 1).padStart(2, '0')}</span>`
      : `<span class="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-slate-900 text-amber-300 border border-slate-700 shadow-2xs">OPÇÃO ${String(sIdx + 1).padStart(2, '0')}</span>`;

    const datesSummary = sc.periods.map(p => `${formatDate(p.startDate).slice(0, 5)} a ${formatDate(p.endDate).slice(0, 5)}`).join('  •  ');
    const hiddenAttr = isHidden ? 'style="display: none;" data-extra-scenario="true"' : 'data-extra-scenario="false"';

    const MONTH_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const routeSteps = sc.periods.map((p, idx) => {
      const m = MONTH_SHORT[p.startDate.getMonth()];
      const isLast = idx === sc.periods.length - 1;
      return `
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 font-mono font-semibold text-[11px] shadow-2xs">
          <i data-lucide="plane-takeoff" class="w-3 h-3 text-amber-600"></i>
          <span>${m}: ${p.length}d</span>
          <span class="text-slate-400">(${p.totalOff}d)</span>
        </span>
        ${!isLast ? '<span class="text-slate-400 font-bold text-xs select-none">➔</span>' : ''}
      `;
    }).join('');

    const routeLineHtml = `
      <div class="flex items-center gap-1.5 flex-wrap pt-0.5 text-slate-700 select-none">
        <span class="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1 mr-0.5">
          <i data-lucide="route" class="w-3 h-3 text-slate-400"></i> Rota:
        </span>
        ${routeSteps}
        <span class="text-slate-400 font-bold text-xs select-none">➔</span>
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300 font-mono font-bold text-[11px] shadow-2xs">
          <i data-lucide="check" class="w-3 h-3 text-emerald-600"></i>
          <span>${sc.totalOff}d livres</span>
        </span>
      </div>
    `;

    const categoryKey = (sc.category || '').toLowerCase();
    const splitKey = (sc.split || []).join('+');
    const partitionKey = (sc.partition || []).join('+');

    return `
      <div id="scenarioCard_${sIdx}" ${hiddenAttr} 
        data-category="${categoryKey}" 
        data-split="${splitKey}" 
        data-partition="${partitionKey}" 
        data-wasted="${sc.totalWasted}" 
        data-sidx="${sIdx}" 
        class="${isRibbonActive
        ? 'bg-gradient-to-br from-amber-100/80 via-white to-amber-50/70 rounded-3xl border-2 border-amber-400 shadow-xl ring-4 ring-amber-400/25 transition-all duration-300 overflow-hidden'
        : 'bg-white/95 rounded-3xl border-2 border-amber-200/90 shadow-md shadow-amber-500/5 transition-all duration-300 overflow-hidden hover:border-amber-400 hover:shadow-xl hover:bg-gradient-to-br hover:from-amber-50/40 hover:via-white hover:to-amber-50/30 cursor-pointer'}">

        <!-- ACCENT TOP BORDER (5PX) COM GRADIENTE FESTIVO -->
        <div class="h-1.5 w-full ${topAccentClass}"></div>

        <!-- ACCORDION HEADER (CLICKABLE) -->
        <div onclick="window.OtimizaApp.toggleScenario(${sIdx})" class="p-5 sm:p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 select-none hover:bg-amber-50/40 transition-colors">
          <div class="space-y-2 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              ${optionBadgeHtml}
              ${badgesHtml}
              <h4 class="font-black text-slate-900 text-base sm:text-lg tracking-tight ml-1">
                ${sc.split.join(' + ')} dias
              </h4>
            </div>
            <div class="pt-0.5">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold ${theme.style} border shadow-2xs">
                ${theme.text}
              </span>
            </div>
            <p class="text-xs text-slate-600 font-medium flex items-center gap-1.5">
              <i data-lucide="calendar-range" class="w-3.5 h-3.5 text-slate-500"></i>
              <span class="text-slate-600">Períodos de Férias:</span>
              <span class="text-slate-900 font-mono font-bold">${datesSummary}</span>
            </p>
            ${routeLineHtml}
          </div>

          <div class="flex items-center gap-2 sm:gap-2.5 self-end md:self-auto flex-wrap">
            <div class="bg-slate-950 text-amber-400 border border-slate-800 px-3 py-1.5 rounded-2xl shadow-xs text-right min-w-[76px]">
              <span class="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Descanso</span>
              <span class="text-base sm:text-lg font-black text-amber-300 font-mono leading-none">${sc.totalOff}d</span>
            </div>
            <div class="bg-emerald-50 text-emerald-950 border border-emerald-300 px-3 py-1.5 rounded-2xl shadow-2xs text-right min-w-[76px]">
              <span class="text-[9px] uppercase font-bold text-emerald-700 block tracking-wider">Ganho</span>
              <span class="text-base sm:text-lg font-black text-emerald-700 font-mono leading-none">+${sc.extraGain}d</span>
            </div>
            <div class="bg-amber-50 text-amber-950 border border-amber-300 px-3 py-1.5 rounded-2xl shadow-2xs text-right min-w-[76px]">
              <span class="text-[9px] uppercase font-bold text-amber-800 block tracking-wider">Alavanc.</span>
              <span class="text-base sm:text-lg font-black text-amber-800 font-mono leading-none">${sc.leverage}x</span>
            </div>
            <div class="pl-1 flex items-center gap-2">
              <!-- BOTÃO DO COMPARADOR DESACOPLADO -->
              <button type="button"
                id="btnCompare_${sIdx}"
                onclick="event.stopPropagation(); window.OtimizaApp.toggleCompareScenario(${sIdx})"
                aria-label="${isCompared ? 'Remover Opção ' + (sIdx + 1) + ' da comparação' : 'Adicionar Opção ' + (sIdx + 1) + ' à comparação'}"
                class="px-3 py-2 rounded-xl border ${isCompared ? 'border-amber-500 bg-amber-400 text-slate-950 font-black shadow-xs ring-2 ring-amber-400/40' : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-950 font-bold shadow-2xs'} text-xs transition-all duration-200 flex items-center gap-1.5 cursor-pointer shrink-0">
                <i data-lucide="${isCompared ? 'check' : 'plus'}" class="w-3.5 h-3.5 ${isCompared ? 'text-slate-950' : 'text-slate-500'}"></i>
                <span>${isCompared ? 'Comparando' : 'Comparar'}</span>
              </button>

              <button type="button" aria-label="Expandir detalhes da opção" class="w-9 h-9 rounded-xl border border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-200/70 bg-white flex items-center justify-center transition-all shadow-xs cursor-pointer">
                <i data-lucide="chevron-down" id="scenarioBtnIcon_${sIdx}" class="w-4 h-4 transition-transform duration-200 ${isChampion ? 'rotate-180' : ''}"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- ACCORDION BODY (COLLAPSIBLE) -->
        <div id="scenarioBody_${sIdx}" class="${isChampion ? '' : 'hidden'} border-t-2 border-amber-300/60 p-5 sm:p-6 space-y-4 bg-white/40 backdrop-blur-xs">
          ${tabsHtml}
          ${periodsBodyHtml}

          <!-- FOOTER ACTION BUTTONS -->
          <div class="pt-3 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-300">
            <button type="button" onclick="event.stopPropagation(); window.OtimizaApp.openBoardingPassModal(${sIdx})" class="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-95 text-slate-950 text-xs font-black transition-all shadow-md shadow-amber-400/20 flex items-center justify-center gap-2 cursor-pointer">
              <i data-lucide="ticket" class="w-4 h-4 text-slate-950"></i>
              <span>Emitir Bilhete de Embarque</span>
            </button>
            <button type="button" onclick="window.OtimizaApp.selectScenarioForRibbon(${sIdx}, true)" id="ribbonActiveBtn_${sIdx}" class="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 ${isRibbonActive ? 'bg-slate-200 text-slate-900' : 'bg-white hover:bg-slate-50 text-slate-700'} text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer">
              <i data-lucide="${isRibbonActive ? 'check' : 'activity'}" class="w-4 h-4 ${isRibbonActive ? 'text-emerald-600' : 'text-slate-500'}"></i>
              <span>${isRibbonActive ? 'Ativo na Fita Anual' : 'Destacar na Fita Anual'}</span>
            </button>
            <button type="button" onclick="window.OtimizaApp.copyScenarioSummary(${sIdx}, this)" class="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer">
              <i data-lucide="copy" class="w-4 h-4 text-slate-500"></i>
              <span>Copiar Resumo (SEI / WhatsApp)</span>
            </button>
            <button type="button" onclick="window.OtimizaApp.downloadScenarioICS(${sIdx})" class="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer">
              <i data-lucide="calendar-plus" class="w-4 h-4 text-white"></i>
              <span>Baixar Calendário (.ICS)</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Gera uma tabela corporativa HTML rica pronta para colar no SEI-UFBA, Word, Outlook ou Gmail
   */
  function generateScenarioTableHtml(sc, selectedYear) {
    if (!sc || !sc.periods) return '';

    let rowsHtml = '';
    sc.periods.forEach((p, idx) => {
      const returnDow = DAYS_NAME[p.returnDate.getDay()];
      rowsHtml += `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          <td style="padding: 8px 12px; text-align: center; border: 1px solid #cbd5e1; font-weight: bold; font-family: monospace;">${String(idx + 1).padStart(2, '0')}</td>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold; color: #0f172a;">${formatDate(p.startDate)} a ${formatDate(p.endDate)}</td>
          <td style="padding: 8px 12px; text-align: center; border: 1px solid #cbd5e1; font-weight: bold;">${p.length}d</td>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1; color: #047857; font-weight: bold;">${formatDate(p.returnDate)} (${returnDow})</td>
          <td style="padding: 8px 12px; text-align: center; border: 1px solid #cbd5e1; color: #047857; font-weight: bold;">${p.totalOff}d livres</td>
        </tr>
      `;
    });

    const compText = sc.compensationDays > 0 ? `<p style="font-size: 11px; color: #0284c7; font-family: sans-serif; margin: 4px 0 0 0;">* Inclui ${sc.compensationDays} dia(s) de banco de horas/compensação alocados cirurgicamente.</p>` : '';

    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
        <h4 style="margin: 0 0 6px 0; font-size: 14px; font-weight: bold; color: #0f172a;">Planejamento de Férias • Exercício ${selectedYear}</h4>
        <p style="margin: 0 0 10px 0; font-size: 12px; color: #475569;">Cota Oficial: <strong>${sc.vacationDays} dias</strong> | Descanso Real Contínuo: <strong style="color: #047857;">${sc.totalOff} dias livres</strong> (Alavancagem: ${sc.leverage}x)</p>
        <table style="border-collapse: collapse; width: 100%; max-width: 640px; font-size: 12px; border: 1px solid #cbd5e1;">
          <thead>
            <tr style="background-color: #0f172a; color: #ffffff;">
              <th style="padding: 8px 12px; text-align: center; border: 1px solid #cbd5e1; font-weight: bold; width: 50px;">Etapa</th>
              <th style="padding: 8px 12px; text-align: left; border: 1px solid #cbd5e1; font-weight: bold;">Período Oficial no SIGRH / SouGov</th>
              <th style="padding: 8px 12px; text-align: center; border: 1px solid #cbd5e1; font-weight: bold; width: 60px;">Dias</th>
              <th style="padding: 8px 12px; text-align: left; border: 1px solid #cbd5e1; font-weight: bold;">Retorno ao Trabalho</th>
              <th style="padding: 8px 12px; text-align: center; border: 1px solid #cbd5e1; font-weight: bold; width: 85px;">Descanso</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
          <tfoot>
            <tr style="background-color: #f1f5f9; font-weight: bold;">
              <td colspan="2" style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: left;">Total do Planejamento</td>
              <td style="padding: 8px 12px; text-align: center; border: 1px solid #cbd5e1;">${sc.vacationDays}d</td>
              <td colspan="2" style="padding: 8px 12px; text-align: right; border: 1px solid #cbd5e1; color: #047857;">${sc.totalOff} dias livres (${sc.extraGain >= 0 ? '+' : ''}${sc.extraGain}d de ganho)</td>
            </tr>
          </tfoot>
        </table>
        ${compText}
        <p style="font-size: 10px; color: #94a3b8; margin: 6px 0 0 0;">Gerado pelo Folga Extra (UFBA) • Regime Estatutário Lei 8.112/1990</p>
      </div>
    `;
  }

  return {
    buildBadgesHtml,
    buildPeriodHtml,
    buildScenarioCardHtml,
    generateScenarioTableHtml
  };
});

/**
 * app.js - Controlador de Interface e Interação do Usuário (Design System Elevado)
 * Conecta os motores:
 * - holidays.js (calendário astronômico)
 * - optimizer.js (otimizador matemático de programação dinâmica)
 * - ribbon.js (fita anual do tempo panorâmica)
 * - mini-calendar.js (grade visual de cada mês)
 */

(function () {
  'use strict';

  const root = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {});
  const { DAYS_NAME, generateHolidays, formatDate, parseDate } = root.HolidaysEngine || require('./holidays.js');
  const { VacationOptimizer } = root.VacationOptimizerEngine || require('./optimizer.js');
  const { renderMiniCalendar } = root.MiniCalendarEngine || require('./mini-calendar.js');
  const { renderAnnualRibbon } = root.AnnualRibbonEngine || (typeof require !== 'undefined' ? require('./ribbon.js').renderAnnualRibbon : () => '');

  // Estado global reativo da aplicação (mantido puramente em memória por sessão)
  const state = {
    vacationDays: 30,
    selectedYear: 2027,
    selectedLocation: 'UFBA_SALVADOR',
    autoBridgeHolidays: true,
    includeCarnavalCircuito: true,
    compensationDays: 0,
    distributeThroughoutYear: false,
    recessShift: 'none',
    includeVesperas: true,
    workingDays: [false, true, true, true, true, true, false],
    vacationSplit: 3,
    holidays: [],
    currentScenarios: [],
    comparedScenarios: [],
    hasCalculated: false,

    // Ponto 2: Janela Personalizada & Períodos a Evitar
    customWindowEnabled: false,
    windowStartDate: '2027-05-03',
    windowYears: 1,
    excludedPeriods: []
  };

  // ----------------------------------------------------
  // JANELA PERSONALIZADA & PERÍODOS A EVITAR (PONTO 2)
  // ----------------------------------------------------
  function toggleCustomWindowSection() {
    const sec = document.getElementById('customWindowSection');
    const icon = document.getElementById('iconToggleCustomWindow');
    const text = document.getElementById('textToggleCustomWindow');
    if (!sec) return;
    if (sec.classList.contains('hidden')) {
      sec.classList.remove('hidden');
      if (icon) icon.classList.add('rotate-180');
      if (text) text.innerText = 'Recolher';
    } else {
      sec.classList.add('hidden');
      if (icon) icon.classList.remove('rotate-180');
      if (text) text.innerText = 'Expandir';
    }
  }

  function toggleEnableCustomWindow(enabled) {
    state.customWindowEnabled = Boolean(enabled);
    const controls = document.getElementById('customWindowControls');
    const badge = document.getElementById('badgeCustomWindowStatus');
    if (controls) {
      if (state.customWindowEnabled) {
        controls.classList.remove('opacity-50', 'pointer-events-none');
      } else {
        controls.classList.add('opacity-50', 'pointer-events-none');
      }
    }
    if (badge) {
      if (state.customWindowEnabled) {
        badge.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300';
        badge.innerText = 'Ativa';
      } else {
        badge.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700';
        badge.innerText = 'Opcional';
      }
    }
    onYearOrLocationChange();
  }

  function setWindowYears(years) {
    state.windowYears = years === 2 ? 2 : 1;
    const btn1 = document.getElementById('btnWindow1Year');
    const btn2 = document.getElementById('btnWindow2Years');
    if (btn1 && btn2) {
      if (state.windowYears === 1) {
        btn1.className = 'py-2.5 px-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 border-slate-900 bg-slate-900 text-white shadow-xs cursor-pointer';
        btn2.className = 'py-2.5 px-2 rounded-xl border text-xs font-medium transition-all flex items-center justify-center gap-1.5 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer';
      } else {
        btn1.className = 'py-2.5 px-2 rounded-xl border text-xs font-medium transition-all flex items-center justify-center gap-1.5 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer';
        btn2.className = 'py-2.5 px-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 border-slate-900 bg-slate-900 text-white shadow-xs cursor-pointer';
      }
    }
    onYearOrLocationChange();
  }

  function onCustomWindowParamsChange() {
    const input = document.getElementById('windowStartDateInput');
    if (input && input.value) {
      state.windowStartDate = input.value;
    }
    onYearOrLocationChange();
  }

  function addExcludedPeriod() {
    const startEl = document.getElementById('excludedPeriodStart');
    const endEl = document.getElementById('excludedPeriodEnd');
    if (!startEl || !endEl || !startEl.value || !endEl.value) {
      alert('Informe a data inicial e a data final do período a evitar.');
      return;
    }
    const sDate = parseDate(startEl.value);
    const eDate = parseDate(endEl.value);
    if (!sDate || !eDate || isNaN(sDate.getTime()) || isNaN(eDate.getTime())) {
      alert('Datas inválidas.');
      return;
    }
    if (sDate > eDate) {
      alert('A data inicial deve ser anterior ou igual à data final.');
      return;
    }

    state.excludedPeriods.push({
      id: Date.now() + Math.random(),
      start: formatISODate(sDate),
      end: formatISODate(eDate)
    });

    startEl.value = '';
    endEl.value = '';
    renderExcludedPeriods();
    runSimulation(false);
  }

  function removeExcludedPeriod(id) {
    state.excludedPeriods = state.excludedPeriods.filter(p => p.id !== id);
    renderExcludedPeriods();
    runSimulation(false);
  }

  function renderExcludedPeriods() {
    const container = document.getElementById('excludedPeriodsList');
    if (!container) return;
    if (state.excludedPeriods.length === 0) {
      container.innerHTML = '<span class="text-xs text-slate-400 italic">Nenhum período a evitar cadastrado. O sistema buscará em todas as datas disponíveis.</span>';
      return;
    }

    function formatDisplayDate(isoStr) {
      if (!isoStr) return '';
      if (isoStr.includes('/')) return isoStr;
      const [y, m, d] = isoStr.split('-');
      return `${d}/${m}/${y}`;
    }

    container.innerHTML = state.excludedPeriods.map(p => `
      <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-900 border border-rose-200 text-xs font-bold shadow-2xs">
        <i data-lucide="ban" class="w-3.5 h-3.5 text-rose-600"></i>
        <span>${formatDisplayDate(p.start)} até ${formatDisplayDate(p.end)}</span>
        <button type="button" onclick="removeExcludedPeriod(${p.id})" class="text-rose-500 hover:text-rose-700 p-0.5 rounded cursor-pointer" title="Remover período">
          <i data-lucide="x" class="w-3 h-3"></i>
        </button>
      </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  // ----------------------------------------------------
  // DIAS DA SEMANA DE TRABALHO (SELETOR TÁTIL)
  // ----------------------------------------------------
  function initWorkingDaysUI() {
    const container = document.getElementById('workingDaysContainer');
    if (!container) return;
    container.innerHTML = '';
    DAYS_NAME.forEach((name, idx) => {
      const isChecked = state.workingDays[idx];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.onclick = () => toggleWorkingDay(idx);
      btn.className = `py-2 px-0 w-full text-center rounded-xl border text-[11px] font-bold transition-all duration-200 cursor-pointer ${
        isChecked 
          ? 'bg-slate-900 border-slate-900 text-white shadow-xs scale-100 ring-2 ring-slate-900/10' 
          : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
      }`;
      btn.innerText = name;
      container.appendChild(btn);
    });
  }

  function toggleWorkingDay(idx) {
    state.workingDays[idx] = !state.workingDays[idx];
    initWorkingDaysUI();
  }

  // ----------------------------------------------------
  // PRESETS RÁPIDOS DE DIAS DE FÉRIAS (30, 20, 15)
  // ----------------------------------------------------
  function setVacationDays(days) {
    state.vacationDays = days;
    const el = document.getElementById('vacationDays');
    if (el) el.value = days;
    runSimulation(false);
  }

  // ----------------------------------------------------
  // MANIPULAÇÃO DO INPUT DE DIAS DE FÉRIAS
  // ----------------------------------------------------
  function onVacationDaysInput(e) {
    let val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 1 && val <= 30) {
      state.vacationDays = val;
      runSimulation(false);
    }
  }

  // ----------------------------------------------------
  // STEPPER DO BANCO DE HORAS (+ / -)
  // ----------------------------------------------------
  function changeCompensation(delta) {
    let val = (state.compensationDays || 0) + delta;
    if (val < 0) val = 0;
    if (val > 15) val = 15;
    state.compensationDays = val;

    const inputEl = document.getElementById('compensationDays');
    const displayEl = document.getElementById('compensationDaysDisplay');
    if (inputEl) inputEl.value = val;
    if (displayEl) {
      displayEl.innerText = `${val} dia${val === 1 ? '' : 's'}`;
    }
    runSimulation(false);
  }

  // ----------------------------------------------------
  // DIVISÃO DE PARCELAS (1, 2 OU 3 ETAPAS)
  // ----------------------------------------------------
  function setSplit(count) {
    state.vacationSplit = count;
    [1, 2, 3].forEach(i => {
      const btn = document.getElementById(`btnSplit${i}`);
      if (!btn) return;
      if (i === count) {
        btn.className = 'py-2.5 px-2 rounded-xl border font-black text-sm transition-all flex items-center justify-center border-slate-900 bg-slate-900 text-white shadow-xs cursor-pointer';
      } else {
        btn.className = 'py-2.5 px-2 rounded-xl border font-black text-sm transition-all flex items-center justify-center border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer';
      }
    });
    runSimulation(false);
  }

  // ----------------------------------------------------
  // ESCALA DE RECESSO DE FIM DE ANO (MGI / PORTARIA SRT & UFBA)
  // ----------------------------------------------------
  function setRecessShift(shift) {
    state.recessShift = shift;

    ['none', 'natal', 'ano_novo'].forEach(s => {
      const btn = document.getElementById(`btnRecess_${s}`);
      if (btn) {
        if (s === shift) {
          btn.className = 'py-2 px-2.5 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 bg-white text-slate-900 shadow-xs cursor-pointer';
        } else {
          btn.className = 'py-2 px-2.5 rounded-lg text-xs font-medium transition-all text-center flex items-center justify-center gap-1.5 text-slate-600 hover:text-slate-900 cursor-pointer';
        }
      }
    });

    const desc = document.getElementById('recessShiftDescription');
    if (desc) {
      if (shift === 'natal') {
        desc.innerHTML = '<span class="text-sky-700 font-bold">🎄 Turma Natal Ativa:</span> Dias úteis da semana do Natal são recesso compensado. 25/Dez e 01/Jan continuam feriados nacionais para todos.';
      } else if (shift === 'ano_novo') {
        desc.innerHTML = '<span class="text-amber-700 font-bold">🎆 Turma Ano Novo Ativa:</span> Dias úteis da semana do Ano Novo são recesso compensado. 25/Dez e 01/Jan continuam feriados nacionais para todos.';
      } else {
        desc.innerHTML = 'Sem escala de revezamento. 25/Dez e 01/Jan são feriados para todos.';
      }
    }

    state.holidays = generateHolidays(state.selectedYear, {
      location: state.selectedLocation,
      autoBridge: state.autoBridgeHolidays,
      carnavalCircuito: state.includeCarnavalCircuito,
      recessShift: state.recessShift,
      includeVesperas: state.includeVesperas
    });

    renderHolidaysTable();
    updateHolidayCountDisplay();
    runSimulation(false);
  }

  // ----------------------------------------------------
  // ATUALIZAÇÃO DE ANO / LOCALIDADE / FERIADOS
  // ----------------------------------------------------
  function onYearOrLocationChange() {
    const yrEl = document.getElementById('selectedYear');
    if (yrEl) state.selectedYear = parseInt(yrEl.value) || 2027;
    const locEl = document.getElementById('selectedLocation');
    if (locEl) state.selectedLocation = locEl.value || 'UFBA_SALVADOR';
    const autoBridgeEl = document.getElementById('autoBridgeHolidays');
    if (autoBridgeEl) state.autoBridgeHolidays = autoBridgeEl.checked;
    const carnavalEl = document.getElementById('includeCarnavalCircuito');
    if (carnavalEl) state.includeCarnavalCircuito = carnavalEl.checked;
    const vEl = document.getElementById('includeVesperas');
    state.includeVesperas = vEl ? vEl.checked : true;

    const yrDisp = document.getElementById('currentYearDisplay');
    if (yrDisp) yrDisp.innerText = state.selectedYear;

    const options = {
      location: state.selectedLocation,
      autoBridge: state.autoBridgeHolidays,
      carnavalCircuito: state.includeCarnavalCircuito,
      recessShift: state.recessShift,
      includeVesperas: state.includeVesperas
    };

    if (state.customWindowEnabled && state.windowStartDate) {
      const parsedStart = parseDate(state.windowStartDate);
      const sYear = parsedStart ? parsedStart.getFullYear() : state.selectedYear;
      const yrs = state.windowYears === 2 ? 2 : 1;
      const eYear = sYear + yrs;
      const years = [];
      for (let y = sYear; y <= eYear; y++) years.push(y);
      state.holidays = generateHolidays(years, options);
    } else {
      state.holidays = generateHolidays(state.selectedYear, options);
    }

    renderHolidaysTable();
    updateHolidayCountDisplay();
    runSimulation(false);
  }

  function updateHolidayCountDisplay() {
    const countEl = document.getElementById('holidayCountDisplay');
    if (!countEl) return;
    const locText = state.selectedLocation === 'UFBA_SALVADOR' ? 'para a UFBA em Salvador (BA)' : 'no calendário';

    if (state.customWindowEnabled && state.windowStartDate) {
      const sDate = parseDate(state.windowStartDate) || new Date(state.selectedYear, 0, 1);
      const yrs = state.windowYears === 2 ? 2 : 1;
      const eDate = new Date(sDate.getFullYear() + yrs, sDate.getMonth(), sDate.getDate() - 1);

      const scopedHolidays = (state.holidays || []).filter(h => {
        const d = parseDate(h.date);
        return d && d >= sDate && d <= eDate;
      });
      countEl.innerText = `${scopedHolidays.length} Feriados e Pontes Oficiais na Janela (${formatDate(sDate)} a ${formatDate(eDate)})`;
    } else {
      const yearHolidays = (state.holidays || []).filter(h => {
        const d = parseDate(h.date);
        return d && d.getFullYear() === state.selectedYear;
      });
      countEl.innerText = `${yearHolidays.length} Feriados e Pontes Oficiais ${locText} para ${state.selectedYear}`;
    }
  }

  function toggleHolidayList() {
    const sec = document.getElementById('holidayListSection');
    const text = document.getElementById('btnHolidayToggleText');
    if (!sec) return;
    if (sec.classList.contains('hidden')) {
      sec.classList.remove('hidden');
      if (text) text.innerText = 'Esconder Feriados';
    } else {
      sec.classList.add('hidden');
      if (text) text.innerText = 'Ver / Customizar Feriados';
    }
  }

  function renderHolidaysTable() {
    const container = document.getElementById('holidayTableContainer');
    if (!container) return;
    container.innerHTML = '';

    let yearHolidays;
    if (state.customWindowEnabled && state.windowStartDate) {
      const sDate = parseDate(state.windowStartDate) || new Date(state.selectedYear, 0, 1);
      const yrs = state.windowYears === 2 ? 2 : 1;
      const eDate = new Date(sDate.getFullYear() + yrs, sDate.getMonth(), sDate.getDate() - 1);
      yearHolidays = (state.holidays || [])
        .map((h, originalIdx) => ({ h, originalIdx }))
        .filter(({ h }) => {
          const d = parseDate(h.date);
          return d && d >= sDate && d <= eDate;
        });
    } else {
      yearHolidays = (state.holidays || [])
        .map((h, originalIdx) => ({ h, originalIdx }))
        .filter(({ h }) => {
          const d = parseDate(h.date);
          return d && d.getFullYear() === state.selectedYear;
        });
    }

    if (yearHolidays.length === 0) {
      container.innerHTML = '<p class="text-xs text-slate-400 py-2">Nenhum feriado cadastrado para este período.</p>';
      return;
    }

    yearHolidays.forEach(({ h, originalIdx }) => {
      const row = document.createElement('div');
      row.className = 'flex items-center justify-between py-1.5 px-3 rounded-xl hover:bg-slate-100 text-xs transition-colors bg-white border border-slate-100 shadow-2xs';

      let typeBadge = '';
      const isFacultativo = h.type === 'recesso' || h.type === 'vespera' || h.type === 'ponte' || h.type === 'servidor' || (h.name && h.name.toLowerCase().includes('facultativo'));
      if (isFacultativo) {
        typeBadge = `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-900 border border-blue-300">Ponto Facultativo</span>`;
      } else {
        typeBadge = `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-950 border border-amber-300">Feriado</span>`;
      }

      row.innerHTML = `
        <div class="flex items-center gap-2 flex-wrap">
          <span class="font-mono font-bold text-slate-800 text-[11px]">${formatDate(h.date)}</span>
          <span class="text-slate-700 font-medium">${h.name}</span>
          ${typeBadge}
        </div>
        <button type="button" onclick="removeHoliday(${originalIdx})" class="text-slate-400 hover:text-red-500 p-1 rounded-lg transition-colors cursor-pointer" title="Excluir feriado do cálculo">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>
      `;
      container.appendChild(row);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  function removeHoliday(idx) {
    state.holidays.splice(idx, 1);
    renderHolidaysTable();
    updateHolidayCountDisplay();
    runSimulation(false);
  }

  function addCustomHoliday() {
    const dateInput = document.getElementById('newHolidayDate');
    const nameInput = document.getElementById('newHolidayName');

    if (!dateInput.value || !nameInput.value) {
      alert('Preencha a data (DD/MM/AAAA) e o nome do recesso/folga.');
      return;
    }

    const d = parseDate(dateInput.value.trim());
    if (!d || isNaN(d.getTime())) {
      alert('Data inválida. Use o formato DD/MM/AAAA (ex: 28/10/2027).');
      return;
    }

    state.holidays.push({
      date: d,
      name: nameInput.value.trim(),
      type: 'custom'
    });

    state.holidays.sort((a, b) => a.date - b.date);

    dateInput.value = '';
    nameInput.value = '';
    renderHolidaysTable();
    updateHolidayCountDisplay();
    runSimulation(false);
  }

  // ----------------------------------------------------
  // SELEÇÃO DINÂMICA DO CENÁRIO NA FITA ANUAL DO TEMPO
  // ----------------------------------------------------
  function selectScenarioForRibbon(sIdx, shouldScroll = false) {
    if (!state.currentScenarios || !state.currentScenarios[sIdx]) return;
    state.activeScenarioIndex = sIdx;

    const ribbonContainer = document.getElementById('annualRibbonContainer');
    if (ribbonContainer) {
      ribbonContainer.innerHTML = renderAnnualRibbon(
        state.currentScenarios[sIdx],
        state.selectedYear,
        sIdx,
        state.holidays,
        state.customWindowEnabled ? { windowStartDate: state.windowStartDate, windowYears: state.windowYears } : null
      );
    }

    // Atualiza botões e indicadores em todos os cards
    state.currentScenarios.forEach((_, idx) => {
      const btn = document.getElementById(`ribbonActiveBtn_${idx}`);
      const card = document.getElementById(`scenarioCard_${idx}`);
      const isSelected = idx === sIdx;

      if (btn) {
        if (isSelected) {
          btn.className = 'w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-100 text-slate-900 text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer';
          btn.innerHTML = '<i data-lucide="check" class="w-4 h-4 text-emerald-600"></i><span>Ativo na Fita Anual</span>';
        } else {
          btn.className = 'w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer';
          btn.innerHTML = '<i data-lucide="activity" class="w-4 h-4 text-slate-500"></i><span>Destacar na Fita Anual</span>';
        }
      }

      if (card) {
        if (isSelected) {
          card.className = 'bg-gradient-to-br from-amber-100/80 via-sky-50/90 to-indigo-100/70 rounded-3xl border-2 border-amber-400 shadow-xl ring-2 ring-amber-400/40 transition-all duration-300 overflow-hidden';
        } else {
          card.className = 'bg-slate-100/90 rounded-3xl border-2 border-slate-300/90 shadow-md transition-all duration-300 overflow-hidden hover:border-amber-400 hover:shadow-xl hover:bg-gradient-to-br hover:from-amber-100/40 hover:via-sky-50/50 hover:to-indigo-100/40 cursor-pointer';
        }
      }
    });

    if (window.lucide) window.lucide.createIcons();

    if (shouldScroll && ribbonContainer) {
      const rect = ribbonContainer.getBoundingClientRect();
      // Se a fita já está visível (fixada no topo via position: sticky), não faz scroll brusco para cima
      const isStickyVisible = rect.top >= 0 && rect.top <= 160 && rect.bottom > 100;
      if (!isStickyVisible) {
        ribbonContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }

  // ----------------------------------------------------
  // ACORDEÃO DE DETALHES DO CENÁRIO (COM SINCRONIZAÇÃO AUTOMÁTICA DA FITA)
  // ----------------------------------------------------
  function toggleScenario(sIdx) {
    const body = document.getElementById(`scenarioBody_${sIdx}`);
    const btnText = document.getElementById(`scenarioBtnText_${sIdx}`);
    const btnIcon = document.getElementById(`scenarioBtnIcon_${sIdx}`);
    if (!body) return;

    if (body.classList.contains('hidden')) {
      body.classList.remove('hidden');
      if (btnText) btnText.innerText = 'Recolher';
      if (btnIcon) {
        btnIcon.classList.add('rotate-180');
      }
      // Ao expandir qualquer opção, a Fita Anual se atualiza automaticamente para ela!
      selectScenarioForRibbon(sIdx, false);
    } else {
      body.classList.add('hidden');
      if (btnText) btnText.innerText = 'Ver Detalhes';
      if (btnIcon) {
        btnIcon.classList.remove('rotate-180');
      }
    }
  }

  // ----------------------------------------------------
  // ALTERNADOR DO MINI-CALENDÁRIO DA ETAPA (SOB DEMANDA)
  // ----------------------------------------------------
  function toggleMiniCalendar(sIdx, pIdx) {
    const el = document.getElementById(`miniCalendar_${sIdx}_${pIdx}`);
    const btnText = document.getElementById(`btnCalendarText_${sIdx}_${pIdx}`);
    const btnIcon = document.getElementById(`btnCalendarIcon_${sIdx}_${pIdx}`);
    if (!el) return;

    if (el.classList.contains('hidden')) {
      el.classList.remove('hidden');
      if (btnText) btnText.innerText = 'Ocultar Calendário';
      if (btnIcon) {
        btnIcon.setAttribute('data-lucide', 'chevron-up');
        if (window.lucide) window.lucide.createIcons();
      }
    } else {
      el.classList.add('hidden');
      if (btnText) btnText.innerText = 'Ver Calendário';
      if (btnIcon) {
        btnIcon.setAttribute('data-lucide', 'calendar');
        if (window.lucide) window.lucide.createIcons();
      }
    }
  }

  // ----------------------------------------------------
  // ALTERNADOR DE ABAS DE ETAPAS DO CENÁRIO (UMA POR VEZ OU TODAS)
  // ----------------------------------------------------
  function selectStageTab(sIdx, tabKey, periodCount) {
    const totalPeriods = periodCount || (state.currentScenarios[sIdx] ? state.currentScenarios[sIdx].periods.length : 3);

    for (let p = 0; p < totalPeriods; p++) {
      const btn = document.getElementById(`tabBtn_${sIdx}_${p}`);
      const badgeNum = document.getElementById(`tabBadge_${sIdx}_${p}`);
      const container = document.getElementById(`stageContainer_${sIdx}_${p}`);
      const gap = document.getElementById(`gapConnector_${sIdx}_${p}`);
      const isCurrent = (tabKey === p) || (tabKey === 'all');

      if (btn) {
        if (tabKey === p) {
          btn.className = 'px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shrink-0 bg-slate-900 text-white shadow-xs';
          if (badgeNum) badgeNum.className = 'w-4 h-4 rounded-md bg-white/20 text-white flex items-center justify-center font-mono font-black text-[9px]';
        } else {
          btn.className = 'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-950 border border-slate-200/80';
          if (badgeNum) badgeNum.className = 'w-4 h-4 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-mono font-black text-[9px]';
        }
      }

      // Atualiza estilo do conector sutil de intervalo na linha do tempo
      if (p > 0) {
        const gapEl = document.getElementById(`tabGap_${sIdx}_${p}`);
        if (gapEl) {
          if (tabKey === p) {
            gapEl.className = 'flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-xs select-none shrink-0 text-amber-950 font-bold bg-amber-400/20 transition-all';
          } else {
            gapEl.className = 'flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-xs select-none shrink-0 text-slate-500 hover:text-slate-800 transition-all';
          }
        }
      }

      if (container) {
        if (isCurrent) {
          container.classList.remove('hidden');
        } else {
          container.classList.add('hidden');
        }
      }

      if (gap) {
        if (tabKey === 'all') {
          gap.classList.remove('hidden');
        } else {
          gap.classList.add('hidden');
        }
      }
    }

    // Botão "Ver Todas"
    const btnAll = document.getElementById(`tabBtn_${sIdx}_all`);
    if (btnAll) {
      if (tabKey === 'all') {
        btnAll.className = 'px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shrink-0 bg-slate-900 text-white shadow-xs';
      } else {
        btnAll.className = 'px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200/80';
      }
    }

    // Atualiza texto informativo da aba
    const infoEl = document.getElementById(`tabInfo_${sIdx}`);
    if (infoEl) {
      if (tabKey === 'all') {
        infoEl.innerHTML = '<span class="flex items-center gap-1 text-slate-600"><i data-lucide="layers" class="w-3.5 h-3.5 text-slate-500"></i> Exibindo todas as etapas</span>';
      } else {
        const stageNum = tabKey + 1;
        infoEl.innerHTML = `<span class="flex items-center gap-1 text-slate-600"><i data-lucide="calendar" class="w-3.5 h-3.5 text-slate-500"></i> Exibindo Etapa ${stageNum} de ${totalPeriods}</span>`;
      }
    }

    if (window.lucide) window.lucide.createIcons();
  }

  // ----------------------------------------------------
  // MOTOR DE ROTAS E TAGS TEMÁTICAS INTELIGENTES (30+ COMBINAÇÕES)
  // ----------------------------------------------------
  function getScenarioStrategicTheme(sc, sIdx, distributeThroughoutYear = false) {
    if (!sc || !sc.periods || sc.periods.length === 0) {
      return { text: '✨ Planejamento Padrão', style: 'bg-purple-100 text-purple-950 border border-purple-300' };
    }

    const allHolidayNames = [];
    let hasCompDays = false;
    let hasMiniPeriod = false;

    sc.periods.forEach(p => {
      if (p.compDaysApplied > 0) hasCompDays = true;
      if (p.length <= 7) hasMiniPeriod = true;

      const list = [...(p.holidaysBefore || []), ...(p.holidaysAfter || []), ...(p.holidaysInside || [])];
      list.forEach(h => {
        if (h && h.name) allHolidayNames.push(h.name.toLowerCase());
      });
    });

    // Feriados da Bahia e Salvador
    const hasCarnaval = allHolidayNames.some(n => n.includes('carnaval') || n.includes('cinzas'));
    const hasSaoJoao = allHolidayNames.some(n => n.includes('são joão') || n.includes('sao joao'));
    const has2Julho = allHolidayNames.some(n => n.includes('dois de julho') || n.includes('independência da bahia') || n.includes('independencia da bahia'));
    const hasConceicao = allHolidayNames.some(n => n.includes('conceição') || n.includes('conceicao'));

    // Feriados Federais & Recessos
    const hasNatal = allHolidayNames.some(n => n.includes('natal'));
    const hasAnoNovo = allHolidayNames.some(n => n.includes('ano novo') || n.includes('confraternização') || n.includes('confraternizacao'));
    const hasRecesso = allHolidayNames.some(n => n.includes('recesso')) || hasNatal || hasAnoNovo;
    const hasConsciencia = allHolidayNames.some(n => n.includes('consciência') || n.includes('consciencia'));
    const hasSemanaSanta = allHolidayNames.some(n => n.includes('páscoa') || n.includes('pascoa') || n.includes('santa') || n.includes('paixão'));
    const hasTiradentes = allHolidayNames.some(n => n.includes('tiradentes'));
    const hasTrabalhador = allHolidayNames.some(n => n.includes('trabalho') || n.includes('trabalhador'));
    const hasCorpus = allHolidayNames.some(n => n.includes('corpus'));
    const hasSetembro = allHolidayNames.some(n => n.includes('pátria') || n.includes('patria') || n.includes('independência do brasil') || n.includes('independencia do brasil'));
    const hasAparecida = allHolidayNames.some(n => n.includes('aparecida') || n.includes('crianças') || n.includes('criancas'));
    const hasServidor = allHolidayNames.some(n => n.includes('servidor'));
    const hasFinados = allHolidayNames.some(n => n.includes('finados'));

    const splitKey = sc.split ? sc.split.join('+') : '';
    const numPeriods = sc.periods.length;
    const isZeroWaste = sc.totalWasted === 0;
    const isHighLeverage = sc.leverage >= 1.5;

    // OPÇÃO B: Cor Exclusiva e Inconfundível para Rótulos de Estilos / Roteiros (Púrpura Nobre)
    const THEME_STYLE = 'bg-purple-100 text-purple-950 border border-purple-300';

    // ----------------------------------------------------
    // GRUPO 1: TRÍADES CULTURAIS & COMBINAÇÕES TRIPLAS (BAHIA + BRASIL)
    // ----------------------------------------------------
    if (hasCarnaval && hasSaoJoao && hasRecesso) {
      return { text: '🎭 Tríade de Ouro • Carnaval, São João e Fim de Ano', style: THEME_STYLE };
    }
    if (hasCarnaval && has2Julho && hasRecesso) {
      return { text: '🌴 Tríade Baiana • Carnaval, 2 de Julho e Fim de Ano', style: THEME_STYLE };
    }
    if (hasSaoJoao && has2Julho && hasRecesso) {
      return { text: '🌽 Tradição & Fim de Ano • São João, 2 de Julho e Recesso', style: THEME_STYLE };
    }
    if (hasServidor && hasFinados && hasConsciencia) {
      return { text: '💼 Super Novembro do Servidor • 3 Feriados Alavancados', style: THEME_STYLE };
    }
    if (hasSemanaSanta && hasTiradentes && hasTrabalhador) {
      return { text: '🌿 Tríade de Outono • Semana Santa, Tiradentes e 1º de Maio', style: THEME_STYLE };
    }

    // ----------------------------------------------------
    // GRUPO 2: DOBRADINHAS DE DESTAQUE CULTURAL (BAHIA)
    // ----------------------------------------------------
    if (hasCarnaval && hasSaoJoao) {
      return { text: '🎭 Circuito & Tradição • Folia de Carnaval e São João', style: THEME_STYLE };
    }
    if (hasCarnaval && has2Julho) {
      return { text: '🌴 Verão & Independência • Carnaval e 2 de Julho', style: THEME_STYLE };
    }
    if (hasCarnaval && hasConsciencia) {
      return { text: '✊ Do Circuito à Consciência • Carnaval e 20 de Novembro', style: THEME_STYLE };
    }
    if (hasCarnaval && hasRecesso) {
      return { text: '☀️ Verão a Verão • Do Carnaval ao Réveillon', style: THEME_STYLE };
    }
    if (hasSaoJoao && has2Julho) {
      return { text: '🌽 Inverno Baiano • Festas Juninas & Dois de Julho', style: THEME_STYLE };
    }
    if (hasSaoJoao && hasConsciencia) {
      return { text: '🌽 Tradição & Resistência • São João e Consciência Negra', style: THEME_STYLE };
    }
    if (hasSaoJoao && hasRecesso) {
      return { text: '🏖️ Tradição & Festas • São João e Recesso de Fim de Ano', style: THEME_STYLE };
    }
    if (has2Julho && hasConsciencia) {
      return { text: '✊ Orgulho da Bahia • 2 de Julho e Consciência Negra', style: THEME_STYLE };
    }
    if (has2Julho && hasRecesso) {
      return { text: '🌊 Meio de Ano & Natal • 2 de Julho e Fim de Ano', style: THEME_STYLE };
    }
    if (hasConceicao && hasRecesso) {
      return { text: '⛵ Festas de Salvador • Conceição da Praia e Fim de Ano', style: THEME_STYLE };
    }

    // ----------------------------------------------------
    // GRUPO 3: DOBRADINHAS NACIONAIS & FEDERAIS
    // ----------------------------------------------------
    if (hasSemanaSanta && hasSaoJoao) {
      return { text: '🌿 Do Outono ao São João • Pausas Tradicionais no 1º Semestre', style: THEME_STYLE };
    }
    if (hasTiradentes && (hasTrabalhador || hasCorpus)) {
      return { text: '⚡ Pontes do 1º Semestre • Tiradentes e Feriados de Maio/Junho', style: THEME_STYLE };
    }
    if (hasSetembro && hasConsciencia) {
      return { text: '🍂 Rota de Primavera • 7 de Setembro e Consciência Negra', style: THEME_STYLE };
    }
    if (hasSetembro && hasAparecida) {
      return { text: '🍂 Primavera em Família • 7 de Setembro e 12 de Outubro', style: THEME_STYLE };
    }
    if (hasServidor && hasRecesso) {
      return { text: '💼 Da Semana do Servidor ao Recesso de Fim de Ano', style: THEME_STYLE };
    }

    // ----------------------------------------------------
    // GRUPO 4: EVENTOS INDIVIDUAIS CULTURAIS / FEDERAIS MARCANTES
    // ----------------------------------------------------
    if (hasCarnaval) {
      return { text: '🎭 Circuito Carnaval UFBA • Máxima Folia em Salvador', style: THEME_STYLE };
    }
    if (hasSaoJoao) {
      return { text: '🌽 Rota do Interior • Emenda Junina de São João', style: THEME_STYLE };
    }
    if (has2Julho) {
      return { text: '🏖️ Férias de Julho • Pausa da Independência da Bahia', style: THEME_STYLE };
    }
    if (hasNatal && !hasAnoNovo) {
      return { text: '🎄 Turma de Natal • Ceia em Família e Recesso MGI', style: THEME_STYLE };
    }
    if (hasAnoNovo && !hasNatal) {
      return { text: '🎆 Turma de Réveillon • Virada de Ano e Recesso MGI', style: THEME_STYLE };
    }
    if (hasRecesso) {
      return { text: '🎄 Travessia de Ano • Super Emenda de Fim de Ano MGI', style: THEME_STYLE };
    }
    if (hasConsciencia) {
      return { text: '✊ Feriado da Consciência Negra • Pausa de Novembro', style: THEME_STYLE };
    }
    if (hasSemanaSanta || hasTiradentes) {
      return { text: '🌿 Emendas de Outono • Semana Santa e Tiradentes', style: THEME_STYLE };
    }
    if (hasTrabalhador || hasCorpus) {
      return { text: '⚡ Otimização do 1º Semestre • Pontes de Maio e Junho', style: THEME_STYLE };
    }
    if (hasSetembro || hasAparecida) {
      return { text: '🍂 Pausa de Primavera • Feriados de Setembro e Outubro', style: THEME_STYLE };
    }
    if (hasServidor) {
      return { text: '💼 Semana do Servidor Público • Ponte Administrativa', style: THEME_STYLE };
    }
    if (hasConceicao) {
      return { text: '⛵ Padroeira da Bahia • Conceição da Praia e Largo', style: THEME_STYLE };
    }

    // ----------------------------------------------------
    // GRUPO 5: PADRÕES ESTRUTURAIS, SAÚDE E FORMATOS ESPECÍFICOS
    // ----------------------------------------------------
    if (distributeThroughoutYear) {
      return { text: '🌊 Ritmo Anti-Fadiga • 3 Grandes Recargas Espaçadas', style: THEME_STYLE };
    }
    if (hasCompDays && isHighLeverage) {
      return { text: '⏱️ Banco de Horas Turbo • Folgas Cirurgicamente Alocadas', style: THEME_STYLE };
    }
    if (hasMiniPeriod && isHighLeverage) {
      return { text: '🚀 Miniférias Turbinadas • Período Curto com Máximo Ganho', style: THEME_STYLE };
    }
    if (numPeriods === 1) {
      const startMonth = sc.periods[0].startDate.getMonth();
      if (startMonth <= 1 || startMonth === 11) {
        return { text: '☀️ Cota Integral de Verão • 30d Contínuos de Descanso', style: THEME_STYLE };
      }
      if (startMonth === 5 || startMonth === 6) {
        return { text: '🏖️ Cota Integral de Meio de Ano • 30d Contínuos em Julho', style: THEME_STYLE };
      }
      return { text: '☀️ Cota Integral • Grande Recarga Contínua (30d)', style: THEME_STYLE };
    }
    const partitionKey = sc.partition ? sc.partition.join('+') : (sc.split ? sc.split.slice().sort((a, b) => b - a).join('+') : '');
    if (splitKey === '15+15' || partitionKey === '15+15') {
      return { text: '⚖️ Semestral Clássico • 2 Grandes Descansos Equilibrados', style: THEME_STYLE };
    }
    if (splitKey === '10+10+10' || partitionKey === '10+10+10') {
      return { text: '🎯 Tríade Equilibrada • Pausas Regulares ao Longo do Ano', style: THEME_STYLE };
    }
    if (splitKey === '15+10+5' || partitionKey === '15+10+5') {
      return { text: '⚡ Estratégia Escalonada • Pausa Principal com Miniférias', style: THEME_STYLE };
    }
    if (isZeroWaste && isHighLeverage) {
      return { text: '🎯 Precisão Cirúrgica • Desperdício Zero e Alta Alavancagem', style: THEME_STYLE };
    }

    return { text: '✨ Alavancagem Otimizada • Fins de Semana sem Desperdício', style: THEME_STYLE };
  }

  // ====================================================
  // GERADORES DE HTML DE RENDERIZAÇÃO (EXTRAÍDOS DA runSimulation)
  // Cada função produz uma string HTML autônoma para um
  // subcomponente do card de cenário. Isso mantém a
  // runSimulation focada na lógica de estado e curadoria.
  // ====================================================

  // Gera os badges de mérito (Campeã, Campeã Alternativa, Férias de Julho, Fim de Ano, 10+10+10, Anti-Fadiga)
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

  // Gera o bloco HTML de uma etapa individual (boarding pass + mini-calendário + navegação)
  function buildPeriodHtml(sc, sIdx, p, pIdx, optimizer) {
    const joinedHolidays = [...p.holidaysBefore, ...p.holidaysAfter, ...p.holidaysInside];
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
      gapHtml = `
        <div id="gapConnector_${sIdx}_${pIdx}" class="hidden flex items-center justify-center my-4 relative select-none">
          <div class="absolute inset-0 flex items-center" aria-hidden="true">
            <div class="w-full border-t-2 border-dashed border-slate-400"></div>
          </div>
          <div class="relative z-10 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-300 border-2 border-slate-400 text-slate-800 text-xs shadow-xs font-bold">
            <div class="w-2 h-2 rounded-full ${state.distributeThroughoutYear ? 'bg-teal-500' : 'bg-slate-600'}"></div>
            <i data-lucide="clock" class="w-3.5 h-3.5 text-slate-700"></i>
            <span>Intervalo de Trabalho: <strong class="text-slate-950 font-mono font-bold">${gapDays} dias</strong> <span class="text-slate-700 font-medium">(~${monthsStr} de recarga)</span></span>
            ${state.distributeThroughoutYear ? `
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

    return `
      ${gapHtml}
      <div id="stageContainer_${sIdx}_${pIdx}" class="${(sc.periods.length === 1 || pIdx === 0) ? '' : 'hidden'} space-y-3">
        <div class="bg-white/95 border-2 border-slate-300 rounded-2xl p-5 space-y-4 shadow-sm">

          <!-- HEADER DA ETAPA -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-300/80 pb-3">
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

          <!-- FLATTENED 3-COLUMN LINEAR BOARDING PASS ITINERARY (NO NESTED BOXES INSIDE BOXES) -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-0 items-center py-1">
            <!-- COLUNA 1: 🛫 1º DIA LIVRE REAL -->
            <div class="space-y-1">
              <div class="flex items-center justify-between gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <span>🛫 1º DIA LIVRE REAL</span>
                <i data-lucide="arrow-right" class="w-3.5 h-3.5 text-slate-300 hidden md:block"></i>
              </div>
              <div class="text-base sm:text-lg font-black font-mono text-slate-950">
                ${formatDate(p.effectiveStart)}
              </div>
              <div class="text-xs text-slate-600 font-medium">
                ${DAYS_NAME[p.effectiveStart.getDay()]} • ${optimizer.isWorkingDay(p.effectiveStart) ? 'Início de Férias' : 'Repouso Semanal'}
              </div>
            </div>

            <!-- COLUNA 2: 📋 OFICIAL NO SOUGOV / SIGRH -->
            <div class="space-y-1 md:border-l md:border-r border-slate-300 md:px-5 relative">
              <div class="flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-wider text-slate-700">
                <span class="flex items-center gap-1">📋 PERÍODO NO SIGRH</span>
                <div class="flex items-center gap-1.5">
                  <span class="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono font-bold text-[10px]">
                    ${p.length}d
                  </span>
                  <i data-lucide="arrow-right" class="w-3.5 h-3.5 text-slate-300 hidden md:block"></i>
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
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-300/80">
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
          <div id="miniCalendar_${sIdx}_${pIdx}" class="pt-3 border-t border-slate-300/80">
            ${renderMiniCalendar(p, optimizer)}
          </div>

          ${bottomNav}

        </div>
      </div>
    `;
  }

  // Gera o HTML completo do card de cenário (accordion header + body com todas as etapas)
  function buildScenarioCardHtml(sc, sIdx, isChampion, isRibbonActive, isCompared, theme, badgesHtml, tabsHtml, periodsBodyHtml) {
    const topAccentClass = 'bg-slate-900';
    const datesSummary = sc.periods.map(p => `${formatDate(p.startDate).slice(0, 5)} a ${formatDate(p.endDate).slice(0, 5)}`).join('  •  ');

    return `
      <!-- ACCENT TOP BORDER (4PX) -->
      <div class="h-1 w-full ${topAccentClass}"></div>

      <!-- ACCORDION HEADER (CLICKABLE) -->
      <div onclick="window.OtimizaApp.toggleScenario(${sIdx})" class="p-5 sm:p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 select-none hover:bg-slate-300/40 transition-colors">
        <div class="space-y-2 flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-slate-200 text-slate-900 border border-slate-300">OPÇÃO ${String(sIdx + 1).padStart(2, '0')}</span>
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
        </div>

        <div class="flex items-center gap-3 sm:gap-4 self-end md:self-auto flex-wrap">
          <div class="text-right">
            <span class="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">Descanso Real</span>
            <span class="text-xl sm:text-2xl font-black text-slate-900 font-mono">${sc.totalOff} dias</span>
          </div>
          <div class="text-right pl-3.5 border-l border-slate-300">
            <span class="text-[10px] uppercase font-bold text-emerald-800 block tracking-wider">Ganho Líquido</span>
            <span class="text-xl sm:text-2xl font-black text-emerald-700 font-mono">+${sc.extraGain}d</span>
          </div>
          <div class="text-right pl-3.5 border-l border-slate-300">
            <span class="text-[10px] uppercase font-bold text-slate-600 block tracking-wider">Alavancagem</span>
            <span class="text-xl sm:text-2xl font-black text-slate-800 font-mono">${sc.leverage}x</span>
          </div>
          <div class="pl-2 flex items-center gap-2">
            <!-- BOTÃO DE ALTERNÂNCIA PARA O COMPARADOR DESACOPLADO -->
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

        <!-- FOOTER ACTION BUTTONS: MOSTRAR NA FITA & COPIAR RESUMO & BAIXAR .ICS -->
        <div class="pt-3 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-300">
          <button type="button" onclick="window.OtimizaApp.selectScenarioForRibbon(${sIdx}, true)" id="ribbonActiveBtn_${sIdx}" class="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 ${isRibbonActive ? 'bg-slate-200 text-slate-900' : 'bg-white hover:bg-slate-50 text-slate-700'} text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer">
            <i data-lucide="${isRibbonActive ? 'check' : 'activity'}" class="w-4 h-4 ${isRibbonActive ? 'text-emerald-600' : 'text-slate-500'}"></i>
            <span>${isRibbonActive ? 'Ativo na Fita Anual' : 'Destacar na Fita Anual'}</span>
          </button>
          <button type="button" onclick="window.OtimizaApp.copyScenarioSummary(${sIdx}, this)" class="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer">
            <i data-lucide="copy" class="w-4 h-4 text-slate-500"></i>
            <span>Copiar Resumo de Férias</span>
          </button>
          <button type="button" onclick="window.OtimizaApp.downloadScenarioICS(${sIdx})" class="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer">
            <i data-lucide="calendar-plus" class="w-4 h-4 text-white"></i>
            <span>Baixar Calendário (.ICS)</span>
          </button>
        </div>
      </div>
    `;
  }

  // ----------------------------------------------------
  // EXECUÇÃO DA SIMULAÇÃO COM MOTOR COMBINATÓRIO
  // ----------------------------------------------------
  function runSimulation(isUserAction = true) {
    if (!state.hasCalculated && !isUserAction) {
      return;
    }
    state.hasCalculated = true;

    state.vacationDays = parseInt(document.getElementById('vacationDays').value) || 30;
    state.selectedYear = parseInt(document.getElementById('selectedYear').value) || 2027;
    state.selectedLocation = document.getElementById('selectedLocation').value || 'UFBA_SALVADOR';
    state.autoBridgeHolidays = document.getElementById('autoBridgeHolidays').checked;
    state.includeCarnavalCircuito = document.getElementById('includeCarnavalCircuito').checked;
    const vEl = document.getElementById('includeVesperas');
    state.includeVesperas = vEl ? vEl.checked : true;
    state.compensationDays = parseInt(document.getElementById('compensationDays').value) || 0;
    state.distributeThroughoutYear = document.getElementById('distributeThroughoutYear')?.checked || false;

    // Sincroniza feriados se necessário (garante presença de feriados do ano selecionado)
    const hasCurrentYearHolidays = state.holidays && state.holidays.some(h => new Date(h.date).getFullYear() === state.selectedYear);
    if (!hasCurrentYearHolidays) {
      state.holidays = generateHolidays(state.selectedYear, {
        location: state.selectedLocation,
        autoBridge: state.autoBridgeHolidays,
        carnavalCircuito: state.includeCarnavalCircuito,
        recessShift: state.recessShift || 'none',
        includeVesperas: state.includeVesperas
      });
      renderHolidaysTable();
      updateHolidayCountDisplay();
    }

    state.activeScenarioIndex = 0;

    // Limpa estado de comparação ao recalcular para evitar índices órfãos
    state.comparedScenarios = [];
    renderComparatorDock();
    closeComparatorDrawer();

    const optimizerOptions = {
      ...state,
      windowStartDate: state.customWindowEnabled ? state.windowStartDate : null,
      windowYears: state.customWindowEnabled ? state.windowYears : 1,
      excludedPeriods: state.excludedPeriods
    };
    const optimizer = new VacationOptimizer(optimizerOptions);
    const rawScenarios = optimizer.optimize(state.vacationDays, state.vacationSplit);

    const resultsSection = document.getElementById('resultsSection');
    const scenariosContainer = document.getElementById('scenariosContainer');
    const badge = document.getElementById('resultsSummaryBadge');
    const ribbonContainer = document.getElementById('annualRibbonContainer');

    scenariosContainer.innerHTML = '';
    resultsSection.classList.remove('hidden');

    if (rawScenarios.length === 0) {
      scenariosContainer.innerHTML = `
        <div class="bg-amber-50 border border-amber-200 p-8 rounded-3xl text-center space-y-2">
          <i data-lucide="alert-triangle" class="w-8 h-8 text-amber-500 mx-auto"></i>
          <h4 class="font-extrabold text-amber-900 text-sm">Nenhuma combinação encontrada</h4>
          <p class="text-xs text-amber-700">Verifique os dias solicitados ou desmarque a opção anti-fadiga para expandir as alternativas.</p>
        </div>
      `;
      if (ribbonContainer) ribbonContainer.innerHTML = '';
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    // Curadoria inteligente para a Fronteira de Pareto:
    // O VacationOptimizer entrega até 10 opções calibradas e diversificadas,
    // com as campeãs no topo para comparação direta, seguidas das âncoras sazonais e formatos clássicos.
    const scenarios = rawScenarios;

    const best = scenarios[0];

    // RENDERIZA A FITA ANUAL DO TEMPO (ANNUAL RHYTHM RIBBON)
    if (ribbonContainer) {
      ribbonContainer.innerHTML = renderAnnualRibbon(
        best,
        state.selectedYear,
        0,
        state.holidays,
        state.customWindowEnabled ? { windowStartDate: state.windowStartDate, windowYears: state.windowYears } : null
      );
    }

    badge.innerHTML = `
      <div class="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
        <span class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black border border-emerald-200/80 shadow-xs">
          <i data-lucide="sparkles" class="w-4 h-4 text-emerald-600"></i>
          Melhor Resultado: ${best.totalOff} Dias Livres (${best.split.join(' + ')} dias)!
        </span>
        ${state.distributeThroughoutYear ? `
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200 shadow-2xs">
            <i data-lucide="shield-check" class="w-4 h-4 text-teal-600"></i>
            Anti-Fadiga: Pausas espaçadas no ano (≥ 60d entre etapas)
          </span>
        ` : ''}
      </div>
    `;
  scenarios.forEach((sc, sIdx) => {
    const isChampion = sIdx === 0;
    const isRibbonActive = sIdx === (state.activeScenarioIndex || 0);
    const isCompared = state.comparedScenarios && state.comparedScenarios.includes(sIdx);
    const theme = getScenarioStrategicTheme(sc, sIdx, state.distributeThroughoutYear);
    const badgesHtml = buildBadgesHtml(sc, sIdx, state.distributeThroughoutYear);

    const card = document.createElement('div');
    card.id = `scenarioCard_${sIdx}`;
    card.className = isRibbonActive
      ? `bg-gradient-to-br from-amber-100/80 via-sky-50/90 to-indigo-100/70 rounded-3xl border-2 border-amber-400 shadow-xl ring-2 ring-amber-400/40 transition-all duration-300 overflow-hidden`
      : `bg-slate-100/90 rounded-3xl border-2 border-slate-300/90 shadow-md transition-all duration-300 overflow-hidden hover:border-amber-400 hover:shadow-xl hover:bg-gradient-to-br hover:from-amber-100/40 hover:via-sky-50/50 hover:to-indigo-100/40 cursor-pointer`;

    // Abas de navegação entre etapas
    let tabsHtml = '';
    if (sc.periods.length > 1) {
      const tabsItems = [];
      sc.periods.forEach((p, pIdx) => {
        if (pIdx > 0) {
          const prevP = sc.periods[pIdx - 1];
          const gapDays = Math.round((p.effectiveStart - prevP.returnDate) / (1000 * 60 * 60 * 24));
          const monthsVal = (gapDays / 30.4).toFixed(1);
          const monthsStr = monthsVal.endsWith('.0') ? `${parseInt(monthsVal)}m` : `${monthsVal}m`;
          tabsItems.push(`
            <div id="tabGap_${sIdx}_${pIdx}"
              title="Intervalo de trabalho entre Etapa ${pIdx} e Etapa ${pIdx + 1}: ${gapDays} dias (~${monthsStr} de recarga)"
              class="flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-xs select-none shrink-0 text-slate-500 hover:text-slate-800 transition-all">
              <span class="w-2 h-0.5 bg-slate-300 rounded-full"></span>
              <i data-lucide="clock" class="w-3 h-3 text-slate-400"></i>
              <span class="font-mono font-bold text-slate-700 text-[11px]">${gapDays}d</span>
              <span class="text-[10px] text-slate-400 hidden sm:inline">(~${monthsStr})</span>
              <i data-lucide="arrow-right" class="w-3 h-3 text-slate-400"></i>
              <span class="w-2 h-0.5 bg-slate-300 rounded-full"></span>
            </div>
          `);
        }
        tabsItems.push(`
          <button type="button"
            id="tabBtn_${sIdx}_${pIdx}"
            onclick="event.stopPropagation(); window.OtimizaApp.selectStageTab(${sIdx}, ${pIdx}, ${sc.periods.length})"
            class="px-3.5 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${pIdx === 0 ? 'bg-slate-900 text-white font-black shadow-xs' : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-950 font-bold border border-slate-200/80'}">
            <span id="tabBadge_${sIdx}_${pIdx}" class="w-4 h-4 rounded-md ${pIdx === 0 ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'} flex items-center justify-center font-mono font-black text-[9px]">${String(pIdx + 1).padStart(2, '0')}</span>
            <span>Etapa ${pIdx + 1} (${p.length}d)</span>
          </button>
        `);
      });
      tabsHtml = `
        <!-- SELETOR DE ETAPAS VIA ABAS (SEGMENTED CONTROL & TIMELINE STEPPER) -->
        <div class="pb-3 border-b border-slate-300">
          <div class="w-full flex items-center justify-between gap-2 p-1.5 bg-slate-200/90 rounded-2xl border border-slate-300/80 shadow-2xs">
            <div class="flex items-center gap-1 sm:gap-1.5 shrink-0 flex-wrap sm:flex-nowrap">
              ${tabsItems.join('')}
              <div class="h-4 w-px bg-slate-300/80 shrink-0 mx-1 hidden sm:block"></div>
              <button type="button"
                id="tabBtn_${sIdx}_all"
                onclick="event.stopPropagation(); window.OtimizaApp.selectStageTab(${sIdx}, 'all', ${sc.periods.length})"
                class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200/80">
                <i data-lucide="layers" class="w-3.5 h-3.5"></i>
                <span>Todas</span>
              </button>
            </div>
            <div id="tabInfo_${sIdx}" class="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5 shrink-0 px-2 hidden 2xl:flex">
              <span class="flex items-center gap-1 text-slate-600">
                <i data-lucide="calendar" class="w-3.5 h-3.5 text-slate-500"></i>
                Exibindo Etapa 1 de ${sc.periods.length}
              </span>
            </div>
          </div>
        </div>
      `;
    }

    // Etapas e card completo usando os builders dedicados
    const periodsBodyHtml = sc.periods.map((p, pIdx) => buildPeriodHtml(sc, sIdx, p, pIdx, optimizer)).join('');
    card.innerHTML = buildScenarioCardHtml(sc, sIdx, isChampion, isRibbonActive, isCompared, theme, badgesHtml, tabsHtml, periodsBodyHtml);

    scenariosContainer.appendChild(card);
  });

    state.currentScenarios = scenarios;

    if (window.lucide) window.lucide.createIcons();

    if (isUserAction) {
      if (window.confetti) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      }
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  function formatICSDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
  }

  function copyScenarioSummary(sIdx, btnEl) {
    const sc = state.currentScenarios && state.currentScenarios[sIdx];
    if (!sc) return;

    let text = `PLANEJAMENTO DE FÉRIAS - EXERCÍCIO ${state.selectedYear}\n`;
    text += `Total: ${sc.vacationDays} dias oficiais (${sc.totalOff} dias de descanso real)\n\n`;
    sc.periods.forEach((p, idx) => {
      text += `• Etapa ${idx + 1} (${p.length} dias): ${formatDate(p.startDate)} a ${formatDate(p.endDate)} | Retorno: ${formatDate(p.returnDate)}\n`;
    });
    if (sc.compensationDays > 0) {
      text += `\n* Inclui ${sc.compensationDays} dia(s) de banco de horas/compensação.\n`;
    }

    navigator.clipboard.writeText(text).then(() => {
      if (!btnEl) return;
      const originalHtml = btnEl.innerHTML;
      btnEl.innerHTML = `<i data-lucide="check" class="w-4 h-4 text-emerald-600"></i><span class="text-emerald-700">Copiado com Sucesso!</span>`;
      btnEl.classList.add('bg-emerald-50', 'border-emerald-200');
      if (window.lucide) window.lucide.createIcons();
      setTimeout(() => {
        btnEl.innerHTML = originalHtml;
        btnEl.classList.remove('bg-emerald-50', 'border-emerald-200');
        if (window.lucide) window.lucide.createIcons();
      }, 2000);
    }).catch(err => {
      console.error('Falha ao copiar:', err);
      alert('Resumo:\n\n' + text);
    });
  }

  function downloadScenarioICS(sIdx) {
    const sc = state.currentScenarios && state.currentScenarios[sIdx];
    if (!sc) return;

    const now = new Date();
    const dtstamp = formatICSDate(now) + 'T' + String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0') + '00Z';

    let ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Otimiza Ferias UFBA//PT',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Férias UFBA ' + state.selectedYear
    ];

    sc.periods.forEach((p, idx) => {
      const uid = `ferias-${state.selectedYear}-p${idx + 1}-${p.startDate.getTime()}@otimizaferias.ufba`;
      const startStr = formatICSDate(p.effectiveStart);
      const endStr = formatICSDate(p.returnDate); // DTEND exclusivo no padrão iCalendar

      ics.push('BEGIN:VEVENT');
      ics.push(`UID:${uid}`);
      ics.push(`DTSTAMP:${dtstamp}`);
      ics.push(`DTSTART;VALUE=DATE:${startStr}`);
      ics.push(`DTEND;VALUE=DATE:${endStr}`);
      ics.push(`SUMMARY:Férias UFBA - Etapa ${idx + 1} (${p.length}d oficiais | ${p.totalOff}d descanso)`);
      ics.push(`DESCRIPTION:Período oficial de férias: ${formatDate(p.startDate)} a ${formatDate(p.endDate)} (${p.length} dias).\\nRetorno obrigatório ao trabalho: ${formatDate(p.returnDate)}.\\nDescanso contínuo total: ${p.totalOff} dias.`);
      ics.push('STATUS:CONFIRMED');
      ics.push('TRANSP:OPAQUE');
      ics.push('END:VEVENT');
    });

    ics.push('END:VCALENDAR');

    const blob = new Blob([ics.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ferias_ufba_${state.selectedYear}_opcao${sIdx + 1}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ----------------------------------------------------
  // COMPARADOR DESACOPLADO (DOCK FLUTUANTE + SLIDE-OVER DRAWER)
  // ----------------------------------------------------
  function toggleCompareScenario(sIdx) {
    if (typeof sIdx !== 'number' || isNaN(sIdx)) return;
    if (!state.comparedScenarios) state.comparedScenarios = [];

    const existingPos = state.comparedScenarios.indexOf(sIdx);
    if (existingPos !== -1) {
      state.comparedScenarios.splice(existingPos, 1);
    } else {
      if (state.comparedScenarios.length >= 3) {
        if (typeof window !== 'undefined' && window.alert) {
          alert('Você pode comparar no máximo 3 cenários simultaneamente.');
        }
        return;
      }
      state.comparedScenarios.push(sIdx);
      state.comparedScenarios.sort((a, b) => a - b);
    }

    updateScenarioCompareButton(sIdx);
    renderComparatorDock();

    const drawer = typeof document !== 'undefined' ? document.getElementById('comparatorDrawer') : null;
    if (drawer && !drawer.classList.contains('translate-x-full')) {
      if (state.comparedScenarios.length === 0) {
        closeComparatorDrawer();
      } else {
        renderComparatorDrawer();
      }
    }
  }

  function removeScenarioFromComparison(sIdx) {
    if (!state.comparedScenarios) return;
    state.comparedScenarios = state.comparedScenarios.filter(idx => idx !== sIdx);
    updateScenarioCompareButton(sIdx);
    renderComparatorDock();

    const drawer = typeof document !== 'undefined' ? document.getElementById('comparatorDrawer') : null;
    if (drawer && !drawer.classList.contains('translate-x-full')) {
      if (state.comparedScenarios.length === 0) {
        closeComparatorDrawer();
      } else {
        renderComparatorDrawer();
      }
    }
  }

  function updateScenarioCompareButton(sIdx) {
    if (typeof document === 'undefined') return;
    const btn = document.getElementById(`btnCompare_${sIdx}`);
    if (!btn) return;
    const isCompared = state.comparedScenarios && state.comparedScenarios.includes(sIdx);
    if (isCompared) {
      btn.className = 'px-3 py-2 rounded-xl border border-amber-500 bg-amber-400 text-slate-950 font-black text-xs transition-all duration-200 flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs ring-2 ring-amber-400/40';
      btn.setAttribute('aria-label', `Remover Opção ${sIdx + 1} da comparação`);
      btn.innerHTML = `<i data-lucide="check" class="w-3.5 h-3.5 text-slate-950"></i><span>Comparando</span>`;
    } else {
      btn.className = 'px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-950 font-bold text-xs transition-all duration-200 flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs';
      btn.setAttribute('aria-label', `Adicionar Opção ${sIdx + 1} à comparação`);
      btn.innerHTML = `<i data-lucide="plus" class="w-3.5 h-3.5 text-slate-500"></i><span>Comparar</span>`;
    }
    if (window.lucide) window.lucide.createIcons();
  }

  function clearComparison() {
    const prev = [...(state.comparedScenarios || [])];
    state.comparedScenarios = [];
    prev.forEach(sIdx => updateScenarioCompareButton(sIdx));
    renderComparatorDock();
    closeComparatorDrawer();
  }

  function openComparatorDrawer() {
    if (typeof document === 'undefined') return;
    if (!state.comparedScenarios || state.comparedScenarios.length === 0) return;

    const drawer = document.getElementById('comparatorDrawer');
    const backdrop = document.getElementById('comparatorBackdrop');
    if (drawer) {
      drawer.classList.remove('translate-x-full');
    }
    if (backdrop) {
      backdrop.classList.remove('opacity-0', 'pointer-events-none');
      backdrop.classList.add('opacity-100', 'pointer-events-auto');
    }
    renderComparatorDrawer();
  }

  function closeComparatorDrawer() {
    if (typeof document === 'undefined') return;
    const drawer = document.getElementById('comparatorDrawer');
    const backdrop = document.getElementById('comparatorBackdrop');
    if (drawer) {
      drawer.classList.add('translate-x-full');
    }
    if (backdrop) {
      backdrop.classList.add('opacity-0', 'pointer-events-none');
      backdrop.classList.remove('opacity-100', 'pointer-events-auto');
    }
  }

  function renderComparatorDock() {
    if (typeof document === 'undefined') return;
    const dock = document.getElementById('comparatorDock');
    const counter = document.getElementById('dockCounter');
    const chips = document.getElementById('dockSelectedChips');
    if (!dock) return;

    const count = (state.comparedScenarios || []).length;
    if (counter) counter.innerText = `${count} / 3`;

    if (count === 0) {
      dock.classList.add('translate-y-28', 'opacity-0', 'pointer-events-none');
      dock.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto');
      if (chips) chips.innerHTML = '';
    } else {
      dock.classList.remove('translate-y-28', 'opacity-0', 'pointer-events-none');
      dock.classList.add('translate-y-0', 'opacity-100', 'pointer-events-auto');

      if (chips) {
        chips.innerHTML = state.comparedScenarios.map(sIdx => {
          const sc = state.currentScenarios && state.currentScenarios[sIdx];
          const label = sc ? `Opção ${String(sIdx + 1).padStart(2, '0')}` : `Opção ${sIdx + 1}`;
          return `
            <div class="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-[11px] font-mono font-bold text-slate-200 shrink-0">
              <span>${label}</span>
              <button type="button" onclick="event.stopPropagation(); window.OtimizaApp.toggleCompareScenario(${sIdx})" aria-label="Remover ${label} da comparação" class="w-4 h-4 rounded-full hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer">
                <i data-lucide="x" class="w-3 h-3"></i>
              </button>
            </div>
          `;
        }).join('');
      }
    }

    if (window.lucide) window.lucide.createIcons();
  }

  function renderComparatorDrawer() {
    if (!state.comparedScenarios || state.comparedScenarios.length === 0) {
      if (typeof document !== 'undefined') {
        const contentEl = document.getElementById('comparatorDrawerContent');
        if (contentEl) {
          contentEl.innerHTML = `
            <div class="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <div class="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 mx-auto flex items-center justify-center">
                <i data-lucide="columns-2" class="w-6 h-6"></i>
              </div>
              <h4 class="font-extrabold text-slate-900 text-sm">Nenhum cenário selecionado</h4>
              <p class="text-xs text-slate-500 max-w-sm mx-auto">Selecione até 3 opções clicando em "+ Comparar" nos cards para analisar lado a lado.</p>
            </div>
          `;
          if (window.lucide) window.lucide.createIcons();
        }
      }
      return '';
    }

    const comparedList = state.comparedScenarios
      .map(idx => ({ idx, sc: state.currentScenarios && state.currentScenarios[idx] }))
      .filter(item => !!item.sc);

    if (comparedList.length === 0) return '';

    const maxOff = Math.max(...comparedList.map(item => item.sc.totalOff));
    const minOff = Math.min(...comparedList.map(item => item.sc.totalOff));
    const champions = comparedList.filter(item => item.sc.totalOff === maxOff);
    const delta = maxOff - minOff;

    let comparativeDeltaText = '';
    if (comparedList.length === 1) {
      comparativeDeltaText = `A <strong>Opção ${champions[0].idx + 1} (${champions[0].sc.split.join('+')}d)</strong> proporciona <strong>${champions[0].sc.totalOff} dias de descanso contínuo</strong> com ganho líquido de <strong>+${champions[0].sc.extraGain}d</strong>. Selecione mais opções nos cards para analisar lado a lado.`;
    } else if (delta > 0) {
      const champNames = champions.map(c => `Opção ${c.idx + 1} (${c.sc.split.join('+')}d)`).join(', ');
      comparativeDeltaText = `A <strong>${champNames}</strong> é a campeã da comparação, alcançando <strong>+${delta} dias livres adicionais</strong> (${maxOff}d vs ${minOff}d) e alavancagem de <strong>${champions[0].sc.leverage}x</strong> sobre a cota oficial.`;
    } else {
      comparativeDeltaText = `As opções selecionadas oferecem descansos equivalentes (<strong>${maxOff} dias livres</strong>), diferindo no formato de parcelamento e no aproveitamento dos feriados de Salvador/BA.`;
    }

    const gridColsClass = comparedList.length === 1
      ? 'grid grid-cols-1 max-w-lg mx-auto gap-5'
      : (comparedList.length === 2
          ? 'grid grid-cols-1 md:grid-cols-2 gap-5'
          : 'grid grid-cols-1 lg:grid-cols-3 gap-5');

    const scenarioColsHtml = comparedList.map(({ idx: sIdx, sc }) => {
      const isTopRanked = sc.totalOff === maxOff;

      // Contagem de feriados e pontes oficiais emendados no cenário
      const holidaysInScenario = [];
      sc.periods.forEach(p => {
        const hList = [...(p.holidaysBefore || []), ...(p.holidaysAfter || []), ...(p.holidaysInside || [])];
        hList.forEach(h => {
          if (h && h.date && !holidaysInScenario.some(x => x.date === h.date)) {
            holidaysInScenario.push(h);
          }
        });
      });
      const totalHolidaysCount = holidaysInScenario.length;

      // Intervalos de dias de trabalho (fadiga) entre as etapas
      let intervalsHtml = '';
      if (sc.periods.length > 1) {
        const intervalItems = [];
        for (let pIdx = 1; pIdx < sc.periods.length; pIdx++) {
          const prevP = sc.periods[pIdx - 1];
          const currP = sc.periods[pIdx];
          const gapDays = Math.round((currP.effectiveStart - prevP.returnDate) / (1000 * 60 * 60 * 24));
          const monthsVal = (gapDays / 30.4).toFixed(1);
          const monthsStr = monthsVal.endsWith('.0') ? `${parseInt(monthsVal)} meses` : `${monthsVal} meses`;
          const isAntiFatigue = gapDays >= 60;

          intervalItems.push(`
            <div class="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-slate-100 border border-slate-200">
              <span class="text-slate-600 font-medium">Etapa ${pIdx} ➔ ${pIdx + 1}:</span>
              <div class="flex items-center gap-1.5">
                <strong class="font-mono text-slate-900">${gapDays} dias de trabalho</strong>
                <span class="text-[10px] text-slate-500 font-medium">(~${monthsStr})</span>
                ${isAntiFatigue ? '<span class="text-teal-700 text-[10px] font-bold bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200" title="Anti-fadiga adequado (≥ 60d)">Anti-fadiga</span>' : ''}
              </div>
            </div>
          `);
        }
        intervalsHtml = `
          <div class="space-y-1.5 pt-2 border-t border-slate-200">
            <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <span>Intervalos de Trabalho (Fadiga)</span>
              <i data-lucide="clock" class="w-3.5 h-3.5 text-slate-400"></i>
            </div>
            <div class="space-y-1">
              ${intervalItems.join('')}
            </div>
          </div>
        `;
      } else {
        intervalsHtml = `
          <div class="pt-2 border-t border-slate-200 text-xs text-slate-500 flex items-center gap-1.5 py-1">
            <i data-lucide="calendar" class="w-3.5 h-3.5 text-slate-400"></i>
            <span>Período único contínuo de ${sc.vacationDays} dias (sem intervalos intermediários)</span>
          </div>
        `;
      }

      // Itinerário técnico das etapas
      let stagesHtml = '';
      sc.periods.forEach((p, pIdx) => {
        const pJoinedHolidays = [...(p.holidaysBefore || []), ...(p.holidaysAfter || []), ...(p.holidaysInside || [])];
        const pHolidayTags = pJoinedHolidays.map(h => {
          const isFacultativo = h.type === 'recesso' || h.type === 'vespera' || h.type === 'ponte' || h.type === 'servidor' || (h.name && h.name.toLowerCase().includes('facultativo'));
          const colorClass = isFacultativo ? 'bg-blue-50 text-blue-900 border border-blue-300' : 'bg-amber-100 text-amber-950 border border-amber-300';
          return `<span class="${colorClass} px-2 py-0.5 rounded-md text-[10px] font-bold">${h.name}</span>`;
        }).join(' ');

        stagesHtml += `
          <div class="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="font-mono font-black text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                Etapa ${pIdx + 1} (${p.length}d)
              </span>
              <div class="flex items-center gap-1.5">
                ${p.compDaysApplied > 0 ? `<span class="font-mono font-bold text-sky-800 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded-md text-[10px]">+${p.compDaysApplied}d Banco</span>` : ''}
                <span class="font-mono font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[11px]">
                  🔥 ${p.totalOff}d livres
                </span>
              </div>
            </div>

            <div class="space-y-1 text-xs">
              <div class="flex items-center justify-between text-slate-600">
                <span>Período SIGRH:</span>
                <strong class="font-mono text-slate-900">${formatDate(p.startDate)} a ${formatDate(p.endDate)}</strong>
              </div>
              <div class="flex items-center justify-between text-slate-600">
                <span>1º Dia Livre:</span>
                <strong class="font-mono text-slate-900">${formatDate(p.effectiveStart)} (${DAYS_NAME[p.effectiveStart.getDay()]})</strong>
              </div>
              <div class="flex items-center justify-between text-emerald-800 font-semibold">
                <span>Volta ao Trabalho:</span>
                <strong class="font-mono text-emerald-900">${formatDate(p.returnDate)} (${DAYS_NAME[p.returnDate.getDay()]})</strong>
              </div>
            </div>

            <div class="pt-1 text-[10px]">
              ${p.wastedEndDays === 0
                ? '<span class="text-emerald-700 font-bold flex items-center gap-1"><i data-lucide="check" class="w-3.5 h-3.5 text-emerald-600"></i> Termina em dia útil</span>'
                : '<span class="text-amber-800 font-bold flex items-center gap-1"><i data-lucide="alert-circle" class="w-3.5 h-3.5 text-amber-600"></i> Termina em repouso (' + p.wastedEndDays + 'd)</span>'
              }
            </div>

            ${pJoinedHolidays.length > 0 ? `
              <div class="pt-1 border-t border-slate-200 flex items-center gap-1 flex-wrap">
                <span class="text-[10px] font-bold text-slate-400">Emenda:</span>
                ${pHolidayTags}
              </div>
            ` : ''}
          </div>
        `;
      });

      return `
        <div class="bg-white rounded-2xl border-2 ${isTopRanked ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-slate-300'} p-5 space-y-4 shadow-xs flex flex-col justify-between">
          <div class="space-y-4">
            <!-- CABEÇALHO DA COLUNA -->
            <div class="flex items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <div class="flex items-center gap-1.5">
                  <span class="font-mono font-black text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                    Opção ${sIdx + 1} • ${sc.split.join('+')}d
                  </span>
                  ${isTopRanked ? '<span class="bg-amber-100 text-amber-950 border border-amber-300 px-2 py-0.5 rounded-md text-[10px] font-black uppercase flex items-center gap-1"><i data-lucide="crown" class="w-3.5 h-3.5 text-amber-700"></i> Campeã</span>' : ''}
                </div>
                <h4 class="font-black text-slate-900 text-lg font-mono tracking-tight mt-1">
                  ${sc.split.join(' + ')} dias
                </h4>
              </div>
              
              <!-- BOTÃO REMOVER INDIVIDUAL -->
              <button type="button" 
                onclick="event.stopPropagation(); window.OtimizaApp.toggleCompareScenario(${sIdx})" 
                title="Remover da comparação" 
                aria-label="Remover Opção ${sIdx + 1} da comparação"
                class="text-slate-400 hover:text-red-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
                <i data-lucide="x" class="w-4 h-4"></i>
              </button>
            </div>

            <!-- KPI PRINCIPAL: DESCANSO REAL CONTÍNUO -->
            <div class="bg-slate-900 text-white rounded-xl p-4 text-center space-y-0.5 shadow-xs">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Descanso Real Contínuo</span>
              <div class="text-3xl font-black font-mono text-amber-400">
                ${sc.totalOff} <span class="text-sm font-sans font-bold text-slate-300">dias livres</span>
              </div>
            </div>

            <!-- GRID 2x2 DE MÉTRICAS ANALÍTICAS -->
            <div class="grid grid-cols-2 gap-2 text-center">
              <!-- GANHO LÍQUIDO -->
              <div class="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <span class="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Ganho Líquido</span>
                <span class="text-base font-black font-mono text-emerald-700">+${sc.extraGain}d</span>
              </div>

              <!-- ALAVANCAGEM -->
              <div class="p-2.5 rounded-xl bg-slate-100 border border-slate-200">
                <span class="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Alavancagem</span>
                <span class="text-base font-black font-mono text-slate-800">${sc.leverage}x</span>
              </div>

              <!-- DESPERDÍCIO NO ENCERRAMENTO (FINS DE SEMANA) -->
              <div class="p-2.5 rounded-xl ${sc.totalWasted === 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}">
                <span class="text-[10px] font-bold ${sc.totalWasted === 0 ? 'text-emerald-800' : 'text-amber-800'} uppercase tracking-wider block">Fins de Semana</span>
                <span class="text-xs font-black font-mono ${sc.totalWasted === 0 ? 'text-emerald-700 flex items-center justify-center gap-1' : 'text-amber-800 flex items-center justify-center gap-1'}">
                  ${sc.totalWasted === 0 ? '<i data-lucide="check" class="w-3.5 h-3.5 text-emerald-600"></i> 0d Desperdício' : '<i data-lucide="alert-triangle" class="w-3.5 h-3.5 text-amber-600"></i> ' + sc.totalWasted + 'd em repouso'}
                </span>
              </div>

              <!-- FERIADOS / PONTES APROVEITADOS -->
              <div class="p-2.5 rounded-xl bg-sky-50 border border-sky-200">
                <span class="text-[10px] font-bold text-sky-800 uppercase tracking-wider block">Feriados / Pontes</span>
                <span class="text-base font-black font-mono text-sky-800">${totalHolidaysCount} d</span>
              </div>
            </div>

            <!-- INTERVALOS DE TRABALHO (FADIGA) -->
            ${intervalsHtml}

            <!-- ITINERÁRIO TÉCNICO DAS ETAPAS -->
            <div class="space-y-2 pt-2 border-t border-slate-200">
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Itinerário das Etapas</span>
              <div class="space-y-2">
                ${stagesHtml}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    const fullHtml = `
      <div class="space-y-6">
        <!-- SÍNTESE ANALÍTICA -->
        <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-start gap-3">
          <div class="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <i data-lucide="sparkles" class="w-4 h-4 text-amber-600"></i>
          </div>
          <div class="space-y-0.5 text-xs text-slate-700">
            <h5 class="font-black text-slate-900 text-xs">Síntese Analítica da Comparação</h5>
            <p>${comparativeDeltaText}</p>
          </div>
        </div>

        <!-- GRID DAS COLUNAS -->
        <div class="${gridColsClass}">
          ${scenarioColsHtml}
        </div>
      </div>
    `;

    if (typeof document !== 'undefined') {
      const contentEl = document.getElementById('comparatorDrawerContent');
      if (contentEl) {
        contentEl.innerHTML = fullHtml;
      }
      if (window.lucide) window.lucide.createIcons();
    }

    return fullHtml;
  }

  function copyComparisonSummary(btnEl) {
    if (!state.comparedScenarios || state.comparedScenarios.length === 0) return;
    const comparedList = state.comparedScenarios
      .map(idx => ({ idx, sc: state.currentScenarios && state.currentScenarios[idx] }))
      .filter(item => !!item.sc);
    if (comparedList.length === 0) return;

    let text = `COMPARATIVO TÉCNICO DE CENÁRIOS DE FÉRIAS • UFBA (Ano ${state.selectedYear})\n`;
    text += `Regime Estatutário (Lei 8.112/1990) • Calendário Salvador / BA\n`;
    text += `========================================================\n\n`;

    comparedList.forEach(({ idx, sc }) => {
      text += `OPÇÃO ${String(idx + 1).padStart(2, '0')} • Divisão: ${sc.split.join(' + ')} dias\n`;
      text += `--------------------------------------------------------\n`;
      text += `• Descanso Real Contínuo: ${sc.totalOff} dias\n`;
      text += `• Ganho Líquido: +${sc.extraGain} dias\n`;
      text += `• Alavancagem: ${sc.leverage}x\n`;
      text += `• Fins de Semana no Encerramento: ${sc.totalWasted === 0 ? '0d (Desperdício Zero)' : sc.totalWasted + 'd em repouso'}\n`;

      if (sc.periods.length > 1) {
        text += `• Intervalos de Trabalho:\n`;
        for (let pIdx = 1; pIdx < sc.periods.length; pIdx++) {
          const prevP = sc.periods[pIdx - 1];
          const currP = sc.periods[pIdx];
          const gapDays = Math.round((currP.effectiveStart - prevP.returnDate) / (1000 * 60 * 60 * 24));
          const monthsVal = (gapDays / 30.4).toFixed(1);
          text += `  - Etapa ${pIdx} ➔ ${pIdx + 1}: ${gapDays} dias de trabalho (~${monthsVal} meses)\n`;
        }
      }

      text += `• Etapas:\n`;
      sc.periods.forEach((p, pIdx) => {
        text += `  [Etapa ${pIdx + 1}: ${p.length}d marcados | ${p.totalOff}d livres]\n`;
        text += `    Período SIGRH: ${formatDate(p.startDate)} a ${formatDate(p.endDate)}\n`;
        text += `    1º Dia Livre: ${formatDate(p.effectiveStart)} (${DAYS_NAME[p.effectiveStart.getDay()]})\n`;
        text += `    Volta ao Trabalho: ${formatDate(p.returnDate)} (${DAYS_NAME[p.returnDate.getDay()]})\n`;
        if (p.compDaysApplied > 0) {
          text += `    Banco de Horas: +${p.compDaysApplied}d aplicado\n`;
        }
      });
      text += `\n`;
    });

    text += `Gerado pelo Folga Extra (UFBA)\n`;

    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        if (!btnEl) return;
        const originalHtml = btnEl.innerHTML;
        btnEl.innerHTML = `<i data-lucide="check" class="w-3.5 h-3.5 text-emerald-600"></i><span class="text-emerald-700">Copiado!</span>`;
        btnEl.classList.add('bg-emerald-50', 'border-emerald-200');
        if (window.lucide) window.lucide.createIcons();
        setTimeout(() => {
          btnEl.innerHTML = originalHtml;
          btnEl.classList.remove('bg-emerald-50', 'border-emerald-200');
          if (window.lucide) window.lucide.createIcons();
        }, 2000);
      }).catch(err => {
        console.error('Falha ao copiar:', err);
        if (typeof window !== 'undefined' && window.alert) alert('Comparativo:\n\n' + text);
      });
    }
  }

  function setProfile(p = 'servidor_ufba') {
    state.profile = 'servidor_ufba';
    const c1 = document.getElementById('includeCarnavalCircuito');
    const c2 = document.getElementById('autoBridgeHolidays');
    if (c1) c1.checked = true;
    if (c2) c2.checked = true;
    onYearOrLocationChange();
    runSimulation(false);
  }

  // Listener global para fechar drawer com tecla Escape
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeComparatorDrawer();
    });
  }

  // Exporta métodos para o escopo global (usado pelos atributos onclick)
  if (typeof window !== 'undefined') {
    window.OtimizaApp = {
      state,
      setProfile,
      setSplit,
      setVacationDays,
      setRecessShift,
      changeCompensation,
      toggleWorkingDay,
      onYearOrLocationChange,
      toggleHolidayList,
      removeHoliday,
      addCustomHoliday,
      toggleScenario,
      toggleMiniCalendar,
      selectStageTab,
      selectScenarioForRibbon,
      runSimulation,
      copyScenarioSummary,
      downloadScenarioICS,
      toggleCompareScenario,
      clearComparison,
      openComparatorDrawer,
      closeComparatorDrawer,
      renderComparatorDock,
      renderComparatorDrawer,
      copyComparisonSummary,
      toggleCustomWindowSection,
      toggleEnableCustomWindow,
      setWindowYears,
      onCustomWindowParamsChange,
      addExcludedPeriod,
      removeExcludedPeriod,
      renderExcludedPeriods
    };

    // Atalhos globais para eventos inline do HTML
    window.setProfile = setProfile;
    window.setSplit = setSplit;
    window.setVacationDays = setVacationDays;
    window.onVacationDaysInput = onVacationDaysInput;
    window.setRecessShift = setRecessShift;
    window.changeCompensation = changeCompensation;
    window.toggleWorkingDay = toggleWorkingDay;
    window.onYearOrLocationChange = onYearOrLocationChange;
    window.toggleHolidayList = toggleHolidayList;
    window.removeHoliday = removeHoliday;
    window.addCustomHoliday = addCustomHoliday;
    window.toggleScenario = toggleScenario;
    window.toggleMiniCalendar = toggleMiniCalendar;
    window.selectStageTab = selectStageTab;
    window.selectScenarioForRibbon = selectScenarioForRibbon;
    window.runSimulation = runSimulation;
    window.copyScenarioSummary = copyScenarioSummary;
    window.downloadScenarioICS = downloadScenarioICS;
    window.getScenarioStrategicTheme = getScenarioStrategicTheme;
    window.toggleCompareScenario = toggleCompareScenario;
    window.clearComparison = clearComparison;
    window.openComparatorDrawer = openComparatorDrawer;
    window.closeComparatorDrawer = closeComparatorDrawer;
    window.renderComparatorDock = renderComparatorDock;
    window.renderComparatorDrawer = renderComparatorDrawer;
    window.copyComparisonSummary = copyComparisonSummary;
    window.toggleCustomWindowSection = toggleCustomWindowSection;
    window.toggleEnableCustomWindow = toggleEnableCustomWindow;
    window.setWindowYears = setWindowYears;
    window.onCustomWindowParamsChange = onCustomWindowParamsChange;
    window.addExcludedPeriod = addExcludedPeriod;
    window.removeExcludedPeriod = removeExcludedPeriod;
    window.renderExcludedPeriods = renderExcludedPeriods;
  }

  // Inicialização na carga do DOM (apenas no navegador)
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      initWorkingDaysUI();
      onYearOrLocationChange();
      // Não executa simulação na carga inicial: os resultados permanecem 100% ocultos até o clique em Calcular
      if (typeof window !== 'undefined' && window.lucide) window.lucide.createIcons();
    });
  }

  // Exportação CommonJS para testes automatizados em Node.js
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      selectStageTab,
      getScenarioStrategicTheme,
      toggleCompareScenario,
      removeScenarioFromComparison,
      clearComparison,
      openComparatorDrawer,
      closeComparatorDrawer,
      renderComparatorDock,
      renderComparatorDrawer,
      copyComparisonSummary,
      toggleCustomWindowSection,
      toggleEnableCustomWindow,
      setWindowYears,
      onCustomWindowParamsChange,
      addExcludedPeriod,
      removeExcludedPeriod,
      renderExcludedPeriods,
      state
    };
  }
})();

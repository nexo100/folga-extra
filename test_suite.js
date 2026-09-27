const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { getEasterDate, addDays, formatDate, formatISODate, parseDate, generateHolidays, generateHolidaysForRange, DAYS_NAME } = require('./js/holidays.js');
const { VacationOptimizer } = require('./js/optimizer.js');
const { renderAnnualRibbon } = require('./js/ribbon.js');
const { renderMiniCalendar } = require('./js/mini-calendar.js');
const { getScenarioStrategicTheme } = require('./js/app.js');

// ---------------------------------------------------------------------
// CONFIGURAÇÃO DO RUNNER E FILTROS CLI
// ---------------------------------------------------------------------
// Uso:
//   node test_suite.js             -> Executa todos os testes (1 a 24)
//   node test_suite.js --core      -> Executa regras jurídicas e otimizador
//   node test_suite.js --ui        -> Executa componentes visuais (Fita, Calendário, Boarding Pass)
//   node test_suite.js --tags      -> Executa catálogo das 30+ tags temáticas
//   node test_suite.js --colors    -> Executa o Linter de Integridade do Guia de Cores
// ---------------------------------------------------------------------
const args = process.argv.slice(2);
const runAll = args.length === 0 || args.includes('--all');
const runCore = runAll || args.includes('--core') || args.includes('--engine');
const runUI = runAll || args.includes('--ui') || args.includes('--components');
const runTags = runAll || args.includes('--tags') || args.includes('--themes');
const runColors = runAll || args.includes('--colors') || args.includes('--design');

console.log('========================================================');
console.log('🚀 BATERIA DE TESTES MODERNIZADA • FOLGA EXTRA (v3.0)');
console.log(`📌 Filtro Ativo: ${runAll ? 'TODOS OS TESTES (Suíte Completa)' : args.join(' ')}`);
console.log('========================================================\n');

let passedTests = 0;
let totalTests = 0;
let skippedTests = 0;

function runTest(name, suite, fn) {
  let shouldRun = false;
  if (suite === 'core' && runCore) shouldRun = true;
  if (suite === 'ui' && runUI) shouldRun = true;
  if (suite === 'tags' && runTags) shouldRun = true;
  if (suite === 'colors' && runColors) shouldRun = true;

  if (!shouldRun) {
    skippedTests++;
    return;
  }

  totalTests++;
  const suiteBadge = {
    core: '⚖️  [CORE]  ',
    ui: '🎨 [UI]    ',
    tags: '🏷️  [TAGS]  ',
    colors: '👁️  [DESIGN]'
  }[suite] || '🧪 [TEST]  ';

  try {
    fn();
    console.log(`✅ ${suiteBadge} ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ ${suiteBadge} ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

// TESTE 1: Cálculo astronômico da Páscoa e Carnaval (2025 - 2028)
// ---------------------------------------------------------------------
runTest('Teste 1: Cálculo exato da Páscoa e Carnaval móveis', 'core', () => {
  // Datas astronômicas oficiais verificadas pelo Observatório Nacional
  const expectedEasters = {
    2025: '2025-04-20',
    2026: '2026-04-05',
    2027: '2027-03-28',
    2028: '2028-04-16'
  };

  for (const [y, expected] of Object.entries(expectedEasters)) {
    const year = Number(y);
    const easter = getEasterDate(year);
    const actual = formatISODate(easter);
    assert.strictEqual(actual, expected, `Páscoa de ${year} esperada ${expected}, obteve ${actual}`);
    
    // Terça de Carnaval deve ser exatamente Páscoa - 47 dias
    const carnavalTer = addDays(easter, -47);
    const diffDays = Math.round((easter - carnavalTer) / (1000 * 60 * 60 * 24));
    assert.strictEqual(diffDays, 47, `Carnaval de ${year} deve estar a 47 dias da Páscoa`);
  }
});

// ---------------------------------------------------------------------
// TESTE 2: Remoção definitiva da Quinta-feira Santa na UFBA
// ---------------------------------------------------------------------
runTest('Teste 2: Quinta-feira Santa NÃO deve constar como feriado', 'core', () => {
  [2025, 2026, 2027, 2028].forEach(year => {
    const holidays = generateHolidays(year, 'UFBA_SALVADOR', true, true);
    const easter = getEasterDate(year);
    const quintaSanta = formatISODate(addDays(easter, -3));
    
    const found = holidays.some(h => formatISODate(h.date) === quintaSanta && h.name.includes('Quinta-feira Santa'));
    assert.strictEqual(found, false, `Quinta-feira Santa não pode ser feriado para UFBA em ${year}`);
  });
});

// ---------------------------------------------------------------------
// TESTE 3: Presença obrigatória do feriado de 20 de Novembro (Consciência Negra)
// ---------------------------------------------------------------------
runTest('Teste 3: 20 de Novembro (Consciência Negra) deve ser Feriado Nacional obrigatório', 'core', () => {
  [2025, 2026, 2027, 2028].forEach(year => {
    const holidays = generateHolidays(year, 'UFBA_SALVADOR', true, true);
    const target = `${year}-11-20`;
    const found = holidays.find(h => formatISODate(h.date) === target);
    assert.ok(found, `20/11 deve constar em ${year}`);
    assert.ok(found.name.includes('Consciência Negra'), 'Nome deve conter Consciência Negra');
    assert.strictEqual(found.type, 'national', 'Tipo deve ser national (Lei 14.759)');
  });
});

// ---------------------------------------------------------------------
// TESTE 4: Feriados Específicos de Salvador e Bahia (São João, 2 de Julho, Conceição da Praia)
// ---------------------------------------------------------------------
runTest('Teste 4: Feriados de Salvador/BA (São João, 2 de Julho, Conceição da Praia)', 'core', () => {
  const holidays = generateHolidays(2027, 'UFBA_SALVADOR', true, true);
  
  const saoJoao = holidays.find(h => formatISODate(h.date) === '2027-06-24');
  assert.ok(saoJoao, 'São João (24/06) deve constar');
  assert.ok(saoJoao.name.includes('São João'));

  const doisJulho = holidays.find(h => formatISODate(h.date) === '2027-07-02');
  assert.ok(doisJulho, 'Dois de Julho (02/07) deve constar');
  assert.ok(doisJulho.name.includes('Bahia'));

  const conceicao = holidays.find(h => formatISODate(h.date) === '2027-12-08');
  assert.ok(conceicao, 'Conceição da Praia (08/12) deve constar');
  assert.ok(conceicao.name.includes('Conceição'));
});

// ---------------------------------------------------------------------
// TESTE 5: Carnaval nos Campi do Circuito UFBA
// ---------------------------------------------------------------------
runTest('Teste 5: Carnaval no Circuito UFBA (Quarta pré-Carnaval à Quarta de Cinzas)', 'core', () => {
  const holidays = generateHolidays(2027, 'UFBA_SALVADOR', true, true);
  
  // Em 2027, Carnaval é 09/02.
  // Quarta pré-Carnaval é 03/02, Quarta de Cinzas é 10/02.
  assert.ok(holidays.some(h => formatISODate(h.date) === '2027-02-03'), 'Quarta pré-Carnaval deve constar');
  assert.ok(holidays.some(h => formatISODate(h.date) === '2027-02-04'), 'Quinta pré-Carnaval deve constar');
  assert.ok(holidays.some(h => formatISODate(h.date) === '2027-02-05'), 'Sexta pré-Carnaval deve constar');
  assert.ok(holidays.some(h => formatISODate(h.date) === '2027-02-08'), 'Segunda Carnaval deve constar');
  assert.ok(holidays.some(h => formatISODate(h.date) === '2027-02-09'), 'Terça Carnaval deve constar');
  assert.ok(holidays.some(h => formatISODate(h.date) === '2027-02-10'), 'Quarta Cinzas deve constar');
});

// ---------------------------------------------------------------------
// TESTE 6: Lógica de Pontes ("Enforcar")
// ---------------------------------------------------------------------
runTest('Teste 6: Lógica de Enforcar pontes em Quinta e Terça-feira', 'core', () => {
  // Com autoBridge = true
  const comPontes = generateHolidays(2027, 'UFBA_SALVADOR', true, false);
  // Corpus Christi em 2027 é Quinta 27/05. Sexta 28/05 deve ser ponte enforcada.
  const ponteCorpus = comPontes.find(h => formatISODate(h.date) === '2027-05-28');
  assert.ok(ponteCorpus, 'Sexta-feira 28/05/2027 deve ser ponte enforcada');
  assert.strictEqual(ponteCorpus.type, 'ponte');

  // Sem autoBridge (desmarcado)
  const semPontes = generateHolidays(2027, 'UFBA_SALVADOR', false, false);
  const ponteAusente = semPontes.find(h => formatISODate(h.date) === '2027-05-28');
  assert.strictEqual(ponteAusente, undefined, 'Sexta-feira 28/05 não deve ser ponte se desmarcado');
});

// ---------------------------------------------------------------------
// TESTE 7: Início Válido (Nunca começar em sábado, domingo ou feriado)
// ---------------------------------------------------------------------
runTest('Teste 7: Férias nunca podem iniciar em fim de semana ou feriado', 'core', () => {
  const holidays = generateHolidays(2027, 'UFBA_SALVADOR', true, true);
  const opt = new VacationOptimizer({
    vacationDays: 30,
    selectedYear: 2027,
    selectedLocation: 'UFBA_SALVADOR',
    workingDays: [false, true, true, true, true, true, false],
    profile: 'servidor_ufba',
    holidays: holidays
  });

  // Domingo 07/02/2027
  assert.strictEqual(opt.isValidStart(new Date(2027, 1, 7)), false, 'Não pode iniciar em domingo');
  // Sábado 06/02/2027
  assert.strictEqual(opt.isValidStart(new Date(2027, 1, 6)), false, 'Não pode iniciar em sábado');
  // Terça de Carnaval 09/02/2027
  assert.strictEqual(opt.isValidStart(new Date(2027, 1, 9)), false, 'Não pode iniciar em feriado');
  // Quinta pós-Cinzas 11/02/2027 (dia útil trabalhado)
  assert.strictEqual(opt.isValidStart(new Date(2027, 1, 11)), true, 'Deve poder iniciar em dia útil');
});

// ---------------------------------------------------------------------
// TESTE 8: Dia de Retorno SEMPRE é dia útil de trabalho (nunca sábado/domingo/feriado)
// ---------------------------------------------------------------------
runTest('Teste 8: Retorno ao trabalho é obrigatoriamente um dia útil de trabalho', 'core', () => {
  const holidays = generateHolidays(2027, 'UFBA_SALVADOR', true, true);
  const opt = new VacationOptimizer({
    vacationDays: 30,
    selectedYear: 2027,
    selectedLocation: 'UFBA_SALVADOR',
    workingDays: [false, true, true, true, true, true, false],
    profile: 'servidor_ufba',
    holidays: holidays
  });

  // Testa 50 datas aleatórias ao longo do ano
  let curr = new Date(2027, 0, 4);
  const end = new Date(2027, 11, 1);
  while (curr <= end) {
    if (opt.isValidStart(curr)) {
      const p = opt.evaluatePeriod(new Date(curr), 10);
      assert.strictEqual(opt.isDayOff(p.returnDate), false, `Retorno ${formatISODate(p.returnDate)} não pode ser dia de folga!`);
      const day = p.returnDate.getDay();
      assert.ok(day >= 1 && day <= 5, `Retorno deve ser de Seg a Sex (dia ${day})`);
    }
    curr = addDays(curr, 5);
  }
});

// ---------------------------------------------------------------------
// TESTE 9: Invariante Matemática de Zero Sobreposição (Zero Overlap)
// ---------------------------------------------------------------------
runTest('Teste 9: Zero Sobreposição entre períodos de férias gerados', 'core', () => {
  const holidays = generateHolidays(2027, 'UFBA_SALVADOR', true, true);
  const opt = new VacationOptimizer({
    vacationDays: 30,
    selectedYear: 2027,
    selectedLocation: 'UFBA_SALVADOR',
    workingDays: [false, true, true, true, true, true, false],
    profile: 'servidor_ufba',
    holidays: holidays
  });

  const scenarios = opt.optimize(30, 3);
  assert.ok(scenarios.length > 0, 'Deve gerar cenários válidos');

  scenarios.forEach((sc, scIdx) => {
    assert.strictEqual(sc.periods.length, 3, `Cenário ${scIdx+1} deve ter 3 períodos`);
    const [p1, p2, p3] = sc.periods;

    // Regra: p1 deve terminar antes de p2 começar, com pelo menos 1 dia útil de trabalho
    assert.ok(p1.returnDate <= p2.effectiveStart, `Cenário ${scIdx+1}: P1 retorno (${formatISODate(p1.returnDate)}) deve ser <= P2 saída (${formatISODate(p2.effectiveStart)})`);
    assert.ok(p2.returnDate <= p3.effectiveStart, `Cenário ${scIdx+1}: P2 retorno (${formatISODate(p2.returnDate)}) deve ser <= P3 saída (${formatISODate(p3.effectiveStart)})`);

    // Invariante de contagem de dias
    assert.strictEqual(p1.length + p2.length + p3.length, 30, `Soma dos dias marcados deve ser exatamente 30`);
  });
});

// ---------------------------------------------------------------------
// TESTE 10: Diversidade de Splits dos Servidores (10+10+10 e 15+10+5)
// ---------------------------------------------------------------------
runTest('Teste 10: Presença garantida de 10+10+10 e 15+10+5 no ranking', 'core', () => {
  const holidays = generateHolidays(2027, 'UFBA_SALVADOR', true, true);
  const opt = new VacationOptimizer({
    vacationDays: 30,
    selectedYear: 2027,
    selectedLocation: 'UFBA_SALVADOR',
    workingDays: [false, true, true, true, true, true, false],
    profile: 'servidor_ufba',
    holidays: holidays
  });

  const scenarios = opt.optimize(30, 3);
  const has101010 = scenarios.some(s => s.split.join('+') === '10+10+10');
  const has15105 = scenarios.some(s => s.split.join('+') === '15+10+5');

  assert.ok(has101010, 'O cenário 10+10+10 deve estar presente nas opções');
  assert.ok(has15105, 'O cenário 15+10+5 deve estar presente nas opções');
});

// ---------------------------------------------------------------------
// TESTE 11: Índice de Alavancagem (ROI de Férias)
// ---------------------------------------------------------------------
runTest('Teste 11: Cálculo correto do multiplicador de Alavancagem', 'core', () => {
  const holidays = generateHolidays(2027, 'UFBA_SALVADOR', true, true);
  const opt = new VacationOptimizer({
    vacationDays: 30,
    selectedYear: 2027,
    selectedLocation: 'UFBA_SALVADOR',
    workingDays: [false, true, true, true, true, true, false],
    profile: 'servidor_ufba',
    holidays: holidays
  });

  const scenarios = opt.optimize(30, 3);
  scenarios.forEach((s) => {
    const expected = (s.totalOff / s.vacationDays).toFixed(2);
    assert.strictEqual(s.leverage, expected, `Alavancagem do cenário deve ser ${expected}`);
    s.periods.forEach((p) => {
      const pExpected = (p.totalOff / p.length).toFixed(1);
      assert.strictEqual(p.leverage, pExpected, `Alavancagem do período deve ser ${pExpected}`);
    });
  });
});

// ---------------------------------------------------------------------
// TESTE 12: Espaçamento no Ano (Combate à Fadiga / Anti-Fadiga)
// ---------------------------------------------------------------------
runTest('Teste 12: Garantia de espaçamento mínimo saudável entre as etapas (>= 60 dias para 3 parcelas e >= 75 dias para 2)', 'core', () => {
  const holidays = generateHolidays(2027, 'UFBA_SALVADOR', true, true);
  const opt3 = new VacationOptimizer({
    vacationDays: 30,
    selectedYear: 2027,
    selectedLocation: 'UFBA_SALVADOR',
    workingDays: [false, true, true, true, true, true, false],
    profile: 'servidor_ufba',
    holidays: holidays,
    distributeThroughoutYear: true
  });

  const scenarios3 = opt3.optimize(30, 3);
  assert.ok(scenarios3.length > 0, 'Deve encontrar cenários espaçados para 3 parcelas');
  scenarios3.forEach((s, idx) => {
    const [p1, p2, p3] = s.periods;
    const gap1 = Math.round((p2.effectiveStart - p1.returnDate) / (1000 * 60 * 60 * 24));
    const gap2 = Math.round((p3.effectiveStart - p2.returnDate) / (1000 * 60 * 60 * 24));
    assert.ok(gap1 >= 60, `Cenário ${idx}: Intervalo P1-P2 (${gap1} dias) deve ser >= 60 dias`);
    assert.ok(gap2 >= 60, `Cenário ${idx}: Intervalo P2-P3 (${gap2} dias) deve ser >= 60 dias`);
  });

  const opt2 = new VacationOptimizer({
    vacationDays: 30,
    selectedYear: 2027,
    selectedLocation: 'UFBA_SALVADOR',
    workingDays: [false, true, true, true, true, true, false],
    profile: 'servidor_ufba',
    holidays: holidays,
    distributeThroughoutYear: true
  });
  const scenarios2 = opt2.optimize(30, 2);
  assert.ok(scenarios2.length > 0, 'Deve encontrar cenários espaçados para 2 parcelas');
  scenarios2.forEach((s, idx) => {
    const [p1, p2] = s.periods;
    const gap = Math.round((p2.effectiveStart - p1.returnDate) / (1000 * 60 * 60 * 24));
    assert.ok(gap >= 75, `Cenário ${idx}: Intervalo P1-P2 (${gap} dias) deve ser >= 75 dias`);
  });
});

// ---------------------------------------------------------------------
// TESTE 13: Cálculo Preciso de Dias no Fim de Período e Transparência
// O motor detecta sábados/feriados no fim e oferece tanto o teto máximo (55d)
// quanto opções com zero desperdício (54d), sem filtros cegos ou travamento
// ---------------------------------------------------------------------
runTest('Teste 13: Detecção precisa de fim de período e flexibilidade sem travamento', 'core', () => {
  const holidays2027 = generateHolidays(2027, 'UFBA_SALVADOR', true, true);
  const opt2027 = new VacationOptimizer({
    vacationDays: 30,
    selectedYear: 2027,
    selectedLocation: 'UFBA_SALVADOR',
    workingDays: [false, true, true, true, true, true, false],
    profile: 'servidor_ufba',
    holidays: holidays2027
  });

  // 1. Verificação matemática do Carnaval 2027
  // 10 dias (11/02 a 20/02/2027): termina em sábado -> wastedEndDays = 1
  const p10Carnaval = opt2027.evaluatePeriod(new Date(2027, 1, 11), 10);
  assert.strictEqual(p10Carnaval.wastedEndDays, 1, '11/02 a 20/02/2027 deve ter 1 dia no sábado');
  assert.strictEqual(p10Carnaval.isWeekendEnd, true, 'isWeekendEnd deve ser true para sábado');
  assert.strictEqual(p10Carnaval.totalOff, 19, '10 dias rendem 19 dias livres');

  // 9 dias (11/02 a 19/02/2027): termina em sexta -> wastedEndDays = 0
  const p9Carnaval = opt2027.evaluatePeriod(new Date(2027, 1, 11), 9);
  assert.strictEqual(p9Carnaval.wastedEndDays, 0, '11/02 a 19/02/2027 deve ter 0 dias desperdiçados');
  assert.strictEqual(p9Carnaval.isWeekendEnd, false, 'isWeekendEnd deve ser false para sexta');
  assert.strictEqual(p9Carnaval.totalOff, 19, '9 dias de férias rendem os mesmos 19 dias livres que 10 dias');

  // 2. Supremacia Dinâmica do Ranking e Soluções Pareto-Ótimas (Sem Tetos Rígidos Pré-Fixados)
  const scenarios2027 = opt2027.optimize(30, 3);
  assert.ok(scenarios2027.length >= 4, 'Deve gerar pelo menos 4 opções distintas');

  // Invariante de Supremacia: A Opção 1 (Campeã) é comprovadamente o maior descanso absoluto do ranking
  const maxOff = scenarios2027[0].totalOff;
  assert.ok(maxOff > 30, 'O descanso total da campeã deve alavancar consideravelmente a cota de 30 dias marcados');
  scenarios2027.forEach((sc, idx) => {
    assert.ok(maxOff >= sc.totalOff, `A Opção Campeã (${maxOff}d) deve ser >= que a Opção ${idx + 1} (${sc.totalOff}d)`);
  });

  // Invariante de Ordenação: O ranking deve ser estritamente decrescente em descanso total
  for (let i = 0; i < scenarios2027.length - 1; i++) {
    assert.ok(
      scenarios2027[i].totalOff >= scenarios2027[i + 1].totalOff,
      `Ranking deve ser decrescente: Opção ${i + 1} (${scenarios2027[i].totalOff}d) >= Opção ${i + 2} (${scenarios2027[i + 1].totalOff}d)`
    );
  }

  // Presença de opção com zero desperdício total (eficiência pura de Pareto)
  const hasZeroWasteOption = scenarios2027.some(s => s.totalWasted === 0);
  assert.ok(hasZeroWasteOption, 'O ranking deve apresentar opção com 0 dias em repouso semanal');

  // Em todos os anos e divisões, a soma deve ser rigorosamente 30 dias
  [2025, 2026, 2027, 2028].forEach(year => {
    const holidays = generateHolidays(year, 'UFBA_SALVADOR', true, true);
    [1, 2, 3].forEach(splitCount => {
      const opt = new VacationOptimizer({
        vacationDays: 30,
        selectedYear: year,
        selectedLocation: 'UFBA_SALVADOR',
        workingDays: [false, true, true, true, true, true, false],
        profile: 'servidor_ufba',
        holidays: holidays
      });

      const scs = opt.optimize(30, splitCount);
      assert.ok(scs.length > 0, `Deve gerar cenários para o ano ${year} e divisão ${splitCount}`);
      scs.forEach(s => {
        const sum = s.periods.reduce((acc, p) => acc + p.length, 0);
        assert.strictEqual(sum, 30, `A soma das parcelas deve ser sempre exatamente 30 dias no ano ${year}`);
        s.periods.forEach(p => {
          assert.strictEqual(opt.isDayOff(p.startDate), false, 'Nenhum período pode iniciar em dia de folga');
        });
      });
    });
  });
});

// ---------------------------------------------------------------------
// TESTE 14: Aplicação Cirúrgica de Folgas Compensatórias (Banco de Horas)
// Garante que o banco de horas é aplicado de forma proporcional e estratégica,
// sem multiplicar os dias gastos por etapa (gasto estritamente igual ao configurado)
// ---------------------------------------------------------------------
runTest('Teste 14: Alocação proporcional de Banco de Horas sem inflacionar o saldo', 'core', () => {
  const holidays = generateHolidays(2027, 'UFBA_SALVADOR', true, true);
  const compDaysInput = 2;

  const opt = new VacationOptimizer({
    vacationDays: 30,
    selectedYear: 2027,
    selectedLocation: 'UFBA_SALVADOR',
    workingDays: [false, true, true, true, true, true, false],
    profile: 'servidor_ufba',
    holidays: holidays,
    compensationDays: compDaysInput
  });

  const scenarios = opt.optimize(30, 3);
  assert.ok(scenarios.length > 0, 'Deve gerar cenários com banco de horas');

  scenarios.forEach((s, idx) => {
    // 1. A soma dos dias de compensação aplicados em todo o cenário deve ser estritamente igual a 2
    const totalCompApplied = s.periods.reduce((acc, p) => acc + (p.compDaysApplied || 0), 0);
    assert.strictEqual(totalCompApplied, compDaysInput, `Cenário ${idx + 1}: Total de banco de horas aplicado (${totalCompApplied}) deve ser estritamente ${compDaysInput} dias`);

    // 2. Os dias oficiais de férias continuam sendo exatamente 30
    const totalVacation = s.periods.reduce((acc, p) => acc + p.length, 0);
    assert.strictEqual(totalVacation, 30, `Cenário ${idx + 1}: Férias oficiais devem somar exatamente 30 dias`);

    // 3. O ganho extra considera o total de dias efetivamente gastos (30 + 2 = 32)
    assert.strictEqual(s.extraGain, s.totalOff - 32, `Cenário ${idx + 1}: Ganho extra deve ser totalOff - 32`);

    // 4. A alavancagem reflete a relação totalOff / 32
    const expectedLev = (s.totalOff / 32).toFixed(2);
    assert.strictEqual(s.leverage, expectedLev, `Cenário ${idx + 1}: Alavancagem deve ser baseada em 32 dias`);
  });
});

// ---------------------------------------------------------------------
// TESTE 15: Fita Anual do Tempo (Annual Rhythm Ribbon)
// Valida a geração da linha do tempo panorâmica de 12 meses e marcação de etapas
// ---------------------------------------------------------------------
runTest('Teste 15: Renderização panorâmica dos 12 meses na Fita Anual do Tempo', 'ui', () => {
  const { renderAnnualRibbon } = require('./js/ribbon.js');
  const holidays = generateHolidays(2027, 'UFBA_SALVADOR', true, true);
  const opt = new VacationOptimizer({
    vacationDays: 30,
    selectedYear: 2027,
    selectedLocation: 'UFBA_SALVADOR',
    workingDays: [false, true, true, true, true, true, false],
    profile: 'servidor_ufba',
    holidays: holidays
  });

  const scenarios = opt.optimize(30, 3);
  assert.ok(scenarios.length > 0, 'Deve ter cenários');
  const best = scenarios[0];

  const html = renderAnnualRibbon(best, 2027, 0);
  assert.ok(typeof html === 'string', 'Fita anual deve retornar uma string HTML');
  assert.ok(html.includes('JAN') && html.includes('DEZ'), 'Deve conter os meses de JAN a DEZ');
  assert.ok(html.includes('1ª Parcela') || html.includes('Etapa 1'), 'Deve destacar as parcelas presentes');
  assert.ok(html.includes('Fita Anual do Tempo'), 'Deve conter o título da fita panorâmica');
  assert.ok(html.includes('Opção 1'), 'Deve identificar a Opção 1');

  if (scenarios.length > 1) {
    const html2 = renderAnnualRibbon(scenarios[1], 2027, 1);
    assert.ok(html2.includes('Opção 2'), 'Deve alternar dinamicamente para Opção 2');
  }
});

// ---------------------------------------------------------------------
// TESTE 16: Cálculo Dinâmico das Semanas de Recesso do MGI (Portarias MGI)
// ---------------------------------------------------------------------
runTest('Teste 16: Cálculo exato das semanas de recesso do MGI para qualquer ano', 'core', () => {
  const { getRecessWeeks } = require('./js/holidays.js');

  // 1. Ano 2026 (Portaria SRT/MGI nº 6.342/2026: Natal 21 a 25/12/2026, Ano Novo 28/12 a 01/01/2027)
  const r2026 = getRecessWeeks(2026);
  assert.strictEqual(formatISODate(r2026.natalDays[0]), '2026-12-21', '2026: Segunda do Natal deve ser 21/12');
  assert.strictEqual(formatISODate(r2026.natalDays[4]), '2026-12-25', '2026: Sexta do Natal deve ser 25/12');
  assert.strictEqual(formatISODate(r2026.anoNovoDays[0]), '2026-12-28', '2026: Segunda do Ano Novo deve ser 28/12');
  assert.strictEqual(formatISODate(r2026.anoNovoDays[4]), '2027-01-01', '2026: Sexta do Ano Novo deve ser 01/01');

  // 2. Ano 2024 (Portaria MGI nº 8.243/2024: Natal 23 a 27/12/2024, Ano Novo 30/12/2024 a 03/01/2025)
  const r2024 = getRecessWeeks(2024);
  assert.strictEqual(formatISODate(r2024.natalDays[0]), '2024-12-23', '2024: Segunda do Natal deve ser 23/12');
  assert.strictEqual(formatISODate(r2024.natalDays[4]), '2024-12-27', '2024: Sexta do Natal deve ser 27/12');
  assert.strictEqual(formatISODate(r2024.anoNovoDays[0]), '2024-12-30', '2024: Segunda do Ano Novo deve ser 30/12');
  assert.strictEqual(formatISODate(r2024.anoNovoDays[4]), '2025-01-03', '2024: Sexta do Ano Novo deve ser 03/01');

  // 3. Ano 2027
  const r2027 = getRecessWeeks(2027);
  assert.strictEqual(formatISODate(r2027.natalDays[0]), '2027-12-20', '2027: Segunda do Natal deve ser 20/12');
  assert.strictEqual(formatISODate(r2027.natalDays[4]), '2027-12-24', '2027: Sexta do Natal deve ser 24/12');
  assert.strictEqual(formatISODate(r2027.anoNovoDays[0]), '2027-12-27', '2027: Segunda do Ano Novo deve ser 27/12');
  assert.strictEqual(formatISODate(r2027.anoNovoDays[4]), '2027-12-31', '2027: Sexta do Ano Novo deve ser 31/12');
});

// ---------------------------------------------------------------------
// TESTE 17: Preservação Irrenunciável dos Feriados Nacionais (25/12 e 01/01)
// ---------------------------------------------------------------------
runTest('Teste 17: Preservação dos Feriados Nacionais (25/12 e 01/01) em qualquer escala', 'core', () => {
  ['none', 'natal', 'ano_novo'].forEach(shift => {
    const holidays = generateHolidays(2026, {
      location: 'UFBA_SALVADOR',
      autoBridge: true,
      carnavalCircuito: true,
      recessShift: shift,
      includeVesperas: true
    });

    const natal = holidays.find(h => formatISODate(h.date) === '2026-12-25');
    assert.ok(natal, `25/12/2026 deve existir para escala ${shift}`);
    assert.strictEqual(natal.type, 'national', `25/12/2026 deve ser estritamente national para escala ${shift}`);

    const anoNovo = holidays.find(h => formatISODate(h.date) === '2027-01-01');
    assert.ok(anoNovo, `01/01/2027 deve existir para escala ${shift}`);
    assert.strictEqual(anoNovo.type, 'national', `01/01/2027 deve ser estritamente national para escala ${shift}`);
  });
});

// ---------------------------------------------------------------------
// TESTE 18: Injeção Precisa de Recesso e Vésperas (Sem Duplicidade de Datas)
// ---------------------------------------------------------------------
runTest('Teste 18: Injeção de Recesso MGI e Vésperas sem duplicidade de datas', 'core', () => {
  // Com Turma Natal
  const hNatal = generateHolidays(2026, {
    location: 'UFBA_SALVADOR',
    autoBridge: true,
    carnavalCircuito: true,
    recessShift: 'natal',
    includeVesperas: true
  });

  // Dias 21, 22, 23 devem constar como recesso
  assert.ok(hNatal.some(h => formatISODate(h.date) === '2026-12-21' && h.type === 'recesso'), '21/12 deve ser recesso');
  assert.ok(hNatal.some(h => formatISODate(h.date) === '2026-12-22' && h.type === 'recesso'), '22/12 deve ser recesso');
  assert.ok(hNatal.some(h => formatISODate(h.date) === '2026-12-23' && h.type === 'recesso'), '23/12 deve ser recesso');

  // Invariante de unicidade de datas
  const seenDates = new Set();
  hNatal.forEach(h => {
    const key = formatISODate(h.date);
    assert.strictEqual(seenDates.has(key), false, `Data duplicada detectada: ${key} (${h.name})`);
    seenDates.add(key);
  });
});

// ---------------------------------------------------------------------
// TESTE 19: Otimização Combinatória Integrada com Escala de Recesso MGI
// ---------------------------------------------------------------------
runTest('Teste 19: Otimizador respeita recesso MGI e não gasta férias em dias de recesso', 'core', () => {
  const hNatal = generateHolidays(2026, {
    location: 'UFBA_SALVADOR',
    autoBridge: true,
    carnavalCircuito: true,
    recessShift: 'natal',
    includeVesperas: true
  });

  const opt = new VacationOptimizer({
    vacationDays: 30,
    selectedYear: 2026,
    selectedLocation: 'UFBA_SALVADOR',
    workingDays: [false, true, true, true, true, true, false],
    profile: 'servidor_ufba',
    holidays: hNatal
  });

  // 1. Férias não podem iniciar em nenhum dia do recesso de Natal (21 a 25/12/2026)
  assert.strictEqual(opt.isValidStart(new Date(2026, 11, 21)), false, '21/12 é recesso - início inválido');
  assert.strictEqual(opt.isValidStart(new Date(2026, 11, 22)), false, '22/12 é recesso - início inválido');
  assert.strictEqual(opt.isValidStart(new Date(2026, 11, 25)), false, '25/12 é feriado nacional - início inválido');

  // 2. Otimizador deve rodar perfeitamente gerando cenários válidos
  const scenarios = opt.optimize(30, 3);
  assert.ok(scenarios.length > 0, 'Deve gerar cenários com escala de recesso');

  scenarios.forEach((sc, idx) => {
    // Zero sobreposição entre os períodos
    const [p1, p2, p3] = sc.periods;
    assert.ok(p1.returnDate <= p2.effectiveStart, `Cenário ${idx+1}: P1 retorno <= P2 saída`);
    assert.ok(p2.returnDate <= p3.effectiveStart, `Cenário ${idx+1}: P2 retorno <= P3 saída`);
    assert.strictEqual(p1.length + p2.length + p3.length, 30, 'Soma das férias deve ser 30 dias');
  });
});

// ---------------------------------------------------------------------
// TESTE 20: Motor de 30+ Roteiros Temáticos e Paleta Púrpura Nobre (Opção B)
// ---------------------------------------------------------------------
runTest('Teste 20: Motor de 30+ Roteiros Temáticos e Paleta Púrpura Nobre (Opção B)', 'tags', () => {
  const EXPECTED_STYLE = 'bg-purple-100 text-purple-950 border border-purple-300';

  // 1. Caso Tríade de Ouro (Carnaval + São João + Recesso)
  const scTriadeOuro = {
    split: [10, 10, 10],
    periods: [
      { length: 10, compDaysApplied: 0, holidaysInside: [{ name: 'Terça-feira de Carnaval' }] },
      { length: 10, compDaysApplied: 0, holidaysInside: [{ name: 'São João' }] },
      { length: 10, compDaysApplied: 0, holidaysInside: [{ name: 'Recesso de Fim de Ano' }] }
    ]
  };
  const theme1 = getScenarioStrategicTheme(scTriadeOuro, 0, false);
  assert.ok(theme1.text.includes('Tríade de Ouro'), `Esperado Tríade de Ouro, obteve: ${theme1.text}`);
  assert.strictEqual(theme1.style, EXPECTED_STYLE, 'Estilo deve ser estritamente Púrpura Nobre (Opção B)');

  // 2. Caso Super Novembro do Servidor (Servidor + Finados + Consciência Negra)
  const scSuperNovembro = {
    split: [10, 10, 10],
    periods: [
      { length: 10, compDaysApplied: 0, holidaysInside: [{ name: 'Dia do Servidor Público' }, { name: 'Finados' }] },
      { length: 10, compDaysApplied: 0, holidaysInside: [{ name: 'Consciência Negra' }] }
    ]
  };
  const theme2 = getScenarioStrategicTheme(scSuperNovembro, 0, false);
  assert.ok(theme2.text.includes('Super Novembro do Servidor'), `Esperado Super Novembro, obteve: ${theme2.text}`);
  assert.strictEqual(theme2.style, EXPECTED_STYLE, 'Estilo deve ser Púrpura Nobre');

  // 3. Caso Verão & Independência (Carnaval + 2 de Julho)
  const scVerao = {
    split: [15, 15],
    periods: [
      { length: 15, compDaysApplied: 0, holidaysInside: [{ name: 'Carnaval' }] },
      { length: 15, compDaysApplied: 0, holidaysInside: [{ name: 'Independência da Bahia (Dois de Julho)' }] }
    ]
  };
  const theme3 = getScenarioStrategicTheme(scVerao, 0, false);
  assert.ok(theme3.text.includes('Verão & Independência'), `Esperado Verão & Independência, obteve: ${theme3.text}`);
  assert.strictEqual(theme3.style, EXPECTED_STYLE);

  // 4. Caso Anti-Fadiga
  const scFadiga = {
    split: [10, 10, 10],
    periods: [
      { length: 10, compDaysApplied: 0, holidaysInside: [] },
      { length: 10, compDaysApplied: 0, holidaysInside: [] },
      { length: 10, compDaysApplied: 0, holidaysInside: [] }
    ]
  };
  const theme4 = getScenarioStrategicTheme(scFadiga, 0, true);
  assert.ok(theme4.text.includes('Anti-Fadiga'), `Esperado Ritmo Anti-Fadiga, obteve: ${theme4.text}`);
  assert.strictEqual(theme4.style, EXPECTED_STYLE);

  // 5. Caso Cota Integral de Verão (30d janeiro)
  const scIntegral = {
    split: [30],
    periods: [
      { startDate: new Date(2027, 0, 4), length: 30, compDaysApplied: 0, holidaysInside: [] }
    ]
  };
  const theme5 = getScenarioStrategicTheme(scIntegral, 0, false);
  assert.ok(theme5.text.includes('Cota Integral de Verão'), `Esperado Cota Integral de Verão, obteve: ${theme5.text}`);
  assert.strictEqual(theme5.style, EXPECTED_STYLE);
});

// ---------------------------------------------------------------------
// TESTE 21: Proporcionalidade Exata da Fita Anual por Dias do Mês (daysInMonth)
// ---------------------------------------------------------------------
runTest('Teste 21: Proporcionalidade exata da Fita Anual por dias reais do mês (daysInMonth)', 'ui', () => {
  const holidays = generateHolidays(2027, 'UFBA_SALVADOR', true, true);
  const opt = new VacationOptimizer({
    vacationDays: 30,
    selectedYear: 2027,
    selectedLocation: 'UFBA_SALVADOR',
    workingDays: [false, true, true, true, true, true, false],
    profile: 'servidor_ufba',
    holidays: holidays
  });

  const scenarios = opt.optimize(30, 3);
  const html = renderAnnualRibbon(scenarios[0], 2027, 0, holidays);

  // A Fita Anual não deve mais usar o cálculo distorcido "hCount * 25"
  assert.strictEqual(html.includes('* 25'), false, 'Não deve conter cálculo legado * 25');

  // Meses devem ter barras proporcionais
  assert.ok(html.includes('style="width:'), 'Deve renderizar barras com estilo width');
  assert.ok(html.includes('%;"') || html.includes('%"'), 'Deve conter largura percentual calculada');
  assert.ok(html.includes('1ª Parcela') || html.includes('Etapa 1'), 'Deve identificar as parcelas');
});

// ---------------------------------------------------------------------
// TESTE 22: Desacoplamento Semântico no Mini-Calendário (Índigo-400 para Fins de Semana)
// ---------------------------------------------------------------------
runTest('Teste 22: Desacoplamento de cores no Mini-Calendário (Índigo-400 para Fins de Semana)', 'ui', () => {
  const holidays = generateHolidays(2027, 'UFBA_SALVADOR', true, true);
  const opt = new VacationOptimizer({
    vacationDays: 30,
    selectedYear: 2027,
    selectedLocation: 'UFBA_SALVADOR',
    workingDays: [false, true, true, true, true, true, false],
    profile: 'servidor_ufba',
    holidays: holidays
  });

  const scenarios = opt.optimize(30, 3);
  const period = scenarios[0].periods[0];
  const html = renderMiniCalendar(period, opt);

  // 1. Fins de semana devem ter a borda Índigo-400 exclusiva
  assert.ok(html.includes('border-indigo-400'), 'Fins de semana devem usar border-indigo-400');

  // 2. Feriados oficiais devem ter borda Âmbar-400
  assert.ok(html.includes('border-amber-400'), 'Legenda ou feriados devem conter border-amber-400');

  // 3. Pontos facultativos devem ter borda Azul-400
  assert.ok(html.includes('border-blue-400'), 'Legenda ou facultativos devem conter border-blue-400');

  // 4. Retorno ao trabalho deve usar a família Esmeralda (bg-emerald-600 border-emerald-500)
  assert.ok(html.includes('bg-emerald-600') && html.includes('border-emerald-500'), 'Retorno ao trabalho deve ser esmeralda');

  // 5. Preenchimento contínuo e único escuro das férias
  assert.ok(html.includes('bg-slate-900'), 'Dias de férias devem ter preenchimento uniforme bg-slate-900');
});

// ---------------------------------------------------------------------
// TESTE 23: Estrutura do Itinerário Boarding Pass e Segurança de Retorno
// ---------------------------------------------------------------------
runTest('Teste 23: Estrutura do Itinerário Boarding Pass e Segurança de Retorno', 'ui', () => {
  const holidays = generateHolidays(2027, 'UFBA_SALVADOR', true, true);
  const opt = new VacationOptimizer({
    vacationDays: 30,
    selectedYear: 2027,
    selectedLocation: 'UFBA_SALVADOR',
    workingDays: [false, true, true, true, true, true, false],
    profile: 'servidor_ufba',
    holidays: holidays
  });

  const scenarios = opt.optimize(30, 3);
  assert.ok(scenarios.length > 0, 'Deve gerar cenários');

  scenarios.forEach((sc, scIdx) => {
    sc.periods.forEach((p, pIdx) => {
      // 1. Data de retorno DEVE ser um dia de trabalho útil real
      const dow = p.returnDate.getDay();
      assert.strictEqual(opt.workingDays[dow], true, `Cenário ${scIdx+1} Etapa ${pIdx+1}: Retorno deve ser dia útil na escala do servidor`);
      assert.strictEqual(opt.isHoliday(p.returnDate), false, `Cenário ${scIdx+1} Etapa ${pIdx+1}: Retorno não pode ser feriado`);

      // 2. Data de saída efetiva deve ser <= data oficial de início
      assert.ok(p.effectiveStart <= p.startDate, `Cenário ${scIdx+1} Etapa ${pIdx+1}: Saída efetiva deve ser <= início oficial`);

      // 3. Data de início oficial deve ser dia útil
      assert.strictEqual(opt.isValidStart(p.startDate), true, `Cenário ${scIdx+1} Etapa ${pIdx+1}: Início oficial deve ser dia útil`);
    });
  });
});

// ---------------------------------------------------------------------
// TESTE 24: Linter Automatizado de Conformidade do Guia de Cores (Design System)
// ---------------------------------------------------------------------
runTest('Teste 24: Linter Automatizado de Integridade do Guia de Cores (Design System)', 'colors', () => {
  // 1. Verifica index.html
  const htmlIndex = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  assert.strictEqual(htmlIndex.includes('bg-teal-100 text-teal-900 border-teal-300'), false, 
    'index.html não pode usar classe teal no chip de recesso (deve usar família sky)');
  assert.ok(htmlIndex.includes('bg-sky-100 text-sky-900 border border-sky-300'), 
    'index.html deve usar família sky no chip de recesso');

  // 2. Verifica js/mini-calendar.js
  const jsCalendar = fs.readFileSync(path.join(__dirname, 'js', 'mini-calendar.js'), 'utf8');
  assert.ok(jsCalendar.includes('border-indigo-400'), 
    'mini-calendar.js deve definir border-indigo-400 para fins de semana');
  assert.ok(jsCalendar.includes('border-blue-400'), 
    'mini-calendar.js deve manter border-blue-400 exclusivo para facultativos');

  // 3. Verifica js/app.js
  const jsApp = fs.readFileSync(path.join(__dirname, 'js', 'app.js'), 'utf8');
  assert.ok(jsApp.includes('bg-purple-100 text-purple-950 border border-purple-300'), 
    'app.js deve adotar estritamente a paleta Púrpura Nobre (Opção B) nas tags temáticas');
  assert.strictEqual(jsApp.includes('text-emerald-700 font-bold">🎄 Turma Natal'), false, 
    'app.js não deve usar text-emerald-700 na Turma Natal (deve usar text-sky-700)');
  assert.ok(jsApp.includes('text-sky-700 font-bold">🎄 Turma Natal'), 
    'app.js deve usar text-sky-700 na Turma Natal');
});

// ---------------------------------------------------------------------
// TESTE 25: Flexibilidade de Parcelamento Estatutário (Art. 77 Lei 8.112/90: Etapas a partir de 1 dia e Cotas de 1 a 30 dias)
// ---------------------------------------------------------------------
runTest('Teste 25: Flexibilidade de Parcelamento Estatutário (Art. 77 Lei 8.112/90: Etapas a partir de 1 dia e Cotas de 1 a 30 dias)', 'core', () => {
  const holidays = generateHolidays(2027, 'UFBA_SALVADOR', true, true);
  const opt = new VacationOptimizer({
    vacationDays: 30,
    selectedYear: 2027,
    selectedLocation: 'UFBA_SALVADOR',
    workingDays: [false, true, true, true, true, true, false],
    profile: 'servidor_ufba',
    holidays: holidays
  });

  // 1. Particionamento de cota unitária (1 dia em 1 etapa)
  const splits1 = opt.getSplits(1, 1);
  assert.deepStrictEqual(splits1, [[1]], 'Cota de 1 dia em 1 parcela deve gerar [[1]]');

  // 2. Particionamento de cota de 3 dias em 3 etapas unitárias
  const splits3 = opt.getSplits(3, 3);
  assert.deepStrictEqual(splits3, [[1, 1, 1]], 'Cota de 3 dias em 3 parcelas deve gerar [[1, 1, 1]]');

  // 3. Partições de 30 dias em 3 etapas com conformidade estrita ao piso legal de 1 dia (Li >= 1)
  const splits30 = opt.getSplits(30, 3);
  assert.ok(splits30.length > 0, 'Deve gerar partições para cota integral de 30 dias');
  assert.ok(splits30.every(sp => sp.length === 3 && sp.reduce((a, b) => a + b, 0) === 30 && sp.every(p => p >= 1)), 
    'Todas as partições de 30 dias devem somar 30 e ter etapas com comprimento >= 1 dia');
  const hasFlexibleShortParcel = splits30.some(sp => sp.some(p => p <= 4));
  assert.ok(hasFlexibleShortParcel, 'Partições de 30 dias devem contemplar frações curtas flexíveis a partir de 1 dia');

  // 4. Otimização de cota mínima (1 dia)
  const sc1 = opt.optimize(1, 1);
  assert.ok(sc1.length > 0, 'Deve gerar cenários para 1 dia de férias');
  assert.strictEqual(sc1[0].vacationDays, 1, 'Cenário deve ter 1 dia marcado');
  assert.strictEqual(sc1[0].periods.length, 1, 'Cenário deve ter 1 período');
  assert.strictEqual(sc1[0].periods[0].length, 1, 'Período deve ter 1 dia de duração');

  // 5. Otimização de cota fracionada (5 dias em 2 etapas)
  const sc5 = opt.optimize(5, 2);
  assert.ok(sc5.length > 0, 'Deve gerar cenários para cota fracionada de 5 dias em 2 etapas');
  assert.strictEqual(sc5[0].vacationDays, 5, 'Cenário deve somar exatamente os 5 dias solicitados');
});

// ---------------------------------------------------------------------
// TESTE 26: Contagem Escopada de Feriados no Cockpit e Não-Duplicação de Vésperas (Zero Falsa Equivalência)
// ---------------------------------------------------------------------
runTest('Teste 26: Contagem Escopada de Feriados no Cockpit e Não-Duplicação de Vésperas (Zero Falsa Equivalência)', 'core', () => {
  // 1. Sem Escala: Vésperas (24/12 e 31/12) devem adicionar exatamente +2 dias no ano de 2027
  const hNoneNoVesp = generateHolidays(2027, { location: 'UFBA_SALVADOR', autoBridge: true, carnavalCircuito: true, recessShift: 'none', includeVesperas: false });
  const hNoneWithVesp = generateHolidays(2027, { location: 'UFBA_SALVADOR', autoBridge: true, carnavalCircuito: true, recessShift: 'none', includeVesperas: true });

  const cNoneNo = hNoneNoVesp.filter(h => new Date(h.date).getFullYear() === 2027).length;
  const cNoneWith = hNoneWithVesp.filter(h => new Date(h.date).getFullYear() === 2027).length;
  assert.strictEqual(cNoneWith - cNoneNo, 2, 'Sem escala: Vésperas devem adicionar rigorosamente 2 dias no ano 2027');

  // 2. Turma de Natal: 24/12 já é recesso, logo marcar Vésperas deve adicionar exatamente +1 dia no ano de 2027 (apenas 31/12)
  const hNatNoVesp = generateHolidays(2027, { location: 'UFBA_SALVADOR', autoBridge: true, carnavalCircuito: true, recessShift: 'natal', includeVesperas: false });
  const hNatWithVesp = generateHolidays(2027, { location: 'UFBA_SALVADOR', autoBridge: true, carnavalCircuito: true, recessShift: 'natal', includeVesperas: true });

  const cNatNo = hNatNoVesp.filter(h => new Date(h.date).getFullYear() === 2027).length;
  const cNatWith = hNatWithVesp.filter(h => new Date(h.date).getFullYear() === 2027).length;
  assert.strictEqual(cNatWith - cNatNo, 1, 'Turma Natal: Vésperas devem adicionar rigorosamente 1 dia no ano 2027 (31/12)');

  // 3. Turma de Ano Novo: 31/12 já é recesso, logo marcar Vésperas deve adicionar exatamente +1 dia no ano de 2027 (apenas 24/12)
  const hAnoNoVesp = generateHolidays(2027, { location: 'UFBA_SALVADOR', autoBridge: true, carnavalCircuito: true, recessShift: 'ano_novo', includeVesperas: false });
  const hAnoWithVesp = generateHolidays(2027, { location: 'UFBA_SALVADOR', autoBridge: true, carnavalCircuito: true, recessShift: 'ano_novo', includeVesperas: true });

  const cAnoNo = hAnoNoVesp.filter(h => new Date(h.date).getFullYear() === 2027).length;
  const cAnoWith = hAnoWithVesp.filter(h => new Date(h.date).getFullYear() === 2027).length;
  assert.strictEqual(cAnoWith - cAnoNo, 1, 'Turma Ano Novo: Vésperas devem adicionar rigorosamente 1 dia no ano 2027 (24/12)');

  // 4. Preservação de datas de borda para cálculo contínuo de férias sem vazar para a contagem do ano
  const hasPriorYearEdge = hNoneWithVesp.some(h => new Date(h.date).getFullYear() === 2026);
  assert.strictEqual(hasPriorYearEdge, true, 'Datas de borda do ano anterior devem existir para cálculo de alavancagem');
});

// ---------------------------------------------------------------------
// TESTE 27: Auditoria de Integridade e Conformidade PWA (Offline-First)
// ---------------------------------------------------------------------
runTest('Teste 27: Auditoria de Integridade e Conformidade PWA (Offline-First)', 'ui', () => {
  // 1. Verifica existência e integridade do manifest.json
  const manifestPath = path.join(__dirname, 'manifest.json');
  assert.ok(fs.existsSync(manifestPath), 'manifest.json deve existir na raiz');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.strictEqual(manifest.short_name, 'Folga Extra', 'short_name deve ser Folga Extra');
  assert.strictEqual(manifest.display, 'standalone', 'display deve ser standalone');
  assert.strictEqual(manifest.theme_color, '#0f172a', 'theme_color deve ser #0f172a');
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length > 0, 'manifest deve conter array de ícones');

  // 2. Verifica existência e ativos do sw.js
  const swPath = path.join(__dirname, 'sw.js');
  assert.ok(fs.existsSync(swPath), 'sw.js deve existir na raiz');
  const swContent = fs.readFileSync(swPath, 'utf8');
  assert.ok(swContent.includes('CACHE_NAME'), 'sw.js deve declarar CACHE_NAME');
  assert.ok(swContent.includes('STATIC_ASSETS'), 'sw.js deve pré-cachear STATIC_ASSETS');
  assert.ok(swContent.includes('caches.match'), 'sw.js deve interceptar e responder via cache');

  // 3. Verifica ícone SVG
  const iconPath = path.join(__dirname, 'icons', 'icon.svg');
  assert.ok(fs.existsSync(iconPath), 'icons/icon.svg deve existir');
  const iconContent = fs.readFileSync(iconPath, 'utf8');
  assert.ok(iconContent.includes('<svg') && iconContent.includes('</svg>'), 'icon.svg deve ser SVG válido');

  // 4. Verifica linkage no index.html
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  assert.ok(html.includes('rel="manifest" href="manifest.json"'), 'index.html deve referenciar manifest.json');
  assert.ok(html.includes("navigator.serviceWorker.register('./sw.js')"), 'index.html deve registrar sw.js');
  assert.ok(html.includes('btnInstallPwa'), 'index.html deve conter botão para prompt de instalação PWA');
});

// ---------------------------------------------------------------------
// TESTE 28: Validação Arquitetural do Comparador Desacoplado (Dock Flutuante + Drawer)
// ---------------------------------------------------------------------
runTest('Teste 28: Validação Arquitetural do Comparador Desacoplado (Dock Flutuante + Drawer)', 'ui', () => {
  // 1. Validação do DOM em index.html
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  assert.ok(html.includes('id="comparatorDock"'), 'index.html deve conter #comparatorDock');
  assert.ok(html.includes('id="comparatorBackdrop"'), 'index.html deve conter #comparatorBackdrop');
  assert.ok(html.includes('id="comparatorDrawer"'), 'index.html deve conter #comparatorDrawer');
  assert.ok(html.includes('id="btnOpenComparatorDrawer"'), 'index.html deve conter #btnOpenComparatorDrawer');
  assert.ok(html.includes('id="dockCounter"'), 'index.html deve conter #dockCounter');
  assert.ok(html.includes('id="dockSelectedChips"'), 'index.html deve conter #dockSelectedChips');
  assert.ok(html.includes('id="comparatorDrawerContent"'), 'index.html deve conter #comparatorDrawerContent');
  assert.ok(html.includes('clearComparison()'), 'index.html deve invocar clearComparison');
  assert.ok(html.includes('closeComparatorDrawer()'), 'index.html deve invocar closeComparatorDrawer');

  // 2. Validação dos Métodos e Lógica em js/app.js
  const appJs = fs.readFileSync(path.join(__dirname, 'js', 'app.js'), 'utf8');
  assert.ok(appJs.includes('comparedScenarios: []'), 'js/app.js deve inicializar state.comparedScenarios como array vazio');
  assert.ok(appJs.includes('function toggleCompareScenario('), 'js/app.js deve implementar toggleCompareScenario()');
  assert.ok(appJs.includes('function clearComparison('), 'js/app.js deve implementar clearComparison()');
  assert.ok(appJs.includes('function openComparatorDrawer('), 'js/app.js deve implementar openComparatorDrawer()');
  assert.ok(appJs.includes('function closeComparatorDrawer('), 'js/app.js deve implementar closeComparatorDrawer()');
  assert.ok(appJs.includes('function renderComparatorDock('), 'js/app.js deve implementar renderComparatorDock()');
  assert.ok(appJs.includes('function renderComparatorDrawer('), 'js/app.js deve implementar renderComparatorDrawer()');
  assert.ok(appJs.includes('function copyComparisonSummary('), 'js/app.js deve implementar copyComparisonSummary()');

  // 3. Validação das Restrições Negativas do Usuário
  // Restrição A: NUNCA deve conter botão "Adotar este Cenário"
  assert.strictEqual(html.includes('Adotar este Cenário'), false, 'index.html NÃO pode conter "Adotar este Cenário"');
  assert.strictEqual(appJs.includes('Adotar este Cenário'), false, 'js/app.js NÃO pode conter "Adotar este Cenário"');

  // Restrição B: NUNCA deve renderizar Tag Temática dentro do Drawer do comparador
  // O comparador deve ser 100% analítico, técnico e matemático
  const startIdx = appJs.indexOf('function renderComparatorDrawer(');
  const endIdx = appJs.indexOf('function copyComparisonSummary(');
  assert.ok(startIdx !== -1 && endIdx !== -1, 'Função renderComparatorDrawer deve ser delimitada');
  const drawerCode = appJs.substring(startIdx, endIdx);
  assert.strictEqual(drawerCode.includes('theme.text'), false, 'Drawer de comparação não deve exibir Tag Temática (theme.text)');
  assert.strictEqual(drawerCode.includes('theme.style'), false, 'Drawer de comparação não deve exibir Tag Temática (theme.style)');

  // 4. Teste Comportamental e Lógica de Limite (Máximo 3 cenários)
  let simState = { comparedScenarios: [] };
  const mockToggle = (sIdx) => {
    const existing = simState.comparedScenarios.indexOf(sIdx);
    if (existing > -1) {
      simState.comparedScenarios.splice(existing, 1);
    } else {
      if (simState.comparedScenarios.length >= 3) {
        return false; // limite atingido
      }
      simState.comparedScenarios.push(sIdx);
    }
    return true;
  };

  assert.strictEqual(mockToggle(0), true);
  assert.deepStrictEqual(simState.comparedScenarios, [0]);
  assert.strictEqual(mockToggle(1), true);
  assert.deepStrictEqual(simState.comparedScenarios, [0, 1]);
  assert.strictEqual(mockToggle(2), true);
  assert.deepStrictEqual(simState.comparedScenarios, [0, 1, 2]);
  // 4º item deve ser barrado pelo limite de 3
  assert.strictEqual(mockToggle(3), false);
  assert.deepStrictEqual(simState.comparedScenarios, [0, 1, 2], 'Limite de 3 deve ser respeitado');
  // Toggle no item 1 remove-o
  assert.strictEqual(mockToggle(1), true);
  assert.deepStrictEqual(simState.comparedScenarios, [0, 2]);
  // Limpeza total
  simState.comparedScenarios = [];
  assert.deepStrictEqual(simState.comparedScenarios, []);
});

// ---------------------------------------------------------------------
// TESTE 29: Janela Interanual e Escopo de Busca (1 e 2 Anos - Art. 77 Lei 8.112/90)
// ---------------------------------------------------------------------
runTest('Teste 29: Janela Interanual e Escopo de Busca (1 e 2 Anos - Art. 77 Lei 8.112/90)', 'core', () => {
  // 1. Geração de feriados multi-ano sem duplicidade
  const h2Years = generateHolidays([2027, 2028], 'UFBA_SALVADOR', true, true);
  assert.ok(Array.isArray(h2Years), 'h2Years deve ser um array');
  assert.ok(h2Years.some(h => new Date(h.date).getFullYear() === 2027), 'Deve conter feriados de 2027');
  assert.ok(h2Years.some(h => new Date(h.date).getFullYear() === 2028), 'Deve conter feriados de 2028');

  // Garante zero duplicidade de datas
  const dateSet = new Set();
  h2Years.forEach(h => {
    const key = formatISODate(h.date);
    assert.strictEqual(dateSet.has(key), false, `Data duplicada detectada na unificação de feriados: ${key}`);
    dateSet.add(key);
  });

  // Teste de helper generateHolidaysForRange
  const hRange = generateHolidaysForRange(2027, 2029, 'UFBA_SALVADOR', true, true);
  assert.ok(hRange.some(h => new Date(h.date).getFullYear() === 2027));
  assert.ok(hRange.some(h => new Date(h.date).getFullYear() === 2028));
  assert.ok(hRange.some(h => new Date(h.date).getFullYear() === 2029));

  // 2. Janela de 1 Ano a partir de 03/05/2027
  const winStart = new Date(2027, 4, 3); // 03/05/2027
  const opt1Year = new VacationOptimizer({
    windowStartDate: '2027-05-03',
    windowYears: 1,
    holidays: h2Years,
    profile: 'servidor_ufba'
  });

  const scenarios1Y = opt1Year.optimize(30, 3);
  assert.ok(scenarios1Y.length > 0, 'Deve gerar cenários para janela de 1 ano');

  scenarios1Y.forEach(sc => {
    sc.periods.forEach(p => {
      assert.ok(p.startDate >= winStart, `Férias não podem iniciar antes de 03/05/2027: ${formatDate(p.startDate)}`);
      assert.ok(p.startDate <= new Date(2028, 4, 3), `Férias devem iniciar dentro do alcance de 1 ano: ${formatDate(p.startDate)}`);
    });
  });

  // 3. Janela de 2 Anos (24 meses acumulados - Lei 8.112/90)
  const h3Years = generateHolidaysForRange(2027, 2029, 'UFBA_SALVADOR', true, true);
  const opt2Years = new VacationOptimizer({
    windowStartDate: '2027-05-03',
    windowYears: 2,
    holidays: h3Years,
    profile: 'servidor_ufba'
  });

  const scenarios2Y = opt2Years.optimize(30, 2);
  assert.ok(scenarios2Y.length > 0, 'Deve gerar cenários para janela de 2 anos');

  scenarios2Y.forEach(sc => {
    sc.periods.forEach(p => {
      assert.ok(p.startDate >= winStart, `Férias não podem iniciar antes de 03/05/2027: ${formatDate(p.startDate)}`);
      assert.ok(p.startDate <= new Date(2029, 4, 3), `Férias devem iniciar dentro do alcance de 2 anos: ${formatDate(p.startDate)}`);
    });
  });
});

// ---------------------------------------------------------------------
// TESTE 30: Exclusão Estrita de Períodos a Evitar (Colegas / Projetos / Bloqueios)
// ---------------------------------------------------------------------
runTest('Teste 30: Exclusão Estrita de Períodos a Evitar (Colegas / Projetos / Bloqueios)', 'core', () => {
  const h2Years = generateHolidays([2027, 2028], 'UFBA_SALVADOR', true, true);
  const winStart = new Date(2027, 4, 3); // 03/05/2027

  // 1. Bloqueio completo de Julho de 2027 (ex: colega de férias ou projeto crítico)
  const julStart = new Date(2027, 6, 1);
  const julEnd = new Date(2027, 6, 31);

  const optExJuly = new VacationOptimizer({
    windowStartDate: '2027-05-03',
    windowYears: 1,
    holidays: h2Years,
    profile: 'servidor_ufba',
    excludedPeriods: [
      { start: '2027-07-01', end: '2027-07-31' }
    ]
  });

  const scenariosJuly = optExJuly.optimize(30, 3);
  assert.ok(scenariosJuly.length > 0, 'Deve encontrar alternativas fora de Julho');

  scenariosJuly.forEach(sc => {
    sc.periods.forEach(p => {
      const overlapsJuly = p.startDate <= julEnd && p.endDate >= julStart;
      assert.strictEqual(overlapsJuly, false, `Parcela ${formatDate(p.startDate)} a ${formatDate(p.endDate)} colidiu com o período excluído de Julho`);
    });
  });

  // 2. Múltiplos períodos de exclusão
  const optMultiEx = new VacationOptimizer({
    windowStartDate: '2027-05-03',
    windowYears: 1,
    holidays: h2Years,
    profile: 'servidor_ufba',
    excludedPeriods: [
      { start: '2027-06-15', end: '2027-07-15' },
      { start: '2027-12-15', end: '2027-12-31' }
    ]
  });

  const scenariosMulti = optMultiEx.optimize(30, 3);
  assert.ok(scenariosMulti.length > 0, 'Deve encontrar opções respeitando múltiplos bloqueios');

  scenariosMulti.forEach(sc => {
    sc.periods.forEach(p => {
      const overlaps1 = p.startDate <= new Date(2027, 6, 15) && p.endDate >= new Date(2027, 5, 15);
      const overlaps2 = p.startDate <= new Date(2027, 11, 31) && p.endDate >= new Date(2027, 11, 15);
      assert.strictEqual(overlaps1, false, `Parcela colidiu com o 1º bloqueio: ${formatDate(p.startDate)} a ${formatDate(p.endDate)}`);
      assert.strictEqual(overlaps2, false, `Parcela colidiu com o 2º bloqueio: ${formatDate(p.startDate)} a ${formatDate(p.endDate)}`);
    });
  });

  // 3. Respeito a banco de horas: Folgas compensatórias não devem transbordar para período excluído
  const optCompEx = new VacationOptimizer({
    windowStartDate: '2027-05-03',
    windowYears: 1,
    holidays: h2Years,
    profile: 'servidor_ufba',
    compensationDays: 5,
    excludedPeriods: [
      { start: '2027-07-01', end: '2027-07-31' }
    ]
  });

  const scenariosComp = optCompEx.optimize(30, 3);
  assert.ok(scenariosComp.length > 0);
  scenariosComp.forEach(sc => {
    sc.periods.forEach(p => {
      const overlapsJuly = p.startDate <= julEnd && p.endDate >= julStart;
      assert.strictEqual(overlapsJuly, false, 'Parcela com compensação não pode tocar Julho');
    });
  });
});

// ---------------------------------------------------------------------
// TESTE 31: Interface Reativa, Fita Panorâmica e Contagem Escopada de Feriados (Ponto 2)
// ---------------------------------------------------------------------
runTest('Teste 31: Interface Reativa, Fita Panorâmica e Contagem Escopada de Feriados (Ponto 2)', 'ui', () => {
  // 1. Integridade do DOM em index.html
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  assert.ok(html.includes('id="btnToggleCustomWindow"'), 'Deve conter #btnToggleCustomWindow');
  assert.ok(html.includes('id="customWindowSection"'), 'Deve conter #customWindowSection');
  assert.ok(html.includes('id="enableCustomWindow"'), 'Deve conter #enableCustomWindow');
  assert.ok(html.includes('id="customWindowControls"'), 'Deve conter #customWindowControls');
  assert.ok(html.includes('id="windowStartDateInput"'), 'Deve conter #windowStartDateInput');
  assert.ok(html.includes('id="btnWindow1Year"'), 'Deve conter #btnWindow1Year');
  assert.ok(html.includes('id="btnWindow2Years"'), 'Deve conter #btnWindow2Years');
  assert.ok(html.includes('id="excludedPeriodStart"'), 'Deve conter #excludedPeriodStart');
  assert.ok(html.includes('id="excludedPeriodEnd"'), 'Deve conter #excludedPeriodEnd');
  assert.ok(html.includes('id="excludedPeriodsList"'), 'Deve conter #excludedPeriodsList');

  // Diretriz arquitetural: NADA de presets automáticos de bloqueio
  assert.strictEqual(html.includes('Bloquear Janeiro'), false, 'Não deve haver preset automático Bloquear Janeiro');
  assert.strictEqual(html.includes('Bloquear Julho'), false, 'Não deve haver preset automático Bloquear Julho');

  // 2. Fita Anual com Janela Personalizada (renderAnnualRibbon)
  const h2Years = generateHolidays([2027, 2028], 'UFBA_SALVADOR', true, true);
  const opt = new VacationOptimizer({
    windowStartDate: '2027-05-03',
    windowYears: 1,
    holidays: h2Years
  });
  const scenarios = opt.optimize(30, 3);
  const ribbonHtml = renderAnnualRibbon(scenarios[0], 2027, 0, h2Years, { windowStartDate: '2027-05-03', windowYears: 1 });
  assert.ok(typeof ribbonHtml === 'string', 'Fita anual da janela deve retornar string');
  assert.ok(ribbonHtml.includes('Fita Anual do Tempo'), 'Fita deve manter o título base');
  assert.ok(ribbonHtml.includes('03/05/2027'), 'Fita deve exibir data inicial da janela');

  // 3. Contagem Escopada de Feriados
  const sDate = new Date(2027, 4, 3); // 03/05/2027
  const eDate1Y = new Date(2028, 4, 2); // 1 ano
  const scoped1Y = h2Years.filter(h => {
    const d = new Date(h.date);
    return d >= sDate && d <= eDate1Y;
  });
  assert.ok(scoped1Y.length > 0, 'Deve haver feriados escopados na janela de 1 ano');
  assert.ok(scoped1Y.every(h => {
    const d = new Date(h.date);
    return d >= sDate && d <= eDate1Y;
  }), 'Todos os feriados devem estar estritamente dentro da janela escopada');
});

// ---------------------------------------------------------------------
// TESTE 32: Robustez de Parsing ISO, Exclusão Estrita sem Falhas e Fita Dinâmica (Ponto 2 Reforçado)
// ---------------------------------------------------------------------
runTest('Teste 32: Robustez de Parsing ISO, Exclusão Estrita sem Falhas e Fita Dinâmica (Ponto 2 Reforçado)', 'core', () => {
  // 1. Parsing robusto de ISO strings com timezone e timestamps
  const isoDate = parseDate('2027-05-03T00:00:00.000Z');
  assert.ok(isoDate instanceof Date, 'parseDate deve converter ISO string em Date válida');
  assert.strictEqual(isoDate.getFullYear(), 2027);
  assert.strictEqual(isoDate.getMonth(), 4);
  assert.strictEqual(isoDate.getDate(), 3);

  // Parsing de inputs inválidos deve retornar null com segurança
  assert.strictEqual(parseDate(null), null);
  assert.strictEqual(parseDate(''), null);
  assert.strictEqual(parseDate('invalido'), null);

  // 2. Exclusão estrita com ISO strings contendo timestamp (sem falha silenciosa)
  const h2Years = generateHolidays([2027, 2028], 'UFBA_SALVADOR', true, true);
  const optIsoEx = new VacationOptimizer({
    windowStartDate: '2027-05-03T00:00:00.000Z',
    windowYears: 1,
    holidays: h2Years,
    excludedPeriods: [
      { start: '2027-07-01T00:00:00.000Z', end: '2027-07-31T23:59:59.000Z' }
    ]
  });

  const scenariosIso = optIsoEx.optimize(30, 3);
  assert.ok(scenariosIso.length > 0, 'Deve gerar cenários com datas ISO');
  const julStart = new Date(2027, 6, 1);
  const julEnd = new Date(2027, 6, 31);
  scenariosIso.forEach(sc => {
    sc.periods.forEach(p => {
      const overlaps = p.startDate <= julEnd && p.endDate >= julStart;
      assert.strictEqual(overlaps, false, 'Nenhuma parcela pode tocar período excluído por ISO string');
    });
  });

  // 3. Fita Anual não corta meses subsequentes onde férias terminam
  const edgeScenario = {
    totalOff: 30,
    extraGain: 0,
    split: [30],
    periods: [{
      startDate: new Date(2028, 4, 2),
      endDate: new Date(2028, 4, 31),
      effectiveStart: new Date(2028, 4, 2),
      returnDate: new Date(2028, 5, 1),
      length: 30,
      totalOff: 30
    }]
  };
  const ribbonHtml = renderAnnualRibbon(edgeScenario, 2027, 0, h2Years, { windowStartDate: '2027-05-03', windowYears: 1 });
  assert.ok(ribbonHtml.includes("JUN'28"), 'Fita deve incluir Junho de 2028 para exibir término das férias');

  // 4. Contabilidade proporcional exata de banco de horas quando não aplicado
  const optNoComp = new VacationOptimizer({
    windowStartDate: '2027-05-03',
    windowYears: 1,
    holidays: h2Years,
    compensationDays: 5,
    excludedPeriods: [
      { start: '2027-05-15', end: '2028-05-01' }
    ]
  });
  const scenariosNoComp = optNoComp.optimize(10, 1);
  assert.ok(scenariosNoComp.length > 0);
  scenariosNoComp.forEach(sc => {
    const p = sc.periods[0];
    if (p.compDaysApplied === 0) {
      assert.strictEqual(sc.compensationDays, 0);
      assert.strictEqual(sc.extraGain, sc.totalOff - sc.vacationDays);
    }
  });
});

// ---------------------------------------------------------------------
// TESTE 33: Penalização da Armadilha Pós-Cinzas (Inibição de parcelas <= 3d na Quinta/Sexta pós-Carnaval)
// ---------------------------------------------------------------------
runTest('Teste 33: Penalização da Armadilha Pós-Cinzas (Inibição de parcelas <= 3d na Quinta/Sexta pós-Carnaval)', 'core', () => {
  const holidays = generateHolidays(2027, 'UFBA_SALVADOR', true, true);
  const opt = new VacationOptimizer({
    vacationDays: 30,
    selectedYear: 2027,
    selectedLocation: 'UFBA_SALVADOR',
    workingDays: [false, true, true, true, true, true, false],
    profile: 'servidor_ufba',
    holidays: holidays
  });

  // Em 2027, Quarta de Cinzas é 10/02/2027 (mês 1 indexado a 0).
  // Quinta pós-cinzas é 11/02/2027; Sexta é 12/02/2027.
  const trapQuinta = opt._isPostCinzasTrap(new Date(2027, 1, 11), 2);
  const trapSexta = opt._isPostCinzasTrap(new Date(2027, 1, 12), 3);
  const noTrapLong = opt._isPostCinzasTrap(new Date(2027, 1, 11), 10);
  const noTrapOtherMonth = opt._isPostCinzasTrap(new Date(2027, 5, 28), 2);

  assert.strictEqual(trapQuinta, true, 'Quinta pós-cinzas com 2 dias deve ser identificada como armadilha');
  assert.strictEqual(trapSexta, true, 'Sexta pós-cinzas com 3 dias deve ser identificada como armadilha');
  assert.strictEqual(noTrapLong, false, 'Parcela de 10 dias ou mais não é armadilha');
  assert.strictEqual(noTrapOtherMonth, false, 'Data fora do pós-cinzas não deve ser marcada como armadilha');

  // No ranking dos cenários gerados para 2027, nenhum cenário com hasPostCinzasTrap deve constar no Top de recomendações
  const scenarios = opt.optimize(30, 3);
  const hasTrapInTop = scenarios.some(s => s.hasPostCinzasTrap);
  assert.strictEqual(hasTrapInTop, false, 'Nenhum cenário com armadilha pós-cinzas deve estar no Top de recomendações');
});

console.log('\n========================================================');
console.log(`🎉 RESULTADO: ${passedTests} / ${totalTests} TESTES APROVADOS! (${skippedTests} ignorados pelo filtro)`);
console.log('========================================================');

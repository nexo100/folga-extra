/**
 * tags.js - Motor de Roteiros Temáticos e Tags Estratégicas (Design System Elevado)
 * Responsabilidade:
 * - Analisar a composição de feriados, pontes, recesso e distribuição de cada cenário
 * - Atribuir arquétipos temáticos e roteiros culturais (Bahia + Brasil + Saúde)
 * - Garantir paleta semântica estrita Púrpura Nobre (Opção B)
 * - Zero dependência de DOM / HTML
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TagsEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // OPÇÃO B: Cor Exclusiva e Inconfundível para Rótulos de Estilos / Roteiros (Púrpura Nobre)
  const THEME_STYLE = 'bg-purple-100 text-purple-950 border border-purple-300';

  /**
   * Determina o roteiro ou arquétipo temático de um cenário de férias
   * @param {Object} sc - Cenário de férias gerado pelo VacationOptimizer
   * @param {number} sIdx - Índice da opção no ranking (0 = Campeã)
   * @param {boolean} distributeThroughoutYear - Flag de combate à fadiga
   * @returns {{ text: string, style: string }}
   */
  function getScenarioStrategicTheme(sc, sIdx, distributeThroughoutYear = false) {
    if (!sc || !sc.periods || sc.periods.length === 0) {
      return { text: '✨ Planejamento Padrão', style: THEME_STYLE };
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

  return {
    getScenarioStrategicTheme,
    THEME_STYLE
  };
});

# Documento Base de Regras, Lógica e Algoritmo de Férias
## Especial: Servidor Público Federal (UFBA - Salvador / BA)
### Versão 5.1 - Motor Exato de Programação Dinâmica e Otimização Multiobjetivo

Este documento é a **fonte única de verdade (Single Source of Truth)** para o cálculo, otimização, formulação matemática, regras jurídicas e calendário do aplicativo **Folga Extra (Versão UFBA)**.

---

## 1. Fundamentos Jurídicos e Regime de Trabalho

### 1.1 Regime Estatutário (Lei Federal nº 8.112/1990)
* **Base Legal:** Artigo 77 da Lei nº 8.112/1990.
* **Direito Anual:** 30 (trinta) dias de férias por exercício.
* **Parcelamento das Férias:**
  * As férias podem ser parceladas em até **3 (três) etapas** (Art. 77, § 3º).
  * **Flexibilidade Legal da Lei 8.112/1990:** O servidor público federal tem autonomia para solicitar parcelamento em até 3 etapas a partir de **1 (um) dia corrido** ($L_i \ge 1$), desde que em conformidade com o interesse da administração.
  * Por essa razão, o sistema suporta marcações a partir de 1 dia ($V \in [1, 30]$) e qualquer combinação legal, destacando tanto as divisões clássicas consolidadas entre os servidores da UFBA (**3 etapas iguais de 10 dias: $10 + 10 + 10$**, **$15 + 15$** e **$15 + 10 + 5$**) quanto frações estratégicas de alta alavancagem.
* **Início do Período de Férias:**
  * O primeiro dia oficial marcado de férias ($D_{\text{inicio}}$) **deve ser obrigatoriamente um dia útil de trabalho** ($w(D_{\text{inicio}}) = 1$).
  * O servidor não pode iniciar férias em dia de repouso ou folga (sábado, domingo, feriado, ponto facultativo ou recesso institucional).
  * O agendamento deve respeitar a programação das unidades e o calendário acadêmico/administrativo da UFBA.

---

## 2. Calendário Oficial Aplicável à UFBA em Salvador / BA

### 2.1 Feriados Nacionais Oficiais (Leis Federais nº 662/49, 10.607/02 e 14.759/23)
1. **01 de Janeiro:** Confraternização Universal (Ano Novo) — Imutável por lei federal.
2. **Sexta-feira da Paixão (Móvel):** Sexta-feira que antecede a Páscoa (Páscoa - 2 dias).
3. **Domingo de Páscoa (Móvel):** Calculado pelo algoritmo astronômico do Computus (Meeus/Gauss).
4. **21 de Abril:** Tiradentes.
5. **01 de Maio:** Dia Mundial do Trabalho.
6. **07 de Setembro:** Independência do Brasil.
7. **12 de Outubro:** Nossa Senhora Aparecida (Padroeira do Brasil).
8. **02 de Novembro:** Finados.
9. **15 de Novembro:** Proclamação da República.
10. **20 de Novembro:** **Dia Nacional de Zumbi e da Consciência Negra** *(Feriado Nacional estabelecido pela Lei Federal nº 14.759/2023)*.
11. **25 de Dezembro:** Natal — Imutável por lei federal.

> [!IMPORTANT]
> A **Quinta-feira Santa NÃO é feriado** para o Poder Executivo Federal nem para a UFBA. Trata-se de dia útil normal de trabalho. Apenas a Sexta-feira da Paixão é feriado oficial.

---

### 2.2 Feriados Locais de Salvador / Bahia Respeitados pela UFBA
1. **Corpus Christi (Móvel):** Quinta-feira (Páscoa + 60 dias) — Feriado Municipal em Salvador (Lei Municipal nº 1.997/1967) e Ponto Facultativo Federal (Portaria MGI).
2. **24 de Junho:** **São João** — Feriado Municipal em Salvador (Lei Municipal nº 1.997/1967) e tradição cultural em toda a Bahia.
3. **02 de Julho:** **Independência da Bahia (Dois de Julho)** — Feriado Estadual Magno (Art. 6º da Constituição do Estado da Bahia).
4. **08 de Dezembro:** **Nossa Senhora da Conceição da Praia** — Padroeira de Salvador e da Bahia (Feriado Municipal - Lei nº 1.997/1967).

---

### 2.3 Portarias da Reitoria da UFBA e Pontos Facultativos do MGI
1. **Carnaval nos Campi do Circuito da Folia (Portaria Anual da Reitoria da UFBA):**
   * Os campi e órgãos da UFBA situados nos circuitos e imediações do Carnaval de Salvador (Reitoria no Campo Grande, Faculdade de Medicina no Terreiro de Jesus, Direito/Enfermagem/Nutrição no Canela, Politécnica na Federação e Ondina) têm as **atividades suspensas da Quarta-feira pré-Carnaval até a Quarta-feira de Cinzas**.
   * Dias sem expediente no circuito:
     * Quarta-feira pré-Carnaval (Carnaval - 6 dias)
     * Quinta-feira pré-Carnaval (Carnaval - 5 dias)
     * Sexta-feira pré-Carnaval (Carnaval - 4 dias)
     * Sábado e Domingo (fim de semana)
     * Segunda-feira de Carnaval (Carnaval - 1 dia)
     * Terça-feira de Carnaval (Data do Carnaval)
     * Quarta-feira de Cinzas (Carnaval + 1 dia - expediente integral suspenso na UFBA)
   * **Retorno obrigatório ao trabalho:** Quinta-feira pós-Cinzas (Carnaval + 2 dias).
   * **Prevenção da "Armadilha Pós-Cinzas" (`_isPostCinzasTrap`):**
     * Quando as atividades da UFBA são suspensas até a Quarta-feira de Cinzas, a Quinta e a Sexta-feira subsequentes são dias úteis normais de expediente regular.
     * **Inibição de Desperdício de Cota:** Iniciar uma fração curta ($\le 3$ dias) na Quinta ou Sexta-feira pós-Cinzas consome 2 ou 3 dias de férias do servidor apenas para alcançar o sábado e domingo seguintes, sem nenhum feriado à esquerda para alavancagem marginal (pois o Carnaval já cessou na Quarta). Isso queima uma das 3 parcelas legais anuais em um microdescanso comum.
     * **Tratamento Algorítmico:** O otimizador detecta essas parcelas via `_isPostCinzasTrap()`, aplica penalidade severa de qualidade (`qualityScore -= 9999`) e subordina qualquer cenário com essa ocorrência ao fundo do ranking (`hasPostCinzasTrap`), impedindo que cenários espúrios ocupem as opções recomendadas ao servidor. Parcelas mais longas ($> 3$ dias) continuam permitidas, pois representam férias plenas contínuas que atravessam as semanas seguintes.
2. **28 de Outubro:** **Dia do Servidor Público** (Art. 236 da Lei 8.112/90 - Ponto Facultativo Federal).
3. **Pontes Oficiais / Decretos de "Enforcamento" (MGI / UFBA):**
   * Sempre que um feriado oficial cai em **Quinta-feira**, o governo habitualmente decreta a **Sexta-feira** como ponto facultativo/ponte.
   * Sempre que um feriado oficial cai em **Terça-feira**, o governo habitualmente decreta a **Segunda-feira** como ponto facultativo/ponte.
   * O sistema possui um alternador específico para ligar/desligar essa premissa de acordo com o ano e setor do servidor.

---

### 2.4 Recesso de Fim de Ano com Revezamento e Vésperas (Portarias SRT/MGI e UFBA)
1. **Vésperas (24/12 e 31/12):**
   * Previstas nas portarias anuais do MGI como pontos facultativos. Podem ser ativadas/desativadas pelo servidor.
2. **Escala de Revezamento de Recesso:**
   * Conforme diretrizes da Portaria SRT/MGI (ex: nº 6.342 e correlatas), o órgão estabelece duas turmas de revezamento para garantir serviços essenciais:
     * **Turma de Natal:** O servidor usufrui de recesso compensado nos dias úteis da semana de Natal. Na semana de Ano Novo, trabalha nos dias úteis normais.
     * **Turma de Ano Novo:** O servidor trabalha nos dias úteis da semana de Natal e usufrui de recesso compensado nos dias úteis da semana de Ano Novo.
   * **Invariante Jurídica Irrenunciável:** Os feriados de **25 de Dezembro** e **1º de Janeiro** são feriados nacionais para **todos os servidores**, independentemente da escala de revezamento atribuída.

---

### 2.5 Escopo de Contagem Anual e Tratamento de Bordas (Sem Falsa Equivalência)
* **Dias de Transição de Ano:** O motor inclui datas de borda dos anos adjacentes (ex: 31 de Dezembro do ano $Y-1$ e 01 de Janeiro do ano $Y+1$) exclusivamente para garantir o cálculo contínuo de férias que transpassam o ano civil.
* **Escopo Estrito do Cockpit:** O contador oficial do Cockpit e a Tabela de Feriados filtram rigorosamente apenas os feriados e recessos pertencentes ao ano selecionado ($t \in Y$, `getFullYear() === state.selectedYear`), eliminando falsas equivalências:
  * **Sem Escala + Vésperas:** Adiciona exatamente **+2 dias** em $Y$ (24/12 e 31/12).
  * **Turma de Natal + Vésperas:** Como o dia 24/12 já consta como recesso institucional da turma, ativar as vésperas adiciona exatamente **+1 dia** em $Y$ (31/12).
  * **Turma de Ano Novo + Vésperas:** Como o dia 31/12 já consta como recesso institucional da turma, ativar as vésperas adiciona exatamente **+1 dia** em $Y$ (24/12).

---

## 3. Formulação Matemática Rigorosa (Problema do Interval Scheduling)

### 3.1 Variáveis e Espaço de Decisão
Seja o calendário do ano $Y$ modelado como um conjunto ordenado de dias discretos $T = \{1, 2, \dots, 365\}$ (ou $366$ em bissextos), com dias de borda em $Y-1$ e $Y+1$ para transição contínua de ano.
Para cada dia $t \in T$:
$$w(t) = \begin{cases} 1, & \text{se } t \text{ é dia útil de trabalho} \\ 0, & \text{se } t \text{ é repouso semanal, feriado ou recesso institucional} \end{cases}$$

O problema consiste em selecionar $k \in \{1, 2, 3\}$ intervalos oficiais de férias $[s_i, e_i]$, com comprimentos $L_i = e_i - s_i + 1$, tais que:
1. $\sum_{i=1}^k L_i = V$ (onde $V \in [1, 30]$ é a cota regulamentar solicitada).
2. $L_i \ge 1, \quad \forall i \in \{1, \dots, k\}$ (etapas a partir de 1 dia corrido nos termos do Art. 77 da Lei 8.112/1990).
3. $w(s_i) = 1, \quad \forall i \in \{1, \dots, k\}$ (férias nunca iniciam em dia de folga ou recesso).
4. $[E_{start, i}, R_{date, i})$ são intervalos de descanso contínuo **mutuamente disjuntos** (não-sobreposição estrita).

### 3.2 Saída Efetiva ($E_{start, i}$), Retorno ($R_{date, i}$) e Descanso Real ($T_{descanso}$)
Para cada período $[s_i, e_i]$:
* **Saída Efetiva:** $E_{start, i} = \max \{ t < s_i \mid w(t) = 1 \} + 1$.
* **Retorno ao Trabalho:** $R_{date, i} = \min \{ t > e_i \mid \text{servidor deve trabalhar no dia } t \}$.
* **Descanso Contínuo Real:**
  $$T_{descanso, i} = R_{date, i} - E_{start, i}$$
* **Descanso Total do Cenário:**
  $$TotalOff = \sum_{i=1}^k T_{descanso, i}$$

---

## 4. Otimização Multiobjetivo: Fronteira de Pareto e Dinâmica dos Tetos Anuais

### 4.1 A Variabilidade do Teto Anual e a Fronteira de Pareto
O teto de descanso **NÃO é um número estático universal** (como 55 dias). Ele é uma variável matemática que depende do alinhamento dos dias da semana em cada ano, dos feriados móveis, da cota solicitada ($V$) e da escala de recesso:

* **Exemplos de tetos calculados para 30 dias de férias:**
  * Em **2025**: o descanso máximo atinge **55 dias** (split 12+9+9).
  * Em **2026**: o descanso máximo atinge **54 dias** (split 12+9+9).
  * Em **2027**: o descanso máximo atinge **56 dias** (com parcelas curtas flexíveis como 16+10+4) e **55 dias** (com divisões clássicas como 15+10+5). A clássica 10+10+10 atinge **54 dias**.
  * Em **2028**: o descanso máximo atinge **52 dias** (split 17+8+5).
  * Com **20 dias de férias** (venda de 10 dias): o descanso máximo varia entre **35 e 38 dias**.

### 4.2 Fronteira de Pareto (Teto Global vs Desperdício Zero)
Dentro de cada ano específico, o algoritmo calcula as soluções da **Fronteira de Pareto**:

1. **Objetivo 1 — Teto Máximo Global de Descanso ($\max \sum T_{descanso}$):**
   * Maximiza o número total de dias sem trabalhar no ano, mesmo que alguma fração termine imediatamente antes do fim de semana.
2. **Objetivo 2 — Eficiência Pura de Pareto com Desperdício Zero ($\sum W_{\text{fim}} = 0$):**
   * Garante que o último dia de cada fração marcada termine rigorosamente em dia útil trabalhado, sem nenhum dia de fim de semana consumido dentro da contagem regulamentar.
3. **Objetivo 3 — Divisões Clássicas dos Servidores (ex: $10+10+10$):**
   * Apresenta as melhores alternativas para partições balanceadas.

> **Princípio Algorítmico Adotado:** O motor **NÃO** aplica filtros cegos para descartar cenários. Ele calcula e apresenta a **Fronteira de Pareto**: o usuário visualiza tanto a **Opção Campeã daquele ano**, quanto as opções com **Desperdício Zero** e a clássica **10+10+10**, todas claramente identificadas.

---

## 5. Resolução da Permutação Cronológica de Multisets

Uma partição de 30 dias em 3 etapas representa um **multiset** $\{L_a, L_b, L_c\}$. Por exemplo, para $\{15, 10, 5\}$:
* Ordenação convencional da partição: $15 + 10 + 5$ (ordem decrescente de tamanho).
* **Ordem cronológica ideal no calendário:**
  * Etapa 1 (Fevereiro - Carnaval): **10 dias**
  * Etapa 2 (Agosto): **5 dias**
  * Etapa 3 (Outubro - Aparecida/Finados): **15 dias**

O motor de Programação Dinâmica avalia todas as permutações válidas no tempo $\pi(L_1, L_2, L_3)$. Isso permite que a fração de tamanho ideal seja alocada no feriado com a maior densidade de emenda daquele momento do ano, sem exigir que o maior período aconteça no início do ano.

---

## 6. Alocação Estratégica de Folgas Compensatórias (Banco de Horas)

Quando o servidor informa possuir $B$ dias de **banco de horas** (ex: $B = 2$):
1. **Regra de Não-Multiplicação:** O saldo $B$ é **estritamente consumido uma única vez** em todo o cenário. Nunca se aplicam $B \times k$ dias.
2. **Alocação Cirúrgica ao Maior Multiplicador Marginal:**
   O motor avalia o ganho marginal de descanso $\Delta_i$ gerado pela inserção de $B$ dias em cada uma das etapas $i \in \{1, \dots, k\}$:
   $$\Delta_i = T_{descanso}(P_i \text{ com } B) - T_{descanso}(P_i \text{ sem } B)$$
   A etapa com maior $\Delta_i$ (desde que não cause colisão com a etapa subsequente) recebe o banco de horas.
3. **Multiplicador de Alavancagem:**
   Se 1 dia de banco de horas cai numa sexta-feira e emenda um fim de semana inteiro, 1 dia gera 3 dias de descanso extra!
4. **Transparência Visual:** A fração contemplada exibe a badge `+2d Banco de Horas`, e o cálculo global registra:
   $$G_{\text{extra}} = TotalOff - (V + B)$$
   $$\text{Alavancagem} = \frac{TotalOff}{V + B}$$

---

## 7. Complexidade Assintótica e Bateria de Testes Automatizados

O algoritmo opera via **Programação Dinâmica com tabelas de prefixo**, apresentando complexidade assintótica linear $O(N)$ em relação ao número de dias do ano, operando puramente em memória e sem dependências externas.

A integridade matemática e legal é validada por uma bateria de **33 testes unitários e de integração automatizados** em `test_suite.js` (executável de forma completa ou seletiva via flags `--core`, `--ui`, `--tags`, `--colors`):
* ⚖️ **Teste 1:** Cálculo exato da Páscoa e Carnaval móveis (Meeus/Computus)
* ⚖️ **Teste 2:** Quinta-feira Santa NÃO é feriado (dia útil normal)
* ⚖️ **Teste 3:** 20 de Novembro (Consciência Negra - Lei 14.759/2023)
* ⚖️ **Teste 4:** Feriados de Salvador/BA (São João, 2 de Julho, Conceição da Praia)
* ⚖️ **Teste 5:** Carnaval no Circuito UFBA (Quarta pré-Carnaval à Quarta de Cinzas)
* ⚖️ **Teste 6:** Lógica de Pontes Enforcadas em Terças e Quintas
* ⚖️ **Teste 7:** Férias nunca iniciam em sábado, domingo ou feriado
* ⚖️ **Teste 8:** Retorno ao trabalho é obrigatoriamente um dia útil de trabalho
* ⚖️ **Teste 9:** Zero Sobreposição entre períodos de férias gerados
* ⚖️ **Teste 10:** Presença garantida de 10+10+10 e 15+10+5 no ranking
* ⚖️ **Teste 11:** Cálculo correto do multiplicador de Alavancagem
* ⚖️ **Teste 12:** Garantia de espaçamento mínimo saudável entre as etapas ($\ge 60$ dias para 3 parcelas e $\ge 75$ dias para 2)
* ⚖️ **Teste 13:** Detecção precisa de fim de período e coexistência de opções da Fronteira de Pareto
* ⚖️ **Teste 14:** Alocação proporcional de Banco de Horas sem inflacionar o saldo
* 🎨 **Teste 15:** Renderização panorâmica dos 12 meses na Fita Anual do Tempo
* ⚖️ **Teste 16:** Cálculo dinâmico das semanas de recesso do MGI para qualquer ano
* ⚖️ **Teste 17:** Preservação estrita dos Feriados Nacionais (25/12 e 01/01) em qualquer escala
* ⚖️ **Teste 18:** Injeção de Recesso MGI e Vésperas sem duplicidade de datas
* ⚖️ **Teste 19:** Otimizador respeita recesso MGI e não gasta férias em dias de recesso
* 🏷️ **Teste 20:** Motor de 30+ Roteiros Temáticos e Paleta Púrpura Nobre (Opção B)
* 🎨 **Teste 21:** Proporcionalidade exata da Fita Anual por dias reais do mês (`daysInMonth`)
* 🎨 **Teste 22:** Desacoplamento de cores no Mini-Calendário (Índigo-400 para Fins de Semana)
* 🎨 **Teste 23:** Estrutura do Itinerário Boarding Pass e Segurança de Retorno
* 👁️ **Teste 24:** Linter Automatizado de Integridade do Guia de Cores (Design System)
* ⚖️ **Teste 25:** Flexibilidade de Parcelamento a partir de 1 dia (Lei 8.112/90) e Cotas de 1 a 30 dias
* ⚖️ **Teste 26:** Contagem Escopada de Feriados no Cockpit e Não-Duplicação de Vésperas (Zero Falsa Equivalência)
* 🎨 **Teste 27:** Auditoria de Integridade e Conformidade PWA (Offline-First)
* 🎨 **Teste 28:** Validação Arquitetural do Comparador Desacoplado (Dock Flutuante + Slide-Over Drawer)
* ⚖️ **Teste 29:** Janela Interanual e Escopo de Busca (1 e 2 Anos - Art. 77 Lei 8.112/90)
* ⚖️ **Teste 30:** Exclusão Estrita de Períodos a Evitar (Colegas / Projetos / Bloqueios)
* 🎨 **Teste 31:** Interface Reativa, Fita Panorâmica e Contagem Escopada de Feriados (Ponto 2)
* ⚖️ **Teste 32:** Robustez de Parsing ISO, Exclusão Estrita sem Falhas e Fita Dinâmica (Ponto 2 Reforçado)
* ⚖️ **Teste 33:** Penalização da Armadilha Pós-Cinzas (Inibição de parcelas $\le 3$d na Quinta/Sexta pós-Carnaval)

---

## 8. Comparador Desacoplado (Dock Flutuante & Slide-Over Drawer)

Para permitir a análise lado a lado dos cenários gerados pela Fronteira de Pareto sem poluir a interface principal e sem forçar fluxos de decisão invasivos, o sistema incorpora um módulo analítico desacoplado:

1. **Dock Flutuante Inferior (`#comparatorDock`):**
   * Surge suavemente no rodapé ao selecionar o primeiro cenário para comparação (até o teto de 3 opções simultâneas).
   * Exibe chips compactos dos cenários em análise, contador em tempo real (`X / 3`), botão para limpar a seleção e gatilho de abertura do comparador.
2. **Painel Deslizante Lateral (`#comparatorDrawer`):**
   * Abre em gaveta lateral direita (*Slide-Over Drawer*) com fundo translúcido e foco analítico integral.
   * Fechamento ágil via tecla `ESC`, clique no backdrop ou botão de fechar.
3. **Diretrizes Estritas de Design Analítico:**
   * **Sem Botão "Adotar Cenário":** O comparador não força decisões de preenchimento; o servidor mantém total autonomia para transcrever as datas no seu requerimento oficial de férias.
   * **Sem Tags Temáticas no Comparador:** O painel omite badges e etiquetas lúdicas, focando 100% nas métricas técnicas:
     * Total de Dias Livres Contínuos (com destaque na melhor marca);
     * Dias de Repouso Semanal (Sáb/Dom) absorvidos;
     * Alavancagem e Ganho Líquido (+Xd);
     * Feriados e Pontes Oficiais emendados em cada etapa;
     * Intervalos de Dias Úteis de Trabalho (Combate à Fadiga) entre as etapas.
   * **Exportação Analítica:** Botão para copiar um resumo textual comparativo tabulado diretamente para a área de transferência.

---

## 9. Janela Temporal Personalizada e Períodos a Evitar (Ponto 2)

Projetado para atender servidores que iniciam o usufruto fora de janeiro (ex: cumprimento de interstício ou retorno de licença) e servidores com períodos de trabalho obrigatório (colegas em férias, fechamento de folha, projetos):

1. **Horizonte de 1 ou 2 Anos (Art. 77 Lei 8.112/90):**
   * Permite definir a data inicial de usufruto (ex.: `03/05/2027`) e escolher buscar ao longo de **1 Ano (12 meses)** ou **2 Anos (24 meses)** (limite legal de até 2 exercícios acumulados).
   * O motor calcula o calendário astronômico (Computus Meeus) e feriados oficiais para múltiplos anos em cadeia ($2027 \to 2028 \to 2029$).
2. **Exclusão Estrita de Períodos:**
   * O servidor cadastra livremente períodos de indisponibilidade (`De [data] Até [data]`) com chips de remoção rápida, sem presets engessados.
   * O otimizador descarta qualquer período candidato cujas férias coincidam com as datas a evitar, sem comprometer a busca no restante da janela.
3. **Buffer Dinâmico de Programação Dinâmica:**
   * Matriz com buffer ampliado dinamicamente (`maxDay = totalWindowDays + offset + 140`) para acomodar com segurança cenários com férias tardias, compensações e pontes ao final de janelas de 24 meses.
4. **Fita Anual Deslizante e Contagem Escopada:**
   * A fita renderiza os meses da janela ativa sem truncar parcelas com retorno no mês seguinte.
   * O cockpit contabiliza exclusivamente os feriados e pontes compreendidos dentro do intervalo ativo (zero falsa equivalência).

---

## 10. Arquitetura Modular do Código-Fonte

```
folga-extra/
├── js/
│   ├── holidays.js       # Calendário astronômico multi-ano (Meeus/Computus), parsing ISO blindado e feriados MGI/UFBA
│   ├── optimizer.js      # Motor matemático de Programação Dinâmica multi-ano, buffer adaptativo e exclusão de períodos
│   ├── ribbon.js         # Motor da Fita Anual do Tempo dinâmica (panorama contínuo de meses sincronizado)
│   ├── mini-calendar.js  # Renderizador visual em grade 7xN dos meses de férias
│   ├── tags.js           # Motor de 30+ roteiros temáticos e arquétipos culturais/sazonais
│   └── app.js            # Controlador reativo, toasts, janela personalizada, períodos a evitar, comparador e exportações
├── icons/
│   └── icon.svg          # Ícone vetorial oficial PWA
├── manifest.json         # Manifesto PWA para instalação no celular e desktop
├── sw.js                 # Service Worker (Estratégia Cache-First para funcionamento 100% offline)
├── index.html            # Interface moderna, offline-first com Tailwind CSS e Lucide Icons
└── test_suite.js         # Bateria de 33 testes unitários automatizados com 100% de aprovação
```

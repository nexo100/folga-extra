# DOCUMENTO DE TRANSIÇÃO E ESTADO DO PROJETO (HANDOFF)
**Projeto:** Folga Extra (UFBA) — Otimizador Inteligente de Férias e Descanso  
**Versão Atual:** v3.4.0  
**Data de Atualização:** 28/09/2026  
**Caminho Local Oficial:** `C:\Users\nexo\github\folga-extra`  
**Repositório GitHub:** `https://github.com/nexo100/folga-extra`  
**Conversa de Origem:** [🔗 Análise e Reprodução de Site](conversation://f1f763d6-076e-4543-a905-f0eaa0736efd)  
**Conversa de Continuação/Índice:** [🔗 Retomada e Próximos Passos](conversation://1c2a3b0a-fa69-4089-a588-81fff2b16f3c)  

---

## 1. RESUMO EXECUTIVO DO ESTADO ATUAL

O projeto encontra-se em estado maduro, com arquitetura desacoplada, alta fidelidade à legislação (Lei 8.112/90) e suíte de testes 100% verde (**33 / 33 testes aprovados**). Todas as regras de negócio, interface visual, PWA offline e diretrizes de governança/segurança estão plenamente implementadas e gravadas em disco.

---

## 2. ARQUITETURA E FUNCIONALIDADES CONCLUÍDAS

### A. Cockpit Principal Reorganizado (Estrutura Equilibrada em 3 Cards de Mesma Altura)
O painel de controle superior foi reestruturado de forma harmoniosa, com alturas idênticas (`items-stretch` e `h-full justify-between`) e divisão temática clara:
1. **Card 1: Lotação & Cota de Férias (Perfil & Regime)**
   - Instituição / Calendário oficial (UFBA Salvador/BA, Salvador Geral, Federal).
   - Dias de trabalho na semana (jornada semanal).
   - Cota de férias solicitadas (1 a 30 dias).
   - Parcelamento das férias (1x, 2x ou 3x etapas).
2. **Card 2: Calendário & Janela Temporal (Exercício & Janela)**
   - Ano / Exercício base de referência (2025, 2026, 2027, 2028).
   - **Janela Diminuída 1 (Personalizar Data):** Início de busca a partir de data configurável e alcance interanual de 1 ou 2 anos (Art. 77 Lei 8.112/90).
   - **Janela Diminuída 2 (Data Proibida):** Intervalo de datas a evitar com chips interativos de exclusão estrita.
3. **Card 3: Alavancagem & Bem-Estar (Emendas & Folgas)**
   - Banco de Horas / Folgas cirúrgicas (+ / -).
   - Toggles de emendas inteligentes (Carnaval UFBA, Pontes MGI, Vésperas 24/31, Combate à Fadiga).
   - **Escala de Recesso MGI Integrada:** Revezamento de fim de ano (Sem Escala, Turma Natal, Turma Ano Novo).

---

### B. Ponto 2: Janela Temporal e Períodos a Evitar (100% Implementado)
- **Alcance Temporal de 1 e 2 Anos:** Suporte nativo à busca interanual contínua de 12 ou 24 meses (Art. 77 da Lei 8.112/90 para acúmulo de até 2 períodos por necessidade de serviço).
- **Buffer Dinâmico da Programação Dinâmica (`js/optimizer.js`):** Ajuste automático de memória (`maxDay = totalWindowDays + offset + 140`), comportando até 760+ dias sem estouro de pilha ou falha de limite.
- **Exclusão Estrita de Períodos Bloqueados:** Interface com chips removíveis para bloquear períodos com colegas de férias ou projetos críticos. O otimizador descarta qualquer candidato que toque nesses intervalos.
- **Fita Panorâmica e Calendários Dinâmicos (`js/ribbon.js`, `js/app.js`):** Renderização reativa dos meses da janela e contagem escopada de feriados.
- **Robustez de Datas ISO:** Normalização em formato local `YYYY-MM-DD` com `T00:00:00` para neutralizar desvios de timezone UTC.

---

### C. Comparador Desacoplado (Dock Flutuante + Drawer Lateral)
- Botão `[+ Comparar]` em cada card de cenário gerado (permite selecionar até 3 opções simultâneas).
- **Dock Flutuante Inferior:** Barra compacta no rodapé com contadores e botão "Comparar Agora".
- **Slide-Over Drawer Lateral:** Painel deslizante à direita com tabela comparativa analítica:
  * Ganho líquido e multiplicador de alavancagem.
  * Dias de trabalho entre etapas (avaliação de fadiga).
  * Feriados e pontes aproveitadas.
  * Verificação de repouso semanal (alerta de 0d no fim de semana).
- **Decisões Estritas de Design Mantidas:** Zero botão *"Adotar este Cenário"* e zero *"Tags Temáticas"* dentro do comparador (foco 100% analítico e técnico).

---

### D. PWA e Suporte Offline-First
- Service Worker (`sw.js`) configurado com cache dinâmico de assets locais e fontes/Tailwind CDN.
- `manifest.json` com especificações de tema, ícones e inicialização standalone.

---

### E. Navegador de Etapas por Abas (Segmented Control & Itinerary Stepper)
- **Visualização Focada (Uma por Vez):** Ao expandir qualquer card de cenário, o usuário visualiza a régua de etapas táteis (`Etapa 1`, `Etapa 2`, `Etapa 3`) e o botão `Todas`.
- **Conectores Interativos com Seta na Barra de Abas:** Entre as etapas na própria barra de abas, foi inserido um botão/indicador com seta (`➔ [⏱️ 115d de trabalho (~3.8 meses de recarga)]`) ocupando toda a linha de forma panorâmica e permitindo avançar de etapa com um clique.
- **Redução Drástica de Altura e Eliminação de Redundância:** A altura do card expandido reduziu de ~1000px para ~350px. O banner que ficava repetido no corpo foi unificado na barra de abas, eliminando a rolagem cansativa e focando diretamente no *boarding pass*.
- **Navegação Sequencial Integrada:** Botões no rodapé de cada etapa (`Próxima: Etapa 2 ➔` / `⬅ Voltar`) para leitura sequencial fluida.
- **Visão Panorama Opcional:** O botão `Todas` permite visualizar o itinerário contínuo completo com os conectores de intervalo tracejados quando desejado.

---

### F. Sincronização Cronológica de Etapas & Motor de Diversidade Sazonal (10 Opções)
- **Sincronização Cronológica dos Badges (`sc.split`):** O badge e o cabeçalho de cada card agora refletem a exata ordem cronológica das etapas vivenciadas pelo servidor (`combo.periods.map(p => p.length)`), eliminando discrepâncias onde a partição descendente (ex: `24 + 4 + 2`) discordava da sequência de etapas (ex: `Etapa 1: 2d`, `Etapa 2: 4d`, `Etapa 3: 24d`). A partição canônica original foi preservada em `sc.partition` para categorizações estruturais.
- **Programação Dinâmica Multicanal com Âncoras Sazonais:** Superação do viés de concentração em que o prefix-max global sufocava períodos alternativos. O algoritmo agora mantém múltiplos canais de estado na Programação Dinâmica:
  * *Canal Julho:* Garante combinações de altíssima folga ancoradas nas férias de inverno / recesso escolar de julho.
  * *Canal Dezembro/Janeiro:* Garante opções conectadas ao recesso de fim de ano (MGI / Natal / Réveillon).
  * *Canal Abril:* Garante opções de primeiro semestre aproveitando Semana Santa e Tiradentes.
- **Ranking Expandido de 10 Opções Calibradas:** O painel de resultados agora exibe 10 opções completas, permitindo ao usuário comparar variações de pontuação máxima (Campeã e Campeã Alternativa lado a lado), alternativas para famílias (Julho), servidores em escala de fim de ano (Dezembro), e as divisões clássicas estatutárias (`10+10+10`, `15+10+5` e Desperdício Zero).

---

### G. Prevenção da "Armadilha Pós-Cinzas" (`_isPostCinzasTrap`)
- **Detecção de Frações Ineficientes:** Identifica frações curtas ($\le 3$ dias) agendadas para iniciar na Quinta ou Sexta-feira imediatamente após a Quarta-feira de Cinzas.
- **Motivação Estatutária:** Como as atividades da UFBA são suspensas até a Quarta de Cinzas, a Quinta e Sexta são dias de expediente normal sem feriado à esquerda para emenda. Gastar 2 ou 3 dias de férias apenas para alcançar o fim de semana queima uma das 3 parcelas legais em um microdescanso comum, sem ganho marginal real.
- **Penalização e Rebaixamento no Ranking:** O método `_isPostCinzasTrap()` aplica penalidade de `-9999` pontos no `qualityScore`, e a ordenação final (`hasPostCinzasTrap`) subordina qualquer cenário com essa ocorrência ao fundo do ranking, assegurando que o Top 10 recomende exclusivamente combinações de alta alavancagem. Parcelas longas ($> 3$ dias) continuam elegíveis.

---

### H. Fita Anual do Tempo Fixa (Sticky HUD Glassmorphism)
- **Fixação no Topo durante Rolagem:** A Fita Anual do Tempo agora permanece travada (*sticky top*) abaixo do cabeçalho da página enquanto o servidor navega e rola pelos 10 cenários de férias recomendados.
- **Liberação Automática:** Ao rolar além da última opção de cenário (fim de `#resultsSection`), a fita se destrava naturalmente acompanhando a saída da seção, sem invadir o rodapé.
- **Efeito Visual Glassmorphism:** Implementado acabamento em vidro translúcido (`bg-white/95 backdrop-blur-md border-2 border-slate-200/90 shadow-xl`) com micro-indicadores luminosos, mantendo legibilidade total dos dados enquanto os cards de opções passam suavemente por baixo.
- **Layout Semestral Responsivo no Mobile:** No celular, a grade dos meses quebra de forma intuitiva em 6 colunas por 2 linhas (1º Semestre em cima, 2º Semestre embaixo), mantendo altura esguia (~135px) que preserva mais de 65% do visor para leitura das opções.
- **Atualização Instantânea sem Salto de Tela:** Ao clicar em qualquer opção da lista (seja a 3ª, a 6ª ou a 10ª), a fita no topo reage instantaneamente sem disparar saltos bruscos de tela (`scrollIntoView` controlado), permitindo comparar a distribuição dos meses com zero atrito de navegação.

---

### J. Desacoplamento Arquitetural, Cápsula Ultra-Slim e Harmonização Visual Sólida (v3.3.2)
- **Extração Oficial do Motor de Renderização (`js/render.js`):** Desacoplamento completo dos geradores de HTML dos cards de cenários, badges de mérito, blocos de itinerário boarding pass e gerador de tabelas ricas para fora de `js/app.js`, reduzindo a complexidade ciclomática do controlador principal e viabilizando testes unitários dedicados de renderização.
- **Fita Anual em Cápsula Flutuante Ultra-Slim 36px (Proposta B):** Implementação da cápsula flutuante de baixo perfil (~36px a 38px) no `#annualRibbonContainer`. Ao alternar para o modo compacto (`#btnToggleRibbonCollapse`), o contêiner se transforma em uma cápsula elegante de vidro escuro e contorno dourado (`bg-slate-950/95 border-2 border-amber-400`), contendo o selo da opção (`👑 Opção 01`), o contador dinâmico de dias livres (`🔥 42d Livres (+12d)`), um sparkline de 12 micro-pontos luminosos que pulsam nos meses de férias, chips das etapas e botão direto `[Ver 12 Meses]`. Isso libera mais de 85% do espaço vertical durante a rolagem mantendo a navegação ultra-clara e divertida.
- **Identidade Visual Solar e Tropical (Alegre e Saturada):** Preservação e amplificação absoluta das cores quentes, solares e festivas que remetem às férias, praias e descanso baiano (tons de âmbar, azul celeste, esmeralda e púrpura real), evitando frieza corporativa e celebrando o momento lúdico de planejar férias.
- **Dynamic Accent Ribbons e Badges Dourados:** Cartões de cenários agora contam com faixas superiores coloridas por categoria (`bg-gradient-to-r from-amber-400...`, `from-sky-400...`, `from-purple-500...`) e selo de coroa dourada para a opção campeã.
- **Itinerário Boarding Pass Aquecido:** Substituição dos divisores e bordas cinzentas (`border-slate-300`) por bordas e anéis quentes (`border-amber-300/80` e `ring-amber-400/20`), aproximando o layout de um bilhete festivo de viagem à Bahia.
- **Harmonização de Inconsistências:** Tom dinâmico da Turma Ano Novo unificado para `text-amber-600` em sincronia com o botão no HTML; eliminação de discrepâncias e alinhamento total com `GUIA_CORES_SISTEMA.md`.
- **Exportação Corporativa em Tabela HTML (SEI-UFBA / Word / E-mail):** O botão **Copiar Resumo de Férias** gera um payload duplo na área de transferência (`ClipboardItem` com `text/html` e `text/plain`). Ao colar no SEI-UFBA, no Microsoft Word ou no cliente de e-mail, o usuário obtém uma tabela oficial formatada com cabeçalhos escuros, colunas dimensionadas, destaques em verde e totais consolidados.
- **Service Worker v3.3.2:** Adição de `./js/render.js` aos ativos estáticos pré-cacheados em `sw.js` com limpeza automática de versões legadas de cache.

---

### K. Agregador de Passagens de Férias & Gamificação (v3.4.0)
- **Filtros Rápidos de Rotas (`#scenarioFiltersBar`):** Barra de abas horizontais com pílulas táteis no estilo de buscadores de passagens aéreas (`[Todas as Opções]`, `[👑 Top 3 Melhores]`, `[🏖️ Férias de Julho]`, `[🎄 Fim de Ano]`, `[⚖️ 10+10+10]`, `[🎯 Desperdício Zero]`), permitindo filtrar instantaneamente as opções calculadas sem recálculo pesado.
- **Mini-Rota de Voo em Linha Única nos Cards:** Exibição compacta e horizontal do itinerário de voo logo abaixo das datas oficiais (ex.: `Rota: 🛫 Fev: 10d (16d) ➔ 🛫 Jun: 10d (16d) ➔ 🛫 Dez: 10d (20d) ➔ 52d livres`), eliminando poluição visual de múltiplas linhas de badges e mantendo leitura instantânea.
- **Persistência Automática em Memória do Navegador (`localStorage`):** O sistema agora memoriza automaticamente todos os parâmetros ajustados pelo servidor (cota de férias, exercício, perfil institucional, parcelamento, dias de trabalho, tolerância a pontes, recesso MGI, janelas personalizadas e datas proibidas) na chave `folga_extra_v3_preferences`. Ao recarregar ou retornar ao site, todas as configurações prévias são restauradas como padrão.
- **Cartão de Embarque Oficial de Férias (`#boardingPassModal`):** Modal de confirmação e gamificação com design lúdico de bilhete de companhia aérea:
  * Cabeçalho de voo estilizado (`Voo Estatutário: Lei 8.112/1990`, origem Salvador/SSA e destino Descanso Merecido).
  * Placar consolidado de dias oficiais gastos, dias de descanso real conquistados e multiplicador de alavancagem.
  * Detalhamento de trechos e conexões (intervalos de trabalho).
  * Código de barras decorativo e selo regulatório para SouGov/SIGRH.
- **Compartilhamento Festivo para WhatsApp (`generateWhatsAppMessage`):** Botão `[📲 Copiar p/ WhatsApp]` que gera uma mensagem formatada com emojis solares e itinerário detalhado, pronta para colar em conversas familiares ou com cônjuge para planejar viagens com antecedência.
- **Cópia para o SEI-UFBA e Impressão:** Ações integradas de cópia de tabela corporativa e impressão nativa do bilhete.
- **Service Worker Atualizado para v3.4.0:** Atualização do manifesto e cache com invalidação de versões prévias.

---

## 3. SUÍTE DE TESTES AUTOMATIZADOS (`test_suite.js`)

- **Total:** 33 testes automatizados cobrindo todo o ciclo do sistema.
- **Execução:** `node test_suite.js` (executado via terminal).
- **Status:** **33 / 33 APROVADOS (100% GREEN)**.
  - *Core & Algoritmo (24 testes):* Cálculos móveis (Gauss/Meeus), feriados nacionais e Salvador, Carnaval UFBA, pontes, repouso semanal, não-sobreposição, divisões 10+10+10 e 15+10+5, espaçamento saudável (>=60d / >=75d), recesso MGI, contagem escopada, janela de 1/2 anos, exclusão estrita e penalização da armadilha pós-Cinzas.
  - *UI & DOM (7 testes):* Fita anual proporcional, desacoplamento de cores, boarding pass, integridade PWA, comparador desacoplado, fita dinâmica.
  - *Tags & Roteiros (1 teste):* Motor de 30+ arquétipos temáticos.
  - *Design System (1 teste):* Linter de conformidade estrita com `GUIA_CORES_SISTEMA.md`.
- ⚠️ **REGRA CRÍTICA DE DESEMPENHO:** NUNCA execute a ferramenta `view_file` diretamente em `test_suite.js`.

---

## 4. GOVERNANÇA, SEGURANÇA E CONFINAMENTO

O repositório e a máquina possuem 3 camadas de blindagem ativas:
1. **Camada 1 (Settings Nativas da Aplicação):**
   - Ajustar no painel de configurações do Antigravity (`Non-Workspace File Access: Ask/Deny` e `Auto-Execution Policy`).
2. **Camada 2 (Lifecycle Hooks - Bloqueio Determinístico):**
   - `.agents/hooks.json` e `.agents/security_gate.js` (no workspace e global em `~/.gemini/config/`).
   - Bloqueio imediato (`decision: "deny"`) para `localtunnel`, `lt`, `ngrok`, `cloudflared`, `serveo`, `ipify`, `ifconfig.me` e binding `0.0.0.0`.
3. **Camada 3 (Rules Persistentes em Disco):**
   - `GEMINI.md` e `.agents/rules/security.md` no projeto.
   - `~/.gemini/config/GEMINI.md` e `~/.gemini/config/rules/security_rules.md` globais.

---

## 5. MAPA DE ARQUIVOS PRINCIPAIS

| Arquivo | Função |
| :--- | :--- |
| `index.html` | Interface completa, Cockpit em 3 cards, Dock e Drawer do comparador. |
| `js/app.js` | Estado reativo, orquestração de eventos, filtros e controle da UI. |
| `js/optimizer.js` | Motor de Programação Dinâmica, janela 1/2 anos, exclusão de períodos. |
| `js/holidays.js` | Computus móvel, feriados fixos e recesso MGI interanual. |
| `js/ribbon.js` | Linha do tempo panorâmica, fitas mensais e modo compacto. |
| `js/tags.js` | Motor de 30+ arquétipos temáticos para os cenários. |
| `js/render.js` | Motor desacoplado de templates, cards de cenário e tabela corporativa SEI. |
| `test_suite.js` | Suíte de testes automatizados com 33 asserções. |
| `GUIA_CORES_SISTEMA.md` | Design System com a paleta oficial corporativa. |
| `REGRAS_ALGORITMO.md` | Especificação formal dos algoritmos e base legal (Lei 8.112/90). |
| `GEMINI.md` | Diretrizes de segurança, governança e integridade técnica. |

---

## 6. INSTRUÇÃO PARA ABRIR A NOVA CONVERSA DO PROJETO

Ao abrir a nova conversa no Antigravity:
1. Verifique se o projeto ativo é `C:\Users\nexo\github\folga-extra`.
2. Envie o seguinte prompt inicial:
   > *"Estou retomando o projeto Folga Extra a partir de @STATUS_PROJETO.md e @conversation://f1f763d6-076e-4543-a905-f0eaa0736efd. O ambiente está com 33/33 testes aprovados. Vamos definir o próximo passo do desenvolvimento."*

---

## 7. BACKLOG E PROJETOS FUTUROS (ROADMAP)

### A. Copiloto Interativo de Férias & Fixação de Etapas (Pinning & Wizard)
- **Conceito:** Permitir ao servidor definir uma etapa âncora prioritária (ex.: férias em Julho para acompanhar filhos ou no Carnaval) e fixar essa data com um botão `[📌 Fixar Parcela]`.
- **Comportamento Algorítmico:** O otimizador congela a parcela escolhida, desconta os dias da cota anual e recalcula dinamicamente por Programação Dinâmica as melhores brechas remanescentes para as etapas seguintes, respeitando o intervalo mínimo de 60 dias de recarga (anti-fadiga).
- **Modos de Operação Previstos:**
  1. *Modo Copiloto (Alfinete no Card):* Usuário fixa uma parcela de um resultado e o sistema recalcula as demais na hora.
  2. *Modo Construtor Guiado (Passo a Passo):* Wizard interativo que sugere primeiro as melhores janelas principais e depois arremata os períodos complementares.


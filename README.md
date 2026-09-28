# Folga Extra • Otimizador Inteligente de Férias (UFBA / Salvador)

> **Versão:** 3.4.1 • **Compatibilidade:** Navegadores Modernos (Offline-First / Zero Dependência de Build)  
> **Status de Qualidade:** 100% dos Testes Automatizados Aprovados (33/33 em `node test_suite.js`)  
> **Documentos de Referência:** [`REGRAS_ALGORITMO.md`](./REGRAS_ALGORITMO.md) • [`GUIA_CORES_SISTEMA.md`](./GUIA_CORES_SISTEMA.md) • [`STATUS_PROJETO.md`](./STATUS_PROJETO.md)

---

## 🌴 Visão Geral

O **Folga Extra** é uma aplicação web moderna e reativa projetada especificamente para servidores públicos federais da **Universidade Federal da Bahia (UFBA)** e do município de **Salvador / BA**.

Utilizando um motor matemático exato de **Programação Dinâmica** e **Fronteira de Pareto Multiobjetivo**, o sistema calcula dinamicamente as melhores combinações de férias anuais para transformar a cota legal solicitada (1 a 30 dias sob a Lei nº 8.112/1990) no **máximo de descanso real contínuo**, emendando estrategicamente com fins de semana, feriados municipais, estaduais e nacionais, pontos facultativos do MGI e portarias da Reitoria da UFBA.

---

## 🚀 Principais Funcionalidades

### 1. Motor Astronômico & Jurídico Completo
* **Calendário Astronômico Exato (Computus/Meeus):** Cálculo preciso de Páscoa, Carnaval, Sexta-feira da Paixão e Corpus Christi para qualquer ano (2025, 2026, 2027, 2028...).
* **Regime Estatutário Federal (Lei 8.112/1990):** Plena flexibilidade de planejamento nos termos do Art. 77. Suporta cotas anuais de 1 a 30 dias e parcelas a partir de 1 dia corrido, priorizando tanto divisões clássicas consolidadas (**10 + 10 + 10**, **15 + 15** e **15 + 10 + 5**) quanto frações estratégicas de alta alavancagem.
* **Tradições & Portarias da Bahia:**
  * **Circuito Carnaval UFBA:** Suspensão de expediente da Quarta-feira pré-Carnaval à Quarta de Cinzas nos campi do circuito (Canela, Federação, Ondina, Reitoria).
  * **Feriados de Salvador:** São João (24/Jun), Independência da Bahia (02/Jul) e Conceição da Praia (08/Dez).
  * **Feriado Nacional:** Consciência Negra (20/Nov - Lei nº 14.759/2023).
  * **Recesso de Fim de Ano MGI / Portaria SRT:** Revezamento de Natal e Ano Novo, preservando os feriados de 25/Dez e 01/Jan.

### 2. Cockpit de Simulação Minimalista e Tátil
* **Cota de Férias:** Digitação direta e reativa de 1 a 30 dias (com recálculo em tempo real).
* **Seletor de Parcelamento:** Botões minimalistas e compactos: **`1x`**, **`2x`** ou **`3x`**.
* **Jornada de Trabalho:** Grid perfeitamente alinhado de 7 colunas proporcionais (`DOM`, `SEG`, `TER`, `QUA`, `QUI`, `SEX`, `SÁB`) em linha única.
* **Coluna de Alavancagem & Bem-Estar:** Destaque visual refinado com badge `✨ Otimizadores`, controle tátil de Banco de Horas (+ / -), enforcamento de pontes e o filtro **Combate à Fadiga** (garantia de $\ge 60$ dias úteis de trabalho entre as parcelas).

### 3. Fita Anual do Tempo Panorâmica (12 Meses) & Cápsula Flutuante Ultra-Slim 36px (Proposta B)
* **Cadência Real & Fixação Inteligente:** Linha do tempo panorâmica sincronizada com o cenário ativo, fixada no topo com acabamento em vidro translúcido durante a navegação pelos resultados.
* **Cápsula Flutuante Ultra-Slim 36px (Proposta B):** Botão `⚡ Modo Cápsula (36px)` / `Ver 12 Meses` que transforma a barra em uma cápsula de apenas 36-38px de altura com selo da opção (`👑 Opção 01`), contador de dias livres (`🔥 42d Livres (+12d)`), sparkline de 12 micro-pontos pulsantes e chips das parcelas, liberando mais de 85% do espaço vertical de rolagem da tela.
* **Meses com Férias:** Destaque com gradiente solar tropical, borda dourada e etiquetas em linha única (**`1ª Parcela`**, **`2ª Parcela`**, **`3ª Parcela`**).
* **Meses sem Férias:** Micro-indicador discreto de feriados do mês (`X feriados`) e barra estritamente proporcional aos dias exatos de cada mês (`daysInMonth`), sem distorções visuais.

### 4. Curadoria em Top 5 com Expansão até 10 Alternativas
* **Exibição Focada:** Inicialmente apresenta os **5 Melhores Cenários Estratégicos** (Campeã, Campeã Alternativa, Férias de Julho, Fim de Ano, e Divisões Clássicas).
* **Expansão Sob Demanda:** Botão expansor discreto permite revelar instantaneamente mais 5 alternativas sazonais (totalizando até 10 opções calibradas pela Fronteira de Pareto).

### 5. Itinerários em Formato "Linear Boarding Pass"
* Estrutura horizontal limpa de 3 colunas direcionais com setas de transição executiva:
  $$\text{🛫 1º DIA LIVRE REAL} \quad \longrightarrow \quad \text{📋 PERÍODO NO SIGRH (10d)} \quad \longrightarrow \quad \text{💼 VOLTA AO TRABALHO}$$
* Identificação clara do primeiro dia útil de retorno ao expediente e selo de segurança contra indeferimento pelo RH.

### 6. Exportação Corporativa de Resumo em Tabela HTML (SEI-UFBA / Word / E-mail)
* O botão **Copiar Resumo de Férias** transfere simultaneamente para a área de transferência uma tabela formatada em HTML corporativo (com cabeçalhos escuros, bordas nítidas e totais consolidados) e texto simples, pronta para ser colada diretamente em processos do SEI-UFBA, documentos do Microsoft Word / LibreOffice e e-mails institucionais.

### 7. Mais de 30 Roteiros Temáticos com Identidade Púrpura Nobre
* Cada combinação gerada recebe automaticamente uma tag temática calculada a partir dos seus feriados reais, com estilo exclusivo em **Púrpura Nobre** (`bg-purple-100 text-purple-950 border border-purple-300`):
  * `🎭 Tríade de Ouro • Carnaval, São João e Fim de Ano`
  * `🌴 Verão & Independência • Carnaval e 2 de Julho`
  * `💼 Super Novembro do Servidor • 3 Feriados Alavancados`
  * `🎄 Turma de Natal • Ceia em Família e Recesso MGI`
  * `🎆 Turma de Réveillon • Virada de Ano e Recesso MGI`
  * `🌊 Ritmo Anti-Fadiga • 3 Grandes Recargas Espaçadas`
  * `⚖️ Semestral Clássico • 2 Grandes Descansos Equilibrados`
  * `☀️ Cota Integral de Verão • 30d Contínuos de Descanso`

### 8. Mini-Calendários 7xN com Preenchimento Contínuo e Bordas Semânticas
* **Fundo contínuo de férias:** Todas as caixas de férias recebem preenchimento escuro unificado (`bg-slate-900 text-white`).
* **Bordas grossas distintivas (3px):**
  * 🟡 **Feriado Oficial:** Dourado Âmbar (`border-amber-400`).
  * 🔵 **Ponto Facultativo / Recesso MGI:** Azul Celeste (`border-blue-400`).
  * 🟣 **Fim de Semana (Sáb/Dom):** Índigo Suave (`border-indigo-400`), 100% desacoplado do azul.
  * 🟢 **Retorno ao Trabalho:** Esmeralda (`bg-emerald-600 border-emerald-500`).

### 9. Comparador Desacoplado (Dock Flutuante + Slide-Over Drawer)
* **Dock Flutuante Inferior:** Surge no rodapé ao selecionar opções para comparação (até 3 simultâneas), com chips rápidos, contador em tempo real e botão de limpeza.
* **Painel Deslizante Lateral (Slide-Over Drawer):** Abre suavemente sem interromper a navegação principal, permitindo contraste analítico direto entre as opções:
  * Dias Livres Contínuos (com destaque na melhor pontuação);
  * Dias de Repouso Semanal (Sáb/Dom) absorvidos;
  * Alavancagem e Ganho Líquido (+Xd);
  * Feriados e Pontes Oficiais emendados por etapa;
  * Intervalos de Dias de Trabalho (Combate à Fadiga) entre etapas;
  * Botão de cópia rápida do comparativo para a área de transferência.
* **Design Limpo e Autônomo:** Sem botões de decisão invasivos ("Adotar") e sem tags temáticas dentro do painel, garantindo foco 100% técnico para o servidor.

### 10. PWA Offline-First (Progressive Web App)
* **Instalável:** Suporte nativo para adição à tela inicial em dispositivos móveis e desktops através do manifesto e prompt guiado.
* **100% Funcional Sem Internet:** Service Worker com estratégia Cache-First dinâmico para todos os scripts, fontes e folhas de estilo.

### 11. Janela Temporal Personalizada e Períodos a Evitar (Ponto 2)
* **Alcance de 1 ou 2 Anos (Art. 77 Lei 8.112/90):** Permite iniciar a busca em data arbitrária (ex.: `03/05/2027`) e projetar o usufruto ao longo de 1 Ano (12 meses) ou 2 Anos (24 meses), cobrindo acúmulo legal de até 2 exercícios.
* **Períodos a Evitar (Opcional):** Inserção simples de intervalos com colegas de férias ou projetos em andamento, descartando essas datas da escolha sem presets rígidos.
* **Buffer Dinâmico de DP & Fita Panorâmica:** Matriz combinatória com buffer estendido (`maxDay = totalWindowDays + offset + 140`) suportando janelas de até 24 meses sem perda de candidatos tardios.
* **Zero Falsa Equivalência:** Contagem escopada de feriados sincronizada estritamente com a janela temporal ativa.

### 12. Agregador de Passagens de Férias & Gamificação (v3.4.0)
* **Filtros Rápidos de Rotas:** Pílulas táteis no topo dos resultados (`Todas as Opções`, `👑 Top 3 Melhores`, `🏖️ Férias de Julho`, `🎄 Fim de Ano`, `⚖️ 10+10+10`, `🎯 Desperdício Zero`) no padrão dos grandes buscadores de voos.
* **Mini-Rota de Voo em Linha Única:** Rota visual compacta no card (`Rota: 🛫 Jan: 10d ➔ 🛫 Jun: 10d ➔ 🛫 Dez: 10d ➔ 51d livres`), evitando poluição de badges e focando no itinerário.
* **Memória do Navegador (`localStorage`):** Salva automaticamente as preferências do servidor (cota, exercício, lotação, parcelamento, jornada e restrições) para que o sistema já abra configurado.
* **Cartão de Embarque Oficial de Férias:** Pop-up gamificado em formato de bilhete de companhia aérea, com código de barras, trechos, conexões e validação legal.
* **Compartilhamento para WhatsApp:** Mensagem comemorativa com emojis festivos formatada para envio imediato à família, amigos ou cônjuge.

---

## 📁 Arquitetura do Projeto

```
folga-extra/
├── js/
│   ├── holidays.js       # Calendário astronômico multi-ano (Computus), parsing ISO blindado e feriados MGI/UFBA
│   ├── optimizer.js      # Motor matemático de Programação Dinâmica multi-ano, buffer adaptativo e exclusão de períodos
│   ├── ribbon.js         # Motor da Fita Anual do Tempo dinâmica (panorama contínuo de meses sincronizado e modo compacto)
│   ├── mini-calendar.js  # Renderizador de grade mensal 7xN com bordas de destaque
│   ├── tags.js           # Motor de 30+ roteiros temáticos e arquétipos culturais/sazonais
│   ├── render.js         # Motor desacoplado de renderização de componentes, cards e tabela SEI
│   └── app.js            # Controlador reativo da interface, toasts, janela personalizada e estado global
├── icons/
│   └── icon.svg          # Ícone vetorial oficial PWA
├── manifest.json         # Manifesto PWA para instalação no celular e desktop
├── sw.js                 # Service Worker (Estratégia Cache-First para funcionamento 100% offline)
├── index.html            # Estrutura HTML semântica com Tailwind CDN e ícones Lucide
├── test_suite.js         # Bateria de 33 testes automatizados de regras de negócio
├── GUIA_CORES_SISTEMA.md # Inventário e auditoria exaustiva de todas as 8 famílias de cores
├── REGRAS_ALGORITMO.md   # Fonte única da verdade das regras jurídicas e matemáticas
└── README.md             # Este documento
```

---

## 🧪 Bateria de Testes Automatizados (Runner com Flags)

Para garantir que nenhuma alteração de layout ou interface quebre a precisão dos cálculos jurídicos e matemáticos, o projeto conta com uma suíte de testes rigorosa executada via Node.js nativo (sem dependências externas):

```bash
# Execução completa (todas as suítes - 33 testes)
node test_suite.js

# Execuções focadas e ultrarrápidas por domínio:
node test_suite.js --core     # Regras jurídicas, computus e motor matemático (24 testes)
node test_suite.js --ui       # Componentes visuais, Fita Anual, Calendários, PWA e Comparador (7 testes)
node test_suite.js --tags     # Motor do catálogo de 30+ Roteiros Temáticos (1 teste)
node test_suite.js --colors   # Linter de Integridade do Guia de Cores / Design System (1 teste)
```

### Resultados Validados (33/33 Aprovados):
* ✅ **Teste 1:** Cálculo exato da Páscoa e Carnaval móveis
* ✅ **Teste 2:** Quinta-feira Santa NÃO deve constar como feriado (dia útil normal)
* ✅ **Teste 3:** 20 de Novembro (Consciência Negra) obrigatório por lei federal
* ✅ **Teste 4:** Feriados de Salvador/BA (São João, 2 de Julho, Conceição da Praia)
* ✅ **Teste 5:** Carnaval no Circuito UFBA (Quarta pré-Carnaval à Quarta de Cinzas)
* ✅ **Teste 6:** Lógica de enforcar pontes em terças e quintas-feiras
* ✅ **Teste 7:** Férias nunca iniciam em sábado, domingo ou feriado
* ✅ **Teste 8:** Retorno ao trabalho é obrigatoriamente um dia útil de trabalho
* ✅ **Teste 9:** Zero sobreposição entre períodos de férias gerados
* ✅ **Teste 10:** Presença garantida de 10+10+10 e 15+10+5 no ranking da Fronteira de Pareto
* ✅ **Teste 11:** Cálculo exato do multiplicador de Alavancagem
* ✅ **Teste 12:** Espaçamento mínimo saudável entre as etapas ($\ge 60$ dias)
* ✅ **Teste 13:** Detecção precisa de fim de período e flexibilidade sem travamentos
* ✅ **Teste 14:** Alocação proporcional de Banco de Horas sem inflacionar saldo
* ✅ **Teste 15:** Renderização panorâmica dos 12 meses na Fita Anual do Tempo
* ✅ **Teste 16:** Cálculo exato das semanas de recesso do MGI para qualquer ano
* ✅ **Teste 17:** Preservação estrita dos feriados nacionais (25/Dez e 01/Jan)
* ✅ **Teste 18:** Injeção de Recesso MGI e vésperas sem duplicidade de datas
* ⚖️ **Teste 19:** Otimizador respeita recesso MGI e não gasta férias em dias de recesso
* 🏷️ **Teste 20:** Motor de 30+ Roteiros Temáticos e Paleta Púrpura Nobre (Opção B)
* 🎨 **Teste 21:** Proporcionalidade exata da Fita Anual por dias reais do mês (`daysInMonth`)
* 🎨 **Teste 22:** Desacoplamento de cores no Mini-Calendário (Índigo-400 para Fins de Semana)
* 🎨 **Teste 23:** Estrutura do Itinerário Boarding Pass e Segurança de Retorno
* 👁️ **Teste 24:** Linter Automatizado de Integridade do Guia de Cores (Design System)
* ⚖️ **Teste 25:** Flexibilidade de Parcelamento a partir de 1 dia (Lei 8.112/90) e Cotas de 1 a 30 dias
* ⚖️ **Teste 26:** Contagem Escopada de Feriados no Cockpit e Não-Duplicação de Vésperas (Zero Falsa Equivalência)
* 🎨 **Teste 27:** Auditoria de Integridade e Conformidade PWA (Offline-First)
* 🎨 **Teste 28:** Validação Arquitetural do Comparador Desacoplado (Dock Flutuante + Drawer)
* ⚖️ **Teste 29:** Janela Interanual e Escopo de Busca (1 e 2 Anos - Art. 77 Lei 8.112/90)
* ⚖️ **Teste 30:** Exclusão Estrita de Períodos a Evitar (Colegas / Projetos / Bloqueios)
* 🎨 **Teste 31:** Interface Reativa, Fita Panorâmica e Contagem Escopada de Feriados (Ponto 2)
* ⚖️ **Teste 32:** Robustez de Parsing ISO, Exclusão Estrita sem Falhas e Fita Dinâmica (Ponto 2 Reforçado)
* ⚖️ **Teste 33:** Penalização da Armadilha Pós-Cinzas (Inibição de parcelas $\le 3$d na Quinta/Sexta pós-Carnaval)

---

## 🎨 Guia Rápido da Paleta de Cores

| Família | Papel Semântico Principal | Amostra |
| :--- | :--- | :---: |
| **Âmbar Solar** | Feriados Oficiais, Carnaval e Pódio de Campeã | <span style="display:inline-block;width:14px;height:14px;background-color:#F59E0B;border-radius:3px;"></span> |
| **Azul / Sky** | Folgas Administrativas, Recesso MGI, Vésperas e Banco de Horas | <span style="display:inline-block;width:14px;height:14px;background-color:#0284C7;border-radius:3px;"></span> |
| **Esmeralda** | Dia Útil de Retorno e Métrica de Ganho Líquido (+Xd) | <span style="display:inline-block;width:14px;height:14px;background-color:#059669;border-radius:3px;"></span> |
| **Teal** | Marcador de Saúde Mental e Modo Combate à Fadiga | <span style="display:inline-block;width:14px;height:14px;background-color:#0D9488;border-radius:3px;"></span> |
| **Índigo** | Borda de Fim de Semana no Calendário e Regime Estatutário | <span style="display:inline-block;width:14px;height:14px;background-color:#818CF8;border-radius:3px;"></span> |
| **Púrpura** | **Exclusiva:** Tags de Roteiro e Estilo Temático das Opções | <span style="display:inline-block;width:14px;height:14px;background-color:#A855F7;border-radius:3px;"></span> |
| **Slate** | Preenchimento Escuro das Férias, Botões de Ação e Tipografia | <span style="display:inline-block;width:14px;height:14px;background-color:#0F172A;border-radius:3px;"></span> |

Consulte o inventário detalhado em [`GUIA_CORES_SISTEMA.md`](./GUIA_CORES_SISTEMA.md).

---

## 📄 Licença e Uso

Desenvolvido para servidores e servidoras da **Universidade Federal da Bahia (UFBA)** e demais órgãos públicos federais. Código aberto e 100% executável localmente sem necessidade de servidor de backend.

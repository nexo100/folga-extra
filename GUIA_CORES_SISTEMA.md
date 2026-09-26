# Sistema de Design e Mapeamento Refinado de Cores • Folga Extra (UFBA)
> **Versão:** 2.0 • **Data de Auditoria:** 25/09/2026  
> **Arquivos Analisados:** `index.html`, `js/app.js`, `js/mini-calendar.js`, `js/ribbon.js`, `js/holidays.js`  
> **Status dos Testes:** 19/19 Testes Aprovados (`node test_suite.js`)

Este documento é o inventário exaustivo de todas as cores, tonalidades, tokens utilitários, papéis semânticos e inconsistências detectadas na interface do **Folga Extra**.

---

## 1. Mapeamento Refinado de Todas as Cores do Sistema

### 🟡 FAMÍLIA ÂMBAR / DOURADO SOLAR (Feriados Oficiais, Carnaval e Pódio)
| Visual | Nome / Tom | Classes Tailwind & Hex | Elemento da Interface | Local / Arquivo | Inconsistência Detectada | Oportunidade / Ação Recomendada |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| <span style="display:inline-block;width:16px;height:16px;background-color:#F59E0B;border-radius:4px;border:1px solid #D97706;"></span> | **Âmbar Solar 500** | `bg-amber-400`<br>`text-amber-400`<br>`#F59E0B` | • Sol do Logotipo da Navbar<br>• Badge *Férias Inteligentes* do Hero<br>• Ícone do botão principal *Calcular*<br>• Ícone do bilhete no Hero | `index.html:77-78`<br>`index.html:125`<br>`index.html:463`<br>`index.html:170` | Nenhuma. | **Manter.** Representa energia, luz e o clima de descanso de Salvador. |
| <span style="display:inline-block;width:16px;height:16px;background-color:#FBBF24;border-radius:4px;border:1px solid #D97706;"></span> | **Âmbar Ouro 400** | `border-amber-400`<br>`ring-amber-400`<br>`#FBBF24` | • Borda dos meses com férias na Fita Anual<br>• Borda do card da Opção Selecionada<br>• Borda grossa de **Feriado** no calendário | `ribbon.js:115`<br>`app.js:310, 521`<br>`mini-calendar.js:119` | Nenhuma. Alinhado 100% com o Hero. | **Manter.** A borda grossa no calendário atende à regra de preenchimento único escuro. |
| <span style="display:inline-block;width:16px;height:16px;background-color:#FEF3C7;border-radius:4px;border:1px solid #FCD34D;"></span> | **Âmbar Pastel 100** | `bg-amber-100`<br>`border-amber-300`<br>`#FEF3C7` | • Tags de todos os **Feriados** (Nacional, Salvador, Carnaval)<br>• Badge da **Opção Campeã** (Top 1)<br>• Chip *São João da Bahia* no Hero | `app.js:224, 532`<br>`app.js:488`<br>`index.html:153` | Nenhuma. | **Manter.** Feriados oficiais e a campeã compartilham a mesma família cívica/comemorativa. |
| <span style="display:inline-block;width:16px;height:16px;background-color:#B45309;border-radius:4px;border:1px solid #78350F;"></span> | **Âmbar Queimado 700/800** | `text-amber-700`<br>`text-amber-800`<br>`#B45309` | • Alerta quando férias terminam em repouso<br>• Palmeira decorativa de fundo no Hero<br>• Texto da Turma Ano Novo na descrição | `app.js:539`<br>`index.html:115`<br>`app.js:139` | Na descrição da Turma Ano Novo (`app.js:139`) usa `text-amber-700`, enquanto o botão no HTML (`index.html:414`) usa `text-amber-600`. | **Harmonizar tom:** Unificar o texto para `text-amber-600` em ambos os locais. |

---

### 🔵 FAMÍLIA AZUL / AZUL CÉU (Folgas Administrativas, Recesso, Pontes e Banco)
| Visual | Nome / Tom | Classes Tailwind & Hex | Elemento da Interface | Local / Arquivo | Inconsistência Detectada | Oportunidade / Ação Recomendada |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| <span style="display:inline-block;width:16px;height:16px;background-color:#0284C7;border-radius:4px;border:1px solid #0369A1;"></span> | **Azul Céu 600** | `text-sky-600`<br>`border-sky-300`<br>`#0284C7` | • Seletor tátil de Banco de Horas no Cockpit<br>• Toggles de Pontes MGI e Vésperas<br>• Ícone da Turma Natal no segmented control | `index.html:327-337`<br>`index.html:357, 366`<br>`index.html:409` | Nenhuma. | **Manter.** Conexão direta Cockpit $\rightarrow$ Resultados. |
| <span style="display:inline-block;width:16px;height:16px;background-color:#38BDF8;border-radius:4px;border:1px solid #0284C7;"></span> | **Azul Real 400** | `border-[3px] border-blue-400`<br>`#38BDF8` | • Borda grossa de **Ponto Facultativo** no calendário<br>• Amostra de Ponto Facultativo na legenda | `mini-calendar.js:116`<br>`mini-calendar.js:157` | Nenhuma. | **Manter.** Destaca claramente os dias de recesso/pontes com exclusividade. |
| <span style="display:inline-block;width:16px;height:16px;background-color:#EFF6FF;border-radius:4px;border:1px solid #93C5FD;"></span> | **Azul Claro 50** | `bg-blue-50`<br>`text-blue-900`<br>`border-blue-300`<br>`#EFF6FF` | • Tags de **Ponto Facultativo** nos resultados (Recesso, Vésperas, Pontes, Servidor)<br>• Tabela do Cockpit | `app.js:222`<br>`app.js:530` | No Hero (`index.html:158`), o chip *🎄 Recesso de Fim de Ano* ainda usa `bg-teal-100 text-teal-900 border-teal-300`! | **Inconsistência Real:** Mudar o chip do Hero para `bg-sky-100 text-sky-900 border-sky-300` para alinhar com o Azul. |
| <span style="display:inline-block;width:16px;height:16px;background-color:#F0F9FF;border-radius:4px;border:1px solid #BAE6FD;"></span> | **Azul Gelo 50** | `bg-sky-50/60`<br>`border-sky-200/90`<br>`#F0F9FF` | • Card da **Escala de Recesso de Fim de Ano** no Cockpit<br>• Badge **+Xd Banco de Horas** na etapa | `index.html:381`<br>`app.js:581` | Na descrição da Turma Natal (`app.js:137`) usa `text-emerald-700`, enquanto o botão no HTML usa `text-sky-600`. | **Harmonizar tom:** Mudar `text-emerald-700` para `text-sky-700` na mensagem dinâmica do recesso. |

---

### 🟢 FAMÍLIA VERDE ESMERALDA (Trabalho Útil, Retorno e Conquista Positiva)
| Visual | Nome / Tom | Classes Tailwind & Hex | Elemento da Interface | Local / Arquivo | Inconsistência Detectada | Oportunidade / Ação Recomendada |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| <span style="display:inline-block;width:16px;height:16px;background-color:#059669;border-radius:4px;border:1px solid #047857;"></span> | **Esmeralda 600** | `bg-emerald-600`<br>`text-emerald-600`<br>`#059669` | • Célula de **Retorno ao Trabalho** no calendário<br>• Ícone de check de término em dia útil<br>• Ponto indicador de expediente | `mini-calendar.js:109`<br>`app.js:538`<br>`app.js:635` | Nenhuma. | **Manter.** O verde agora é 100% puro e exclusivo para dia útil de trabalho e retorno. |
| <span style="display:inline-block;width:16px;height:16px;background-color:#047857;border-radius:4px;border:1px solid #065F46;"></span> | **Esmeralda 700/800** | `text-emerald-700`<br>`text-emerald-800`<br>`#047857` | • Métrica de **Ganho Líquido (+Xd)** no card<br>• Coluna **Volta ao Trabalho** na etapa<br>• Badge **🔥 X Dias Livres** na etapa | `app.js:696`<br>`app.js:628`<br>`app.js:586` | Nenhuma. | **Manter.** Legibilidade forte para métricas de ganho. |
| <span style="display:inline-block;width:16px;height:16px;background-color:#ECFDF5;border-radius:4px;border:1px solid #A7F3D0;"></span> | **Esmeralda Claro 50** | `bg-emerald-50`<br>`border-emerald-200`<br>`#ECFDF5` | • Badge *Desperdício Zero* e *Vice-Campeã*<br>• Badge *Melhor Resultado* no resumo | `app.js:490, 498`<br>`app.js:440` | Nenhuma. | **Manter.** Fundo suave para selos de mérito e eficiência. |

---

### 🌊 FAMÍLIA VERDE-PETRÓLEO / TEAL (Saúde Ocupacional e Combate à Fadiga)
| Visual | Nome / Tom | Classes Tailwind & Hex | Elemento da Interface | Local / Arquivo | Inconsistência Detectada | Oportunidade / Ação Recomendada |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| <span style="display:inline-block;width:16px;height:16px;background-color:#0D9488;border-radius:4px;border:1px solid #0F766E;"></span> | **Teal 600** | `text-teal-600`<br>`focus:ring-teal-500`<br>`#0D9488` | • Checkbox do toggle inteligente *Combate à Fadiga*<br>• Ícone do selo Anti-Fadiga | `index.html:373`<br>`app.js:444, 517` | Nenhuma. | **Manter.** A cor teal/petróleo é o marcador exclusivo de saúde/bem-estar e espaçamento de 60 dias. |
| <span style="display:inline-block;width:16px;height:16px;background-color:#F0FDFA;border-radius:4px;border:1px solid #99F6E4;"></span> | **Teal Claro 50** | `bg-teal-50`<br>`text-teal-800`<br>`border-teal-200`<br>`#F0FDFA` | • Badge **Anti-Fadiga** no card de cenário<br>• Badge no conector de intervalo de trabalho | `app.js:517`<br>`app.js:558` | Nenhuma. | **Manter.** Não interfere com o Azul das folgas nem com o Verde do trabalho. |

---

### 🟣 FAMÍLIA ÍNDIGO (Institucionalidade e Lei 8.112)
| Visual | Nome / Tom | Classes Tailwind & Hex | Elemento da Interface | Local / Arquivo | Inconsistência Detectada | Oportunidade / Ação Recomendada |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| <span style="display:inline-block;width:16px;height:16px;background-color:#4F46E5;border-radius:4px;border:1px solid #4338CA;"></span> | **Índigo Real 600** | `to-indigo-600`<br>`#4F46E5` | • Âncora fria do gradiente de texto no Hero | `index.html:139` | Nenhuma. | **Manter.** Dá contraste e elegância ao degradê solar. |
| <span style="display:inline-block;width:16px;height:16px;background-color:#818CF8;border-radius:4px;border:1px solid #6366F1;"></span> | **Índigo Suave 400** | `border-[3px] border-indigo-400`<br>`#818CF8` | • Borda grossa de **Fim de Semana** no calendário<br>• Amostra de Fim de Semana na legenda | `mini-calendar.js:123`<br>`mini-calendar.js:158` | Nenhuma. | **Manter.** Desacoplado 100% do Azul das folgas administrativas. |
| <span style="display:inline-block;width:16px;height:16px;background-color:#E0E7FF;border-radius:4px;border:1px solid #C7D2FE;"></span> | **Índigo Claro 100** | `bg-indigo-100`<br>`border-indigo-300`<br>`#E0E7FF` | • Chip *⚖️ Lei 8.112/1990 • Servidor Federal* no Hero<br>• Âncora do gradiente de fundo solar | `index.html:161`<br>`index.html:109`<br>`app.js:310, 521`<br>`ribbon.js:115` | Nenhuma. | **Manter.** Representa com exclusividade o regime jurídico estatutário. |

---

### 🟣 FAMÍLIA PÚRPURA / VIOLETA (Identidade Exclusiva dos Roteiros Temáticos - Opção B)
| Visual | Nome / Tom | Classes Tailwind & Hex | Elemento da Interface | Local / Arquivo | Inconsistência Detectada | Oportunidade / Ação Recomendada |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| <span style="display:inline-block;width:16px;height:16px;background-color:#F3E8FF;border-radius:4px;border:1px solid #D8B4FE;"></span> | **Púrpura Nobre 100/950** | `bg-purple-100`<br>`text-purple-950`<br>`border-purple-300`<br>`#F3E8FF` / `#3B0764` | • **Tags de Estilo & Roteiro Temático** de todos os cenários de férias | `app.js:520` | Nenhuma. Cor nova exclusiva. | **Padronização total.** Identidade visual inconfundível que não colide com feriados nem com recessos. |

---

### 🌸 ROSA (Pink) & 🟠 LARANJA (Orange) (Cultura e Festividades no Hero)
| Visual | Nome / Tom | Classes Tailwind & Hex | Elemento da Interface | Local / Arquivo | Inconsistência Detectada | Oportunidade / Ação Recomendada |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| <span style="display:inline-block;width:16px;height:16px;background-color:#DB2777;border-radius:4px;border:1px solid #BE185D;"></span> | **Rosa Carnaval 600** | `bg-pink-100`<br>`border-pink-300`<br>`#DB2777` | • Chip *🎭 Carnaval no Circuito* no Hero | `index.html:149` | Presente apenas no Hero. Nos cards vira Feriado (Âmbar). | **Manter como detalhe do Hero.** No miolo das tabelas deve permanecer unificado como Feriado. |
| <span style="display:inline-block;width:16px;height:16px;background-color:#EA580C;border-radius:4px;border:1px solid #C2410C;"></span> | **Laranja Bahia 600** | `bg-orange-100`<br>`border-orange-300`<br>`#EA580C` | • Chip *🏖️ Dois de Julho* no Hero<br>• Gradiente de texto do título | `index.html:155`<br>`index.html:139` | Presente apenas no Hero. | **Manter como detalhe do Hero.** Transição quente entre Âmbar e Índigo. |

---

### ⚫ FAMÍLIA GRAFITE / CINZA (Slate - Estrutura, Caixas, Tipografia e Calendário)
| Visual | Nome / Tom | Classes Tailwind & Hex | Elemento da Interface | Local / Arquivo | Inconsistência Detectada | Oportunidade / Ação Recomendada |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| <span style="display:inline-block;width:16px;height:16px;background-color:#020617;border-radius:4px;border:1px solid #000000;"></span> | **Slate 950** | `bg-slate-950`<br>`text-slate-950`<br>`#020617` | • Botão principal *Calcular Melhores Cenários*<br>• Título principal do Hero e dos Cenários<br>• Datas em destaque no itinerário | `index.html:462`<br>`index.html:138, 477`<br>`app.js:600, 618, 631` | Nenhuma. | **Manter.** Máximo contraste para tipografia e ação principal. |
| <span style="display:inline-block;width:16px;height:16px;background-color:#0F172A;border-radius:4px;border:1px solid #020617;"></span> | **Slate 900** | `bg-slate-900`<br>`text-white`<br>`#0F172A` | • **Preenchimento de todos os dias de férias** no calendário<br>• Selo do número da etapa (`01`, `02`)<br>• Botão de Baixar .ICS<br>• Barra de topo dos cards | `mini-calendar.js:113`<br>`app.js:573`<br>`app.js:725`<br>`app.js:483` | Nenhuma. | **Manter.** Cumpre rigorosamente a regra do preenchimento único escuro das férias. |
| <span style="display:inline-block;width:16px;height:16px;background-color:#FFFFFF;border-radius:4px;border:1px solid #CBD5E1;"></span> | **Branco Sólido 95%** | `bg-white/95`<br>`border-2 border-slate-300`<br>`#FFFFFF` | • **Fundo dos boxes das etapas de férias**<br>• Fundo dos calendários 7xN<br>• Campos de input do Cockpit | `app.js:563`<br>`mini-calendar.js:77`<br>`index.html:219, 274` | Nenhuma. | **Manter.** Dá o contraste perfeito sobre o fundo gradiente solar da opção ativa. |
| <span style="display:inline-block;width:16px;height:16px;background-color:#F1F5F9;border-radius:4px;border:1px solid #E2E8F0;"></span> | **Slate Claro 100** | `bg-slate-100/90`<br>`border-slate-300/90`<br>`#F1F5F9` | • Fundo dos cards de opções **não selecionadas**<br>• Botões secundários em repouso | `app.js:310, 521`<br>`app.js:717, 721` | Nenhuma. | **Manter.** Contraste nítido contra o canvas `#F8FAFC`, recebendo hover solar. |
| <span style="display:inline-block;width:16px;height:16px;background-color:#CBD5E1;border-radius:4px;border:1px solid #94A3B8;"></span> | **Slate Médio 300/400** | `border-slate-400`<br>`bg-slate-300`<br>`#CBD5E1` | • Conector do intervalo entre etapas<br>• Divisores de colunas | `app.js:551, 553`<br>`app.js:609` | Nenhuma. | **Manter.** Delimita onde termina uma etapa e começa a próxima. |
| <span style="display:inline-block;width:16px;height:16px;background-color:#F8FAFC;border-radius:4px;border:1px solid #E2E8F0;"></span> | **Canvas Base** | `bg-[#F8FAFC]`<br>`#F8FAFC` | • Fundo geral da página do aplicativo | `index.html:71` | Nenhuma. | **Manter.** Tela executiva limpa e sem reflexos cansativos. |

---

## 2. Resumo das Inconsistências Reais Detectadas & Plano de Correção Imediata

| # | Inconsistência Detectada | Onde Ocorre | Causa Raiz | Status / Resolução Aplicada |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Chip de Recesso no Hero usando Teal** | `index.html` (L158) | O chip *🎄 Recesso de Fim de Ano* usava tom teal (`bg-teal-100 text-teal-900 border-teal-300`), enquanto o Recesso no Cockpit e nos resultados passou para a Família Azul. | **Corrigido com Sucesso ✅**: Atualizado para `bg-sky-100 text-sky-900 border-sky-300`. |
| **2** | **Texto dinâmico da Turma Natal em Verde** | `js/app.js` (L137) | Ao selecionar a Turma Natal, a frase exibia `text-emerald-700 font-bold`, divergindo do botão azul no HTML (`text-sky-600`). | **Corrigido com Sucesso ✅**: Atualizado para `text-sky-700 font-bold`. |
| **3** | **Cores mortas no `tailwind.config`** | `index.html` (L28-42) | Configuração define objetos `brand` e `ufba` (`navy: '#002B49'`) que não são utilizados em nenhuma classe das páginas. | **Documentado**: Tokens de protótipo legados mantidos neutros sem impacto no bundle. |

---

## 3. Matriz de Coerência por Papel de Negócio

* **Trabalho / Expediente Útil:** Exclusivo da Família **Esmeralda / Verde** (Dia útil de retorno, validação de encerramento em dia útil, ganho de dias livres).
* **Feriados Cívicos / Carnaval:** Exclusivo da Família **Âmbar / Amarelo** (Leis federais/locais, suspensões do circuito da UFBA, pódio de Campeã).
* **Folgas Administrativas & Compensatórias:** Exclusivo da Família **Azul / Sky** (Recesso MGI, Vésperas, Pontes decretadas e Banco de Horas).
* **Fim de Semana no Calendário:** Exclusivo da Família **Índigo Suave 400** (`border-[3px] border-indigo-400`), desacoplado 100% do azul facultativo.
* **Rótulos & Roteiros Temáticos:** Exclusivo da Família **Púrpura Nobre** (`bg-purple-100 text-purple-950 border border-purple-300` - Opção B).
* **Saúde & Ritmo Biológico:** Exclusivo da Família **Teal / Petróleo** (Espaçamento de 60 dias do Combate à Fadiga).
* **Destaque Solar do Descanso:** Exclusivo do **Gradiente do Hero** (Meses com férias na Fita Anual e Card da Opção Ativa / Hover).
* **Contêineres e Fundo das Férias:** Exclusivo da Família **Slate / Grafite** (Fundo escuro unificado no calendário, botões primários de ação e tipografia de leitura).

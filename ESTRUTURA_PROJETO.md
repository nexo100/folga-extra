# 🗺️ MAPA MESTRE E ESTRUTURA DO PROJETO FOLGA EXTRA
> **Papel deste Documento:** Hub central de referência do projeto.  
> **Localização Física Oficial:** `C:\Users\nexo\github\folga-extra`  
> **Repositório GitHub:** `https://github.com/nexo100/folga-extra`  
> **Estado de Qualidade:** 33 / 33 Testes Aprovados (100% Green)

---

## 🔗 HISTÓRICO DE CONVERSAS VINCULADAS

| Conversa | ID | Papel no Ciclo de Vida |
| :--- | :--- | :--- |
| [🔗 **Conversa 1: Análise e Reprodução de Site**](conversation://f1f763d6-076e-4543-a905-f0eaa0736efd) | `f1f763d6-076e-4543-a905-f0eaa0736efd` | Concepção, regras da Lei 8.112/90, Cockpit, Comparador, PWA, buffer de DP e blindagem de segurança. |
| [🔗 **Conversa 2: Retomada e Próximos Passos**](conversation://1c2a3b0a-fa69-4089-a588-81fff2b16f3c) | `1c2a3b0a-fa69-4089-a588-81fff2b16f3c` | Validação de ambiente, auditoria dos 32 testes e preparação dos índices estruturais. |

---

## 📂 ÁRVORE COMPLETA DE DIRETÓRIOS E ARQUIVOS

```text
C:\Users\nexo\github\folga-extra\
│
├── 📄 index.html                     # Interface SPA completa: Cockpit (3 Cards), Fita Anual, Cards de Cenário, Dock & Drawer
├── 📄 sw.js                           # Service Worker PWA (Offline-First, Cache-First para fontes, Tailwind CDN e JS locais)
├── 📄 manifest.json                   # Manifesto PWA com metadados para instalação desktop e mobile
├── 📄 test_suite.js                   # Bateria de 33 testes automatizados (Core, UI, Tags, Design Linter)
│
├── 📁 js/                             # Módulos JavaScript (Vanilla ES6, Zero dependências de build)
│   ├── 📄 app.js                      # Orquestrador do estado global, reatividade, filtros e chamadas ao otimizador
│   ├── 📄 holidays.js                 # Algoritmo Meeus/Computus astronômico, feriados de Salvador/UFBA e escala MGI
│   ├── 📄 optimizer.js                # Motor de Programação Dinâmica, Pareto multiobjetivo, janela 1/2 anos e exclusões
│   ├── 📄 ribbon.js                   # Motor gráfico da Fita Anual do Tempo dinâmica e mini-barras proporcionais
│   ├── 📄 mini-calendar.js            # Renderizador da grade 7xN com bordas semânticas desacopladas
│   └── 📄 tags.js                     # Motor de catalogação e 30+ arquétipos temáticos (Púrpura Nobre)
│
├── 📁 icons/                          # Ativos gráficos e ícones
│   └── 📄 icon.svg                    # Ícone vetorial oficial SVG para PWA e favicon
│
├── 📁 .agents/                        # Governança mecânica e interceptadores de segurança (Camada 2)
│   ├── 📄 hooks.json                  # Registro do lifecycle hook PreToolUse
│   ├── 📄 security_gate.js            # Script que bloqueia túneis, 0.0.0.0 e consultas a IPs públicos
│   └── 📁 rules/                      # Regras locais persistentes (Camada 3)
│       └── 📄 security.md             # Diretrizes estritas de confinamento e privacidade
│
├── 📄 STATUS_PROJETO.md               # Resumo executivo de handoff entre conversas e decisões arquiteturais
├── 📄 ESTRUTURA_PROJETO.md            # Este mapa mestre ("Link Simbólico") com todas as referências
├── 📄 REGRAS_ALGORITMO.md             # Fonte única da verdade das fórmulas matemáticas e Lei 8.112/90
├── 📄 GUIA_CORES_SISTEMA.md           # Design System oficial com inventário e hexadecimais das 8 famílias de cores
├── 📄 GEMINI.md                       # Regras mandatórias locais do agente para o projeto
└── 📄 README.md                       # Documentação pública e manual de execução de testes
```

---

## 🛡️ DIRETRIZES DE SEGURANÇA E GOVERNANÇA (3 CAMADAS)

1. **Camada 1 (Settings Nativas):** Confinamento ao workspace (`Non-Workspace File Access: Ask/Deny`).
2. **Camada 2 (Lifecycle Hooks):** Bloqueio mecânico imediato (`security_gate.js` em `.agents/` e em `~/.gemini/config/`) para comandos de tunelamento (`ngrok`, `localtunnel`, `serveo`, `cloudflared`, `ipify`, binding `0.0.0.0`).
3. **Camada 3 (Rules Persistentes):** Arquivos `GEMINI.md` e `.agents/rules/security.md` no workspace e na configuração global.

---

## 🧪 COMANDOS DE TESTE E AUDITORIA

* **Execução Geral:** `node test_suite.js` *(33/33 asserções aprovadas)*
* **Por Domínio:**
  * `node test_suite.js --core` *(24 testes: regras jurídicas e motor de DP)*
  * `node test_suite.js --ui` *(7 testes: Fita, Calendário, Comparador, PWA)*
  * `node test_suite.js --tags` *(1 teste: arquétipos temáticos)*
  * `node test_suite.js --colors` *(1 teste: linter do Design System)*
* ⚠️ **Atenção:** Jamais execute a ferramenta `view_file` diretamente no arquivo `test_suite.js`.

---

## 📋 PROMPT SUGERIDO PARA A CONVERSA DE REFERÊNCIA / ÍNDICE

> *"Esta conversa funcionará como o **Hub de Referência e Link Simbólico** do projeto Folga Extra. Carregue o mapa estrutural a partir de @ESTRUTURA_PROJETO.md, @STATUS_PROJETO.md e mantenha a referência à conversa de origem @conversation://f1f763d6-076e-4543-a905-f0eaa0736efd. Não faça modificações de código nesta conversa; ela servirá como guardiã da arquitetura e das referências."*

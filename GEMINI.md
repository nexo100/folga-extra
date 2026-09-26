# DIRETRIZES E REGRAS MANDATÓRIAS DO PROJETO FOLGA EXTRA

## 1. POLÍTICA DE SEGURANÇA, REDE E PRIVACIDADE (ESTRITA E PERMANENTE)
- **Proibição Absoluta de Ferramentas de Tunelamento**: É terminantemente proibido instalar, iniciar ou sugerir o uso de ferramentas de tunelamento reverso ou exposição pública de rede, tais como `localtunnel`, `ngrok`, `cloudflared`, `serveo`, `pagekite`, `bore`, `pinggy` ou equivalentes.
- **Proibição de Descoberta de IP Público**: É estritamente proibido realizar chamadas HTTP ou executar comandos que consultem serviços externos para descobrir o IP público da máquina (ex: `ipify`, `ifconfig.me`, `icanhazip`, `ipinfo.io`).
- **Isolamento de Rede Local**: O agente não tem permissão para abrir portas expostas em `0.0.0.0` (todas as interfaces). Qualquer servidor de teste local deve ser estritamente vinculado a `127.0.0.1` ou `localhost`, e SOMENTE se expressamente solicitado pelo usuário.
- **Confinamento de Diretório**: Toda e qualquer operação de leitura, escrita, busca ou inspeção deve permanecer confinada a este repositório (`C:\Users\nexo\github\folga-extra`). O agente NUNCA deve vasculhar, listar ou acessar pastas pessoais do usuário, Documentos, Desktop, Downloads ou outros projetos sem ordem explícita.
- **Zero Ações Paralelas Ocultas**: Nenhuma tarefa em segundo plano, processo daemon ou chamada de rede externa pode ser iniciada sem autorização prévia e explicação detalhada do que será feito.

## 2. DIRETRIZES TÉCNICAS E DE DESEMPENHO DO PROJETO
- **Integridade da Suíte de Testes**: A suíte de testes automatizados (`test_suite.js`) é a guardiã do sistema. Todas as 32 asserções devem permanecer 100% aprovadas a cada alteração.
- **Regra Crítica de Desempenho**: NUNCA execute a ferramenta `view_file` diretamente no arquivo `test_suite.js`. Use scripts de teste pontuais ou edições cirúrgicas se necessário.
- **Fidelidade Arquitetural**: Manter a consistência com as regras da Lei 8.112/90 descritas em `REGRAS_ALGORITMO.md` e a paleta de cores corporativa documentada em `GUIA_CORES_SISTEMA.md`.

## 3. SINCRONIZAÇÃO GIT E REPOSITÓRIO GITHUB
1. Sempre que finalizar com sucesso um pedido do usuário (nova funcionalidade, ajuste visual, correção de bug ou criação de script), e após testar/validar que o código está estável (32/32 testes aprovados):
   - Crie um commit claro no Git (ex: `feat: ...`, `fix: ...`, `chore: ...`).
   - Execute `git push origin main` para manter o GitHub sincronizado.
2. Nunca execute commits ou push com código pela metade ou com testes falhando.
3. Mantenha arquivos de segredos (`.env`, chaves) sempre protegidos pelo `.gitignore`.


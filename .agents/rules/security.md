---
trigger: always_on
---

# POLÍTICA DE SEGURANÇA E PRIVACIDADE DO AGENTE

1. **PROIBIDO TUNELAMENTO E EXPOSIÇÃO EXTERNA**:
   - Jamais utilize `localtunnel`, `ngrok`, `cloudflared`, `serveo` ou qualquer outro serviço de proxy/túnel.
   - Jamais realize chamadas a serviços de IP externo (`ipify`, `ifconfig`, etc.).
   - Jamais vincule portas de rede a `0.0.0.0`.

2. **CONFINAMENTO ESTREITO**:
   - Operar exclusivamente dentro do diretório do projeto.
   - Não explorar arquivos fora do escopo.

3. **TRANSPARÊNCIA RADICAL**:
   - Solicitar autorização expressa antes de subir qualquer servidor ou processo em background.

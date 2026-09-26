#!/usr/bin/env node
/**
 * Interceptador Determinístico de Segurança - Antigravity PreToolUse Hook
 * Bloqueia mecanicamente ferramentas de tunelamento, exposição externa e vazamento de IP.
 */
const fs = require('fs');

try {
  const input = fs.readFileSync(0, 'utf-8');
  if (!input || !input.trim()) {
    console.log(JSON.stringify({ decision: 'allow' }));
    process.exit(0);
  }

  const payload = JSON.parse(input);
  const toolCall = payload.toolCall || {};
  const toolName = toolCall.name || '';
  const args = toolCall.args || {};

  // Se a ferramenta for run_command, inspecionar CommandLine
  if (toolName === 'run_command') {
    const cmd = (args.CommandLine || '').toLowerCase();

    // 1. Proibição de ferramentas de tunelamento e exposição de rede
    const forbiddenTunnels = [
      /\blt\b/,
      /\blocaltunnel\b/,
      /\bngrok\b/,
      /\bcloudflared\b/,
      /\bserveo\b/,
      /\bpagekite\b/,
      /\bteleconsole\b/,
      /\btmate\b/,
      /\bbore\b/,
      /\bpinggy\b/,
      /\bfrpc?\b/
    ];

    for (const pattern of forbiddenTunnels) {
      if (pattern.test(cmd)) {
        console.log(JSON.stringify({
          decision: 'deny',
          reason: `[HOOK DE SEGURANÇA BLOQUEOU]: Tentativa de executar ferramenta de tunelamento/exposição de rede (${pattern}). Ação expressamente proibida pela política de segurança.`
        }));
        process.exit(0);
      }
    }

    // 2. Proibição de descoberta de IP público e dados de rede externa
    const forbiddenIpEndpoints = [
      /ipify/,
      /ifconfig\.me/,
      /icanhazip/,
      /ipinfo\.io/,
      /checkip\.amazonaws/,
      /whatismyip/
    ];

    for (const pattern of forbiddenIpEndpoints) {
      if (pattern.test(cmd)) {
        console.log(JSON.stringify({
          decision: 'deny',
          reason: `[HOOK DE SEGURANÇA BLOQUEOU]: Consulta a serviço externo de IP (${pattern}) barrada por proteção de privacidade.`
        }));
        process.exit(0);
      }
    }

    // 3. Proibição de binding em 0.0.0.0 (exposição a todas as interfaces)
    if (cmd.includes('0.0.0.0')) {
      console.log(JSON.stringify({
        decision: 'deny',
        reason: '[HOOK DE SEGURANÇA BLOQUEOU]: Proibido binding de servidor em 0.0.0.0. Apenas localhost / 127.0.0.1 é permitido quando explicitamente solicitado.'
      }));
      process.exit(0);
    }
  }

  // Se não violou nenhuma regra determinística, permitir execução
  console.log(JSON.stringify({ decision: 'allow' }));
  process.exit(0);
} catch (err) {
  // Em caso de erro de parsing, permitir para não travar ferramentas padrão
  console.log(JSON.stringify({ decision: 'allow' }));
  process.exit(0);
}

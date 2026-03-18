/**
 * utils/pix.js — Integração PIX via Efí Bank (Conta Pro — Pessoa Física / CPF)
 *
 * Instalação: npm install sdk-node-apis-efi
 *
 * Variáveis de ambiente necessárias:
 *   EFI_CLIENT_ID        → Client_Id da aplicação criada no painel Efí
 *   EFI_CLIENT_SECRET    → Client_Secret da mesma aplicação
 *   EFI_CERT_BASE64      → Certificado .p12 em Base64 (ver instruções abaixo)
 *   EFI_CHAVE_PIX        → Sua chave Pix cadastrada na Efí (CPF, email, tel ou aleatória)
 *   EFI_SANDBOX          → "true" em testes, "false" em produção
 *   PRECO_CENTAVOS       → Preço em centavos. Ex: 4990 = R$49,90
 *
 * ── COMO CONVERTER O CERTIFICADO .p12 PARA BASE64 ──────────────
 * Mac/Linux (terminal):
 *   base64 -i certificado_producao.p12 | tr -d '\n'
 *
 * Windows (PowerShell):
 *   [Convert]::ToBase64String([IO.File]::ReadAllBytes("certificado.p12"))
 *
 * Cole o resultado como valor de EFI_CERT_BASE64 no .env.local
 * e também nas Environment Variables da Vercel.
 * ────────────────────────────────────────────────────────────────
 */

import EfiPay from 'sdk-node-apis-efi';

// ── instância do SDK ─────────────────────────────────────────────
function getEfi() {
  if (!process.env.EFI_CLIENT_ID)     throw new Error('EFI_CLIENT_ID não configurado');
  if (!process.env.EFI_CLIENT_SECRET) throw new Error('EFI_CLIENT_SECRET não configurado');
  if (!process.env.EFI_CERT_BASE64)   throw new Error('EFI_CERT_BASE64 não configurado');

  return new EfiPay({
    sandbox:       process.env.EFI_SANDBOX === 'true',
    client_id:     process.env.EFI_CLIENT_ID,
    client_secret: process.env.EFI_CLIENT_SECRET,
    certificate:   process.env.EFI_CERT_BASE64,
    cert_base64:   true,
  });
}

// ── criarCobrancaPix ─────────────────────────────────────────────
/**
 * Cria uma cobrança PIX imediata e retorna dados para exibir ao cliente.
 *
 * @param {{ pedidoId: string, nomeCliente?: string }} params
 * @returns {Promise<{
 *   txid: string,
 *   pixCopiaECola: string,
 *   qrcodeBase64: string,
 *   linkPagamento: string,
 *   valor: string,
 * }>}
 */
export async function criarCobrancaPix({ pedidoId, nomeCliente = '' }) {
  const efi = getEfi();

  // txid: 26–35 chars alfanuméricos (sem hífens)
  const txid = pedidoId.replace(/-/g, '').substring(0, 35);

  // Valor em reais com 2 casas decimais
  const valorReais = (parseInt(process.env.PRECO_CENTAVOS || '4990') / 100).toFixed(2);

  const body = {
    calendario: { expiracao: 3600 },
    valor: { original: valorReais },
    chave: process.env.EFI_CHAVE_PIX,
    solicitacaoPagador: 'FotoIA — Desbloqueio das 9 fotos profissionais',
  };

  // Cria a cobrança imediata
  const resposta = await efi.pixCreateImmediateCharge({ txid }, body);

  // Busca o QR Code em base64
  const qrCode = await efi.pixGenerateQRCode({ id: resposta.loc.id });

  return {
    txid:          resposta.txid,
    pixCopiaECola: resposta.pixCopiaECola,
    qrcodeBase64:  qrCode.imagemQrcode,   // "data:image/png;base64,..."
    linkPagamento: `https://pix.sejaefi.com.br/qr/${resposta.loc.id}`,
    valor:         valorReais,
  };
}

// ── registrarWebhook ─────────────────────────────────────────────
/**
 * Registra a URL de webhook na Efí para a sua chave Pix.
 * Execute UMA VEZ via /api/admin/setup-webhook após o deploy.
 *
 * @param {string} webhookUrl  Ex: https://seusite.vercel.app/api/webhooks
 */
export async function registrarWebhook(webhookUrl) {
  const efi = getEfi();
  await efi.pixConfigWebhook(
    { chave: process.env.EFI_CHAVE_PIX },
    { webhookUrl },
    { headers: { 'x-skip-mtls-checking': 'true' } }
  );
  return { ok: true, webhookUrl };
}

// ── validarWebhookEfi ────────────────────────────────────────────
/**
 * Valida se a notificação de webhook veio da Efí Bank.
 * Verifica o IP de origem conforme documentação oficial.
 */
export function validarWebhookEfi(req) {
  const EFI_IP = '34.193.116.226';
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    '';

  if (process.env.NODE_ENV !== 'production') return true; // pula em dev
  if (ip !== EFI_IP) {
    console.warn(`[webhook-efi] IP rejeitado: ${ip}`);
    return false;
  }
  return true;
}

// ── extrairTxidDoPagamento ───────────────────────────────────────
/**
 * Extrai o txid do body do webhook da Efí.
 *
 * Estrutura recebida:
 * {
 *   "pix": [{
 *     "txid": "abc123...",
 *     "valor": "49.90",
 *     "horario": "2025-03-11T...",
 *     "endToEndId": "E..."
 *   }]
 * }
 */
export function extrairTxidDoPagamento(body) {
  if (!body?.pix || !Array.isArray(body.pix) || body.pix.length === 0) return null;
  return body.pix[0]?.txid || null;
}

/**
 * Converte txid (sem hífens) de volta para UUID do pedidoId.
 * Ex: "7978c0c97ea847e78e8849634473c1f1" → "7978c0c9-7ea8-47e7-8e88-49634473c1f1"
 */
export function txidParaPedidoId(txid) {
  if (!txid || txid.length < 32) return txid;
  return [
    txid.substring(0, 8),
    txid.substring(8, 12),
    txid.substring(12, 16),
    txid.substring(16, 20),
    txid.substring(20, 32),
  ].join('-');
}

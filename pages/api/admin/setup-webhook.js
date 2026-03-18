import { registrarWebhook } from '../../../utils/pix';

export default async function handler(req, res) {
  const { secret } = req.query;

  if (!secret || secret !== process.env.SETUP_SECRET) {
    return res.status(401).json({ erro: 'Não autorizado' });
  }

  const baseUrl = process.env.NEXT_PUBLIC_URL;
  if (!baseUrl) return res.status(500).json({ erro: 'NEXT_PUBLIC_URL não configurado' });

  const webhookUrl = `${baseUrl}/api/webhooks`;

  console.log('[setup-webhook] Iniciando registro...');
  console.log('[setup-webhook] webhookUrl:', webhookUrl);
  console.log('[setup-webhook] EFI_CHAVE_PIX:', process.env.EFI_CHAVE_PIX);
  console.log('[setup-webhook] EFI_SANDBOX:', process.env.EFI_SANDBOX);
  console.log('[setup-webhook] EFI_CLIENT_ID:', process.env.EFI_CLIENT_ID ? 'ok' : 'FALTANDO');
  console.log('[setup-webhook] EFI_CERT_BASE64:', process.env.EFI_CERT_BASE64 ? 'ok' : 'FALTANDO');

  try {
    await registrarWebhook(webhookUrl);
    console.log('[setup-webhook] Sucesso!');
    return res.status(200).json({ ok: true, mensagem: 'Webhook registrado com sucesso na Efí Bank!' });
  } catch (err) {
    console.error('[setup-webhook] ERRO:', err.message);
    console.error('[setup-webhook] ERRO COMPLETO:', JSON.stringify(err));
    return res.status(500).json({ erro: err.message, detalhes: JSON.stringify(err) });
  }
}
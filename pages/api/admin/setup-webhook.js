// pages/api/admin/setup-webhook.js
// Registra o webhook na Efí Bank — execute UMA VEZ após o deploy:
// https://seusite.vercel.app/api/admin/setup-webhook?secret=SUA_SENHA
// Adicione SETUP_SECRET nas variáveis de ambiente da Vercel.
import { registrarWebhook } from '../../../utils/pix';

export default async function handler(req, res) {
  const { secret } = req.query;
  if (!secret || secret !== process.env.SETUP_SECRET) {
    return res.status(401).json({ erro: 'Não autorizado' });
  }

  const baseUrl = process.env.NEXT_PUBLIC_URL;
  if (!baseUrl) return res.status(500).json({ erro: 'NEXT_PUBLIC_URL não configurado' });

  // A Efí adiciona /pix automaticamente → cadastramos SEM o /pix
  const webhookUrl = `${baseUrl}/api/webhooks`;

  try {
    await registrarWebhook(webhookUrl);
    return res.status(200).json({
      ok: true,
      mensagem: 'Webhook registrado com sucesso na Efí Bank!',
      nota: `A Efí vai chamar POST em: ${webhookUrl}/pix`,
    });
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
}

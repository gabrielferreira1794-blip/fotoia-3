// pages/api/webhooks/index.js
// Rota de validação — a Efí faz GET aqui ao registrar o webhook
export default function handler(req, res) {
  return res.status(200).json({ ok: true });
}

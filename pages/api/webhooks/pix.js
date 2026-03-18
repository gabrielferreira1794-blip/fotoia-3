// pages/api/webhooks/pix.js
// Recebe confirmação de pagamento PIX da Efí Bank
// A Efí adiciona /pix automaticamente → cadastre no painel: https://seusite.vercel.app/api/webhooks
import { supabaseAdmin } from '../../../utils/supabase';
import { validarWebhookEfi, extrairTxidDoPagamento, txidParaPedidoId } from '../../../utils/pix';
import { gerarFotosPagas } from '../../../utils/ia';
import { baixarEsalvarNoR2 } from '../../../utils/storage';
import { enviarEmailEntrega } from '../../../utils/email';

export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  // A Efí faz GET de verificação ao cadastrar — responde 200
  if (req.method === 'GET') return res.status(200).json({ ok: true });
  if (req.method !== 'POST') return res.status(405).end();

  // Valida IP de origem (Efí Bank)
  if (!validarWebhookEfi(req)) {
    return res.status(401).json({ erro: 'Não autorizado' });
  }

  const body = req.body;

  // Notificação sem campo "pix" = teste de cadastro — ignora
  if (!body?.pix) return res.status(200).json({ ok: true });

  const txid = extrairTxidDoPagamento(body);
  if (!txid) return res.status(400).json({ erro: 'txid não encontrado' });

  const pedidoId = txidParaPedidoId(txid);
  console.log(`[webhook-pix] pagamento recebido → pedidoId: ${pedidoId}`);

  // Responde 200 IMEDIATAMENTE (Efí tem timeout de 60s)
  res.status(200).json({ ok: true });

  // Processa em background
  try {
    const { data: pedido } = await supabaseAdmin
      .from('pedidos').select('*').eq('id', pedidoId).single();

    if (!pedido) { console.error(`[webhook-pix] pedido ${pedidoId} não encontrado`); return; }
    if (pedido.pix_pago) { console.log(`[webhook-pix] pedido ${pedidoId} já processado`); return; }

    // Marca como pago
    await supabaseAdmin.from('pedidos').update({
      pix_pago:    true,
      pix_pago_em: new Date().toISOString(),
      status:      'gerando_resto',
    }).eq('id', pedidoId);

    // Gera as 9 fotos restantes em paralelo
    const urlsFal = await gerarFotosPagas(pedido.lora_url, pedido.genero || 'feminino');

    // Salva no R2
    const urlsFinais = await Promise.all(
      urlsFal.map((url, i) =>
        baixarEsalvarNoR2(url, `pedidos/${pedido.id}/pagas/foto_${i + 1}.jpg`)
      )
    );

    await supabaseAdmin.from('pedidos').update({
      fotos_pagas:  urlsFinais,
      status:       'pronto',
      completed_at: new Date().toISOString(),
    }).eq('id', pedidoId);

    await enviarEmailEntrega(pedido.email, pedido.nome, pedido.id, [pedido.foto_gratis, ...urlsFinais]);
    console.log(`[webhook-pix] pedido ${pedidoId} entregue ✓`);

  } catch (err) {
    console.error('[webhook-pix] erro:', err);
    await supabaseAdmin.from('pedidos')
      .update({ status: 'erro', erro_msg: err.message })
      .eq('id', pedidoId)
      .catch(() => {});
  }
}

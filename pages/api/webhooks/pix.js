// pages/api/webhooks/pix.js — PIX confirmado → gera 9 fotos com LoRA (se já pronto)
import { supabaseAdmin } from '../../../utils/supabase';
import { validarWebhookEfi, extrairTxidDoPagamento, txidParaPedidoId } from '../../../utils/pix';
import { gerarFotosPagas } from '../../../utils/ia';
import { baixarEsalvarNoR2 } from '../../../utils/storage';
import { enviarEmailEntrega } from '../../../utils/email';

export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  if (req.method === 'GET') return res.status(200).json({ ok: true });
  if (req.method !== 'POST') return res.status(405).end();

  if (!validarWebhookEfi(req)) return res.status(401).json({ erro: 'Não autorizado' });

  const body = req.body;
  if (!body?.pix) return res.status(200).json({ ok: true });

  const txid = extrairTxidDoPagamento(body);
  if (!txid) return res.status(400).json({ erro: 'txid não encontrado' });

  const pedidoId = txidParaPedidoId(txid);
  console.log(`[webhook-pix] pagamento recebido → pedidoId: ${pedidoId}`);

  res.status(200).json({ ok: true });

  try {
    const { data: pedido } = await supabaseAdmin
      .from('pedidos').select('*').eq('id', pedidoId).single();

    if (!pedido) { console.error(`[webhook-pix] pedido ${pedidoId} não encontrado`); return; }
    if (pedido.pix_pago) { console.log(`[webhook-pix] pedido ${pedidoId} já processado`); return; }

    // Marca pagamento confirmado
    await supabaseAdmin.from('pedidos').update({
      pix_pago: true,
      pix_pago_em: new Date().toISOString(),
      status: 'aguardando_pagamento', // mantém status até LoRA estar pronto
    }).eq('id', pedidoId);

    // LoRA ainda não terminou → o webhook do treino vai gerar as 9 fotos quando finalizar
    if (!pedido.lora_url) {
      console.log(`[webhook-pix] pedido ${pedidoId} pago — aguardando LoRA para gerar fotos`);
      return;
    }

    // LoRA já está pronto → gera as 9 fotos agora
    console.log(`[webhook-pix] LoRA já pronto → gerando 9 fotos para ${pedidoId}`);
    await supabaseAdmin.from('pedidos')
      .update({ status: 'gerando_resto' })
      .eq('id', pedidoId);

    const urlsFal = await gerarFotosPagas(pedido.lora_url, pedido.genero || 'feminino');
    const urlsFinais = await Promise.all(
      urlsFal.map((url, i) => baixarEsalvarNoR2(url, `pedidos/${pedidoId}/pagas/foto_${i + 1}.jpg`))
    );

    await supabaseAdmin.from('pedidos').update({
      fotos_pagas: urlsFinais,
      status: 'pronto',
      completed_at: new Date().toISOString(),
    }).eq('id', pedidoId);

    await enviarEmailEntrega(pedido.email, pedido.nome, pedidoId, [pedido.foto_gratis, ...urlsFinais]);
    console.log(`[webhook-pix] pedido ${pedidoId} entregue ✓`);

  } catch (err) {
    console.error('[webhook-pix] erro:', err.message);
    try {
      await supabaseAdmin.from('pedidos')
        .update({ status: 'erro', erro_msg: err.message })
        .eq('id', pedidoId);
    } catch (_) {}
  }
}

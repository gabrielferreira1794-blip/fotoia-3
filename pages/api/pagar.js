// pages/api/pagar.js
// Cria cobrança PIX via Efí Bank para desbloquear as 9 fotos
import { supabaseAdmin } from '../../utils/supabase';
import { criarCobrancaPix } from '../../utils/pix';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { pedidoId } = req.body;
  if (!pedidoId) return res.status(400).json({ erro: 'pedidoId obrigatório' });

  const { data: pedido } = await supabaseAdmin
    .from('pedidos').select('*').eq('id', pedidoId).single();

  if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado' });
  if (pedido.pix_pago) return res.json({ jaFoi: true });

  // Se já tem cobrança criada, retorna ela (evita duplicar)
  if (pedido.pix_copia_cola) {
    return res.json({
      qrcodeBase64:  pedido.pix_qrcode_base64,
      pixCopiaECola: pedido.pix_copia_cola,
      txid:          pedido.pix_txid,
      linkPagamento: pedido.pix_link,
    });
  }

  try {
    const cobranca = await criarCobrancaPix({
      pedidoId: pedido.id,
      nomeCliente: pedido.nome,
    });

    await supabaseAdmin.from('pedidos').update({
      pix_txid:          cobranca.txid,
      pix_copia_cola:    cobranca.pixCopiaECola,
      pix_qrcode_base64: cobranca.qrcodeBase64,
      pix_link:          cobranca.linkPagamento,
      status:            'aguardando_pagamento',
    }).eq('id', pedidoId);

    return res.json({
      qrcodeBase64:  cobranca.qrcodeBase64,
      pixCopiaECola: cobranca.pixCopiaECola,
      txid:          cobranca.txid,
      linkPagamento: cobranca.linkPagamento,
      valor:         cobranca.valor,
    });
  } catch (err) {
    console.error('[pagar] Erro Efí:', err);
    return res.status(500).json({ erro: 'Erro ao criar cobrança PIX', detalhe: err.message });
  }
}

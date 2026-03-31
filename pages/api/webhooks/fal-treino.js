// pages/api/webhooks/fal-treino.js
// tipo=previa → PuLID/InstantID concluiu → salva foto grátis
// tipo=treino → LoRA concluiu → salva lora_url; se já pago, gera as 9 fotos
import { supabaseAdmin } from '../../../utils/supabase';
import { baixarEsalvarNoR2 } from '../../../utils/storage';
import { gerarFotosPagas } from '../../../utils/ia';
import { enviarEmailEntrega } from '../../../utils/email';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { pedidoId, tipo } = req.query;
  const payload = req.body;

  console.log(`[fal-webhook] v3 tipo=${tipo || 'treino'} status=${payload.status} pedido=${pedidoId}`);

  // Responde 200 imediatamente para o fal.ai não retentar
  res.json({ ok: true });

  if (payload.status === 'ERROR') {
    console.error('[fal-webhook] erro fal FULL PAYLOAD:', JSON.stringify(payload));
    try {
      await supabaseAdmin.from('pedidos')
        .update({ status: 'erro', erro_msg: JSON.stringify(payload.error || payload) })
        .eq('id', pedidoId);
    } catch (_) {}
    return;
  }

  if (payload.status !== 'OK') return;

  // ── PRÉVIA rápida (PuLID Flux) concluída → salva foto grátis ─────────────
  if (tipo === 'previa') {
    try {
      console.log('[fal-webhook] previa raw payload keys:', Object.keys(payload));
      console.log('[fal-webhook] previa output:', JSON.stringify(payload.output));
      console.log('[fal-webhook] previa payload.payload:', JSON.stringify(payload.payload));

      const urlFal =
        payload.output?.images?.[0]?.url ||
        payload.output?.image?.url ||
        payload.payload?.images?.[0]?.url ||
        payload.payload?.image?.url;

      if (!urlFal) throw new Error('URL da imagem ausente: ' + JSON.stringify(payload.output || payload.payload));

      const urlFinal = await baixarEsalvarNoR2(urlFal, `pedidos/${pedidoId}/foto_gratis.jpg`);

      await supabaseAdmin.from('pedidos').update({
        foto_gratis: urlFinal,
        status: 'foto_gratis_pronta',
      }).eq('id', pedidoId);

      console.log('[fal-webhook] foto grátis prévia salva para', pedidoId);
    } catch (err) {
      console.error('[fal-webhook] erro prévia:', err.message);
      try {
        await supabaseAdmin.from('pedidos')
          .update({ status: 'erro', erro_msg: err.message })
          .eq('id', pedidoId);
      } catch (_) {}
    }
    return;
  }

  // ── TREINO LoRA concluído → salva lora_url; se já pago, gera as 9 fotos ──
  if (!tipo || tipo === 'treino') {
    try {
      const loraUrl =
        payload.output?.diffusers_lora_file?.url ||
        payload.output?.lora_file?.url ||
        payload.payload?.diffusers_lora_file?.url ||
        payload.payload?.lora_file?.url;

      if (!loraUrl) throw new Error('lora_url ausente: ' + JSON.stringify(payload.output || payload.payload));

      console.log('[fal-webhook] lora_url recebido:', loraUrl.substring(0, 60) + '...');

      // Salva lora_url no banco
      await supabaseAdmin.from('pedidos')
        .update({ lora_url: loraUrl })
        .eq('id', pedidoId);

      // Verifica se o usuário já pagou enquanto o LoRA treinava
      const { data: pedido } = await supabaseAdmin
        .from('pedidos')
        .select('pix_pago, genero, email, nome, foto_gratis')
        .eq('id', pedidoId)
        .single();

      if (!pedido?.pix_pago) {
        console.log('[fal-webhook] LoRA pronto, aguardando pagamento para', pedidoId);
        return;
      }

      // Pagamento já confirmado → gera as 9 fotos agora
      console.log('[fal-webhook] LoRA pronto + já pago → gerando 9 fotos para', pedidoId);
      await supabaseAdmin.from('pedidos')
        .update({ status: 'gerando_resto' })
        .eq('id', pedidoId);

      const urlsFal = await gerarFotosPagas(loraUrl, pedido.genero || 'feminino');
      const urlsFinais = await Promise.all(
        urlsFal.map((url, i) => baixarEsalvarNoR2(url, `pedidos/${pedidoId}/pagas/foto_${i + 1}.jpg`))
      );

      await supabaseAdmin.from('pedidos').update({
        fotos_pagas: urlsFinais,
        status: 'pronto',
        completed_at: new Date().toISOString(),
      }).eq('id', pedidoId);

      await enviarEmailEntrega(pedido.email, pedido.nome, pedidoId, [pedido.foto_gratis, ...urlsFinais]);
      console.log('[fal-webhook] 9 fotos entregues (pós-treino) para', pedidoId);

    } catch (err) {
      console.error('[fal-webhook] erro treino:', err.message);
      try {
        await supabaseAdmin.from('pedidos')
          .update({ status: 'erro', erro_msg: err.message })
          .eq('id', pedidoId);
      } catch (_) {}
    }
  }
}

// pages/api/webhooks/fal-treino.js
// Recebe callbacks do fal.ai:
// - tipo=previa  → PhotoMaker concluiu → salva foto grátis
// - tipo=treino  → LoRA concluiu → salva loraUrl para usar nas 9 pagas
import { supabaseAdmin } from '../../../utils/supabase';
import { baixarEsalvarNoR2 } from '../../../utils/storage';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { pedidoId, tipo } = req.query;
  const payload = req.body;

  console.log(`[fal-webhook] tipo=${tipo || 'previa'} status=${payload.status} pedido=${pedidoId}`);

  if (payload.status === 'ERROR') {
    console.error('[fal-webhook] erro:', JSON.stringify(payload.error));
    // Só marca erro se for a prévia — treino pode falhar sem travar o fluxo
    if (!tipo || tipo === 'previa') {
      await supabaseAdmin.from('pedidos').update({
        status: 'erro',
        erro_msg: JSON.stringify(payload.error),
      }).eq('id', pedidoId);
    }
    return res.json({ ok: false });
  }

  if (payload.status !== 'OK') return res.json({ ok: true });

  // ── PRÉVIA via PhotoMaker ────────────────────────────────────────────────
  if (!tipo || tipo === 'previa') {
    try {
      const urlFal = payload.payload?.images?.[0]?.url
        || payload.output?.images?.[0]?.url
        || payload.output?.image?.url;

      if (!urlFal) throw new Error('URL da imagem ausente: ' + JSON.stringify(payload.output || payload.payload));

      const urlFinal = await baixarEsalvarNoR2(urlFal, `pedidos/${pedidoId}/foto_gratis.jpg`);

      await supabaseAdmin.from('pedidos').update({
        foto_gratis: urlFinal,
        status: 'foto_gratis_pronta',
      }).eq('id', pedidoId);

      console.log('[fal-webhook] foto gratis salva para', pedidoId);
    } catch (err) {
      console.error('[fal-webhook] erro previa:', err.message);
      await supabaseAdmin.from('pedidos').update({
        status: 'erro', erro_msg: err.message,
      }).eq('id', pedidoId);
    }
  }

  // ── TREINO LoRA concluído ────────────────────────────────────────────────
  if (tipo === 'treino') {
    try {
      const loraUrl =
        payload.output?.diffusers_lora_file?.url ||
        payload.output?.lora_file?.url ||
        payload.payload?.diffusers_lora_file?.url;

      if (loraUrl) {
        await supabaseAdmin.from('pedidos')
          .update({ lora_url: loraUrl })
          .eq('id', pedidoId);
        console.log('[fal-webhook] lora_url salvo para', pedidoId);
      }
    } catch (err) {
      console.error('[fal-webhook] erro treino:', err.message);
    }
  }

  return res.json({ ok: true });
}
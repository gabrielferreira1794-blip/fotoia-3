// pages/api/webhooks/fal-treino.js
// Recebe callbacks do fal.ai:
// - tipo=treino → LoRA concluiu → gera foto grátis com qualidade máxima
// - tipo=previa → USO/preview concluiu → salva foto grátis rápida
import { supabaseAdmin } from '../../../utils/supabase';
import { baixarEsalvarNoR2 } from '../../../utils/storage';
import { gerarFotoGratis } from '../../../utils/ia';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { pedidoId, tipo } = req.query;
  const payload = req.body;

  console.log(`[fal-webhook] tipo=${tipo || 'treino'} status=${payload.status} pedido=${pedidoId}`);

  // Responde 200 imediatamente para o fal.ai não retentar
  res.json({ ok: true });

  if (payload.status === 'ERROR') {
    console.error('[fal-webhook] erro fal:', JSON.stringify(payload.error));
    await supabaseAdmin.from('pedidos').update({
      status: 'erro',
      erro_msg: JSON.stringify(payload.error),
    }).eq('id', pedidoId).catch(() => {});
    return;
  }

  if (payload.status !== 'OK') return;

  // ── TREINO LoRA concluído → gera foto grátis ─────────────────────────────
  if (!tipo || tipo === 'treino') {
    try {
      // Extrai URL do modelo LoRA treinado
      const loraUrl =
        payload.output?.diffusers_lora_file?.url ||
        payload.output?.lora_file?.url ||
        payload.payload?.diffusers_lora_file?.url ||
        payload.payload?.lora_file?.url;

      if (!loraUrl) {
        throw new Error('lora_url ausente: ' + JSON.stringify(payload.output || payload.payload));
      }

      console.log('[fal-webhook] lora_url recebido:', loraUrl.substring(0, 60) + '...');

      // Salva o modelo LoRA e atualiza status
      await supabaseAdmin.from('pedidos')
        .update({ lora_url: loraUrl, status: 'gerando_foto_gratis' })
        .eq('id', pedidoId);

      // Busca gênero do pedido
      const { data: pedido } = await supabaseAdmin
        .from('pedidos').select('genero').eq('id', pedidoId).single();

      // Gera a foto grátis usando o LoRA treinado
      console.log('[fal-webhook] gerando foto gratis com LoRA...');
      const urlFal = await gerarFotoGratis(loraUrl, pedido?.genero || 'feminino');
      const urlFinal = await baixarEsalvarNoR2(urlFal, `pedidos/${pedidoId}/foto_gratis.jpg`);

      await supabaseAdmin.from('pedidos').update({
        foto_gratis: urlFinal,
        status: 'foto_gratis_pronta',
      }).eq('id', pedidoId);

      console.log('[fal-webhook] foto gratis LoRA gerada para', pedidoId);

    } catch (err) {
      console.error('[fal-webhook] erro treino/geracao:', err.message);
      await supabaseAdmin.from('pedidos')
        .update({ status: 'erro', erro_msg: err.message })
        .eq('id', pedidoId).catch(() => {});
    }
    return;
  }

  // ── PRÉVIA rápida (USO/PhotoMaker) → salva foto grátis ──────────────────
  if (tipo === 'previa') {
    try {
      const urlFal =
        payload.payload?.images?.[0]?.url ||
        payload.output?.images?.[0]?.url ||
        payload.output?.image?.url;

      if (!urlFal) throw new Error('URL da imagem ausente: ' + JSON.stringify(payload.output || payload.payload));

      const urlFinal = await baixarEsalvarNoR2(urlFal, `pedidos/${pedidoId}/foto_gratis.jpg`);

      await supabaseAdmin.from('pedidos').update({
        foto_gratis: urlFinal,
        status: 'foto_gratis_pronta',
      }).eq('id', pedidoId);

      console.log('[fal-webhook] foto gratis previa salva para', pedidoId);
    } catch (err) {
      console.error('[fal-webhook] erro previa:', err.message);
      await supabaseAdmin.from('pedidos')
        .update({ status: 'erro', erro_msg: err.message })
        .eq('id', pedidoId).catch(() => {});
    }
  }
}
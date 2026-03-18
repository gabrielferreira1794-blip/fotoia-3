// Webhook fal.ai — treino concluído → gera 1 foto grátis
import { supabaseAdmin } from '../../../utils/supabase';
import { gerarFotoGratis } from '../../../utils/ia';
import { baixarEsalvarNoR2 } from '../../../utils/storage';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { pedidoId } = req.query;
  const payload = req.body;

  if (payload.status === 'ERROR') {
    await supabaseAdmin.from('pedidos').update({
      status: 'erro', erro_msg: JSON.stringify(payload.error),
    }).eq('id', pedidoId);
    return res.json({ ok: false });
  }
  if (payload.status !== 'OK') return res.json({ ok: true });

  try {
    const loraUrl = payload.output?.diffusers_lora_file?.url || payload.output?.lora_file?.url;
    if (!loraUrl) throw new Error('LoRA URL ausente: ' + JSON.stringify(payload.output));

    // Salva modelo e busca gênero do pedido
    await supabaseAdmin.from('pedidos').update({ lora_url: loraUrl, status: 'gerando_foto_gratis' }).eq('id', pedidoId);
    const { data: pedido } = await supabaseAdmin.from('pedidos').select('genero').eq('id', pedidoId).single();

    // Gera a 1 foto grátis
    const urlFal = await gerarFotoGratis(loraUrl, pedido?.genero || 'feminino');
    const urlFinal = await baixarEsalvarNoR2(urlFal, `pedidos/${pedidoId}/foto_gratis.jpg`);

    await supabaseAdmin.from('pedidos').update({
      foto_gratis: urlFinal,
      status: 'foto_gratis_pronta',
    }).eq('id', pedidoId);

    console.log(`[fal-treino] Foto grátis gerada para ${pedidoId}`);

  } catch (err) {
    console.error('[fal-treino]', err);
    await supabaseAdmin.from('pedidos').update({ status: 'erro', erro_msg: err.message }).eq('id', pedidoId);
  }

  res.json({ ok: true });
}

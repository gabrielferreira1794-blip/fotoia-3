// Webhook fal.ai — concluído → salva foto grátis
import { supabaseAdmin } from '../../../utils/supabase';
import { baixarEsalvarNoR2 } from '../../../utils/storage';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { pedidoId } = req.query;
  const payload = req.body;

  console.log('[fal-webhook] payload completo:', JSON.stringify(payload));

  if (payload.status === 'ERROR') {
    console.error('[fal-webhook] erro:', payload.error);
    await supabaseAdmin.from('pedidos').update({
      status: 'erro', erro_msg: JSON.stringify(payload.error),
    }).eq('id', pedidoId);
    return res.json({ ok: false });
  }

  if (payload.status !== 'OK') return res.json({ ok: true });

  try {
    const urlFal = payload.output?.images?.[0]?.url || payload.output?.image?.url;
    if (!urlFal) throw new Error('URL da imagem ausente: ' + JSON.stringify(payload.output));

    const urlFinal = await baixarEsalvarNoR2(urlFal, `pedidos/${pedidoId}/foto_gratis.jpg`);

    await supabaseAdmin.from('pedidos').update({
      foto_gratis: urlFinal,
      status: 'foto_gratis_pronta',
    }).eq('id', pedidoId);

    console.log('[fal-webhook] foto grátis gerada para', pedidoId);

  } catch (err) {
    console.error('[fal-webhook]', err);
    await supabaseAdmin.from('pedidos').update({
      status: 'erro', erro_msg: err.message,
    }).eq('id', pedidoId);
  }

  return res.json({ ok: true });
}
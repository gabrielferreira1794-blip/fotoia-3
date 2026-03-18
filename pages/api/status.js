import { supabaseAdmin } from '../../utils/supabase';

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ erro: 'ID obrigatório' });

  const { data: p } = await supabaseAdmin
    .from('pedidos')
    .select('id, status, foto_gratis, fotos_pagas, pix_pago, completed_at')
    .eq('id', id).single();

  if (!p) return res.status(404).json({ erro: 'Não encontrado' });

  res.json({
    id: p.id,
    status: p.status,
    fotoGratisPronta: !!p.foto_gratis,
    totalFotosPagas: p.fotos_pagas?.length || 0,
    pixPago: p.pix_pago,
    pronto: p.status === 'pronto',
    completedAt: p.completed_at,
  });
}

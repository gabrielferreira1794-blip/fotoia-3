// Retorna as fotos de um pedido pago (usado internamente)
import { supabaseAdmin } from '../../utils/supabase';

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ erro: 'ID obrigatório' });

  const { data: pedido } = await supabaseAdmin
    .from('pedidos')
    .select('id, status, foto_gratis, fotos_pagas, nome, expires_at')
    .eq('id', id).single();

  if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado' });
  if (pedido.status !== 'pronto') return res.status(400).json({ erro: 'Fotos ainda não prontas' });
  if (new Date(pedido.expires_at) < new Date()) return res.status(410).json({ erro: 'Link expirado' });

  const todasFotos = [pedido.foto_gratis, ...(pedido.fotos_pagas || [])].filter(Boolean);

  res.json({ id: pedido.id, nome: pedido.nome, fotos: todasFotos, expiresAt: pedido.expires_at });
}

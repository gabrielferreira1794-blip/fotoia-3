// api/iniciar.js — Recebe 1 foto, salva no banco e dispara InstantID
import { supabaseAdmin } from '../../utils/supabase';
import { uploadParaR2 } from '../../utils/storage';
import { iniciarGeracaoGratis } from '../../utils/ia';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { IncomingForm } = await import('formidable');
    const form = new IncomingForm({ maxFileSize: 20 * 1024 * 1024 });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, f, fi) => err ? reject(err) : resolve([f, fi]));
    });

    const get = (k) => Array.isArray(fields[k]) ? fields[k][0] : fields[k];
    const email    = get('email');
    const nome     = get('nome');
    const whatsapp = get('whatsapp') || null;
    const genero   = get('genero') || 'feminino';

    if (!email || !nome) return res.status(400).json({ erro: 'Nome e email obrigatórios' });

    const getFile = (k) => { const f = files[k]; return Array.isArray(f) ? f[0] : f; };
    const fFrente = getFile('frente');
    if (!fFrente) return res.status(400).json({ erro: 'Envie sua foto' });

    const pedidoId = crypto.randomUUID();
    const fs = await import('fs');
    const bufFrente = fs.readFileSync(fFrente.filepath);

    const urlFrente = await uploadParaR2(bufFrente, `pedidos/${pedidoId}/frente.jpg`);
    console.log('[iniciar] urlFrente:', urlFrente);
    console.log('[iniciar] genero:', genero);

    await supabaseAdmin.from('pedidos').insert({
      id: pedidoId, email, nome, whatsapp, genero,
      foto_frente: urlFrente,
      status: 'processando',
    });

    const requestId = await iniciarGeracaoGratis(urlFrente, pedidoId, genero);
    console.log('[iniciar] requestId:', requestId);

    await supabaseAdmin.from('pedidos')
      .update({ fal_request_id: requestId })
      .eq('id', pedidoId);

    return res.status(200).json({ pedidoId });

  } catch (err) {
    console.error('[iniciar]', err);
    return res.status(500).json({ erro: 'Erro interno. Tente novamente.' });
  }
}
// api/iniciar.js — Upload 3 fotos, gera prévia USO + treino LoRA em paralelo
import { supabaseAdmin } from '../../utils/supabase';
import { uploadParaR2 } from '../../utils/storage';
import { iniciarGeracaoGratis, iniciarTreino, criarZipRosto } from '../../utils/ia';

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

    if (!email || !nome) return res.status(400).json({ erro: 'Nome e email obrigatorios' });

    const getFile = (k) => { const f = files[k]; return Array.isArray(f) ? f[0] : f; };
    const fFrente   = getFile('frente');
    const fEsquerda = getFile('esquerda');
    const fDireita  = getFile('direita');

    if (!fFrente || !fEsquerda || !fDireita) {
      return res.status(400).json({ erro: 'Envie as 3 fotos do rosto' });
    }

    const { randomUUID } = await import('crypto');
    const pedidoId = randomUUID();
    const fs = await import('fs');

    const bufFrente   = fs.readFileSync(fFrente.filepath);
    const bufEsquerda = fs.readFileSync(fEsquerda.filepath);
    const bufDireita  = fs.readFileSync(fDireita.filepath);

    // Upload das 3 fotos para o R2
    const [urlFrente, urlEsquerda, urlDireita] = await Promise.all([
      uploadParaR2(bufFrente,   `pedidos/${pedidoId}/frente.jpg`),
      uploadParaR2(bufEsquerda, `pedidos/${pedidoId}/esquerda.jpg`),
      uploadParaR2(bufDireita,  `pedidos/${pedidoId}/direita.jpg`),
    ]);

    // Cria pedido no banco
    await supabaseAdmin.from('pedidos').insert({
      id: pedidoId, email, nome, whatsapp, genero,
      foto_frente:   urlFrente,
      foto_esquerda: urlEsquerda,
      foto_direita:  urlDireita,
      status: 'processando',
    });

    // Dispara USO (prévia ~30-60s) E treino LoRA em paralelo via webhooks
    const zipDataUrl = await criarZipRosto(bufFrente, bufEsquerda, bufDireita);

    const [requestIdPrevia] = await Promise.all([
      iniciarGeracaoGratis(urlFrente, urlEsquerda, urlDireita, pedidoId, genero),
      iniciarTreino(zipDataUrl, pedidoId).catch(err => {
        console.error('[iniciar] treino falhou (nao bloqueia):', err.message);
        return null;
      }),
    ]);

    await supabaseAdmin.from('pedidos')
      .update({ fal_request_id: requestIdPrevia })
      .eq('id', pedidoId);

    return res.status(200).json({ pedidoId });

  } catch (err) {
    console.error('[iniciar]', err);
    return res.status(500).json({ erro: 'Erro interno. Tente novamente.' });
  }
}
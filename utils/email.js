import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

export const enviarEmailEntrega = async (email, nome, pedidoId, todasFotos) => {
  const url = process.env.NEXT_PUBLIC_URL;
  const primeiras = todasFotos.slice(0, 3);

  const htmlFotos = primeiras.map((foto, i) => `
    <img src="${foto}" alt="Foto ${i+1}" style="width:160px;height:160px;object-fit:cover;border-radius:10px;margin:6px;" />
  `).join('');

  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: '✨ Suas 10 fotos profissionais com IA estão prontas!',
    html: `
      <!DOCTYPE html><html><head><meta charset="utf-8"/></head>
      <body style="background:#0d0d0d;color:#fff;font-family:sans-serif;padding:40px;margin:0;">
        <div style="max-width:560px;margin:0 auto;">
          <div style="font-family:serif;font-size:24px;font-weight:900;color:#d4a843;margin-bottom:24px;">FotoIA ✦</div>
          <h1 style="font-size:28px;margin-bottom:8px;">Suas fotos estão prontas${nome ? `, ${nome.split(' ')[0]}` : ''}! 🎉</h1>
          <p style="color:#888;margin-bottom:28px;">Suas ${todasFotos.length} fotos profissionais geradas com Flux.1 AI estão disponíveis.</p>
          <div style="margin:24px 0;">${htmlFotos}</div>
          <a href="${url}/download/${pedidoId}" style="display:inline-block;background:#d4a843;color:#000;padding:16px 40px;border-radius:100px;text-decoration:none;font-weight:700;font-size:16px;margin:16px 0;">
            Ver e baixar todas as fotos →
          </a>
          <p style="color:#555;font-size:12px;margin-top:40px;">Link válido por 7 dias · FotoIA</p>
        </div>
      </body></html>
    `,
  });
};

export const enviarEmailErro = async (email, pedidoId) => {
  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Problema com sua geração de fotos — FotoIA',
    html: `<div style="font-family:sans-serif;padding:40px;"><h2>Tivemos um problema 😔</h2><p>Ocorreu um erro. Nossa equipe foi notificada e você receberá reembolso em até 5 dias úteis.</p><p style="color:#999;font-size:12px;">Pedido: ${pedidoId}</p></div>`,
  });
};

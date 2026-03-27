import { useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { Download as DownloadIcon, CheckCircle2, Sparkles, Clock, Image } from 'lucide-react';

export async function getServerSideProps({ params }) {
  const { supabaseAdmin } = await import('../../utils/supabase');

  const { data: pedido } = await supabaseAdmin
    .from('pedidos')
    .select('id, status, foto_gratis, fotos_pagas, nome, expires_at')
    .eq('id', params.id)
    .single();

  if (!pedido || pedido.status !== 'pronto') return { notFound: true };

  if (new Date(pedido.expires_at) < new Date()) {
    return { props: { expirado: true } };
  }

  const todasFotos = [
    pedido.foto_gratis,
    ...(pedido.fotos_pagas || []),
  ].filter(Boolean);

  return {
    props: {
      pedido: {
        id: pedido.id,
        nome: pedido.nome,
        fotos: todasFotos,
        expiresAt: pedido.expires_at,
      },
    },
  };
}

export default function Download({ pedido, expirado }) {
  const [baixando, setBaixando] = useState(false);
  const [selecionadas, setSelecionadas] = useState(new Set());

  if (expirado) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', maxWidth: 420 }}
        >
          <div style={{ fontSize: 48, marginBottom: 20 }}>⏰</div>
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 24, fontWeight: 700, marginBottom: 12, letterSpacing: '-0.02em' }}>Link expirado</h2>
          <p style={{ fontSize: 15, color: '#666', lineHeight: 1.7, marginBottom: 32 }}>
            Este link expirou após 7 dias. As fotos foram removidas do servidor.
          </p>
          <a href="/" className="btn btn-gold" style={{ padding: '16px 32px' }}>
            <Sparkles size={15} /> Criar novas fotos
          </a>
        </motion.div>
      </div>
    );
  }

  const toggleSelecionada = (i) => {
    setSelecionadas(prev => {
      const nova = new Set(prev);
      nova.has(i) ? nova.delete(i) : nova.add(i);
      return nova;
    });
  };

  const baixarTodas = async () => {
    setBaixando(true);
    try {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      await Promise.all(
        pedido.fotos.map(async (url, i) => {
          const res = await fetch(url);
          const blob = await res.blob();
          zip.file(`fotoia_${i + 1}.jpg`, blob);
        })
      );
      const content = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(content);
      a.download = 'minhas-fotos-fotoia.zip';
      a.click();
    } finally {
      setBaixando(false);
    }
  };

  const baixarSelecionadas = async () => {
    if (selecionadas.size === 0) return;
    setBaixando(true);
    try {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      await Promise.all(
        Array.from(selecionadas).map(async (i) => {
          const res = await fetch(pedido.fotos[i]);
          const blob = await res.blob();
          zip.file(`fotoia_${i + 1}.jpg`, blob);
        })
      );
      const content = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(content);
      a.download = 'fotoia-selecionadas.zip';
      a.click();
    } finally {
      setBaixando(false);
    }
  };

  const expiresDate = new Date(pedido.expiresAt).toLocaleDateString('pt-BR');

  return (
    <>
      <Head><title>Suas fotos prontas — FotoIA</title></Head>

      <div style={{ minHeight: '100vh', background: '#0d0d0d' }}>
        {/* NAV */}
        <nav style={{ position: 'sticky', top: 0, zIndex: 100, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: 'rgba(13,13,13,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <a href="/" style={{ fontFamily: 'Sora, sans-serif', fontSize: 18, fontWeight: 800, color: '#d4a843', textDecoration: 'none', letterSpacing: '-0.02em' }}>
            FotoIA <span style={{ opacity: 0.4, fontSize: 12 }}>✦</span>
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#555' }}>
            <Clock size={13} /> Expira em {expiresDate}
          </div>
        </nav>

        <div className="container" style={{ padding: '48px 20px 80px' }}>
          {/* HEADER */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ marginBottom: 40 }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
              <div>
                <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, marginBottom: 8, letterSpacing: '-0.03em' }}>
                  {pedido.nome ? `${pedido.nome.split(' ')[0]}, aqui estão suas fotos!` : 'Suas fotos profissionais!'}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#666' }}>
                    <Image size={13} /> {pedido.fotos.length} fotos geradas com Flux.1 AI
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#555' }}>
                    <Clock size={13} /> Link válido até {expiresDate}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {selecionadas.size > 0 && (
                  <button onClick={baixarSelecionadas} disabled={baixando} className="btn btn-outline" style={{ padding: '12px 20px', fontSize: 14 }}>
                    <DownloadIcon size={14} /> Baixar {selecionadas.size} selecionada{selecionadas.size > 1 ? 's' : ''}
                  </button>
                )}
                <button onClick={baixarTodas} disabled={baixando} className="btn btn-gold" style={{ padding: '12px 24px', fontSize: 14 }}>
                  {baixando ? (
                    <><span className="spinner" /> Preparando ZIP...</>
                  ) : (
                    <><DownloadIcon size={14} /> Baixar todas ({pedido.fotos.length} fotos)</>
                  )}
                </button>
              </div>
            </div>

            {selecionadas.size > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                style={{ marginTop: 16, padding: '10px 16px', background: 'rgba(212,168,67,0.08)', border: '1px solid rgba(212,168,67,0.2)', borderRadius: 10, fontSize: 13, color: '#d4a843', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <CheckCircle2 size={13} /> {selecionadas.size} foto{selecionadas.size > 1 ? 's' : ''} selecionada{selecionadas.size > 1 ? 's' : ''} — clique nas fotos para selecionar/deselecionar
              </motion.div>
            )}

            {selecionadas.size === 0 && (
              <p style={{ marginTop: 12, fontSize: 13, color: '#444' }}>
                Clique nas fotos para selecionar e baixar individualmente
              </p>
            )}
          </motion.div>

          {/* GALLERY */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {pedido.fotos.map((url, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
                onClick={() => toggleSelecionada(i)}
                style={{
                  position: 'relative',
                  borderRadius: 12,
                  overflow: 'hidden',
                  aspectRatio: '1/1',
                  cursor: 'pointer',
                  border: selecionadas.has(i) ? '2px solid #d4a843' : '2px solid transparent',
                  transition: 'border-color .2s, transform .2s',
                  boxShadow: selecionadas.has(i) ? '0 0 0 3px rgba(212,168,67,0.15)' : 'none',
                }}
              >
                <img src={url} alt={`Foto ${i + 1}`} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform .3s' }} />

                {/* Badge grátis */}
                {i === 0 && (
                  <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(34,197,94,0.9)', color: '#fff', fontSize: 11, fontFamily: 'Sora, sans-serif', fontWeight: 700, padding: '3px 10px', borderRadius: 100 }}>
                    Grátis
                  </div>
                )}

                {/* Overlay */}
                <div style={{ position: 'absolute', inset: 0, background: selecionadas.has(i) ? 'rgba(212,168,67,0.15)' : 'rgba(0,0,0,0)', transition: 'background .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: selecionadas.has(i) ? 1 : 0 }}
                  className="card-overlay">
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#d4a843', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={18} color="#0d0d0d" />
                  </div>
                </div>

                {/* Download individual */}
                <a
                  href={url}
                  download={`fotoia_${i + 1}.jpg`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{ position: 'absolute', bottom: 10, right: 10, width: 34, height: 34, borderRadius: '50%', background: 'rgba(13,13,13,0.8)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', textDecoration: 'none', transition: 'all .2s', opacity: 0 }}
                  className="download-btn"
                >
                  <DownloadIcon size={14} />
                </a>
              </motion.div>
            ))}
          </div>

          {/* FOOTER CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            style={{ marginTop: 60, textAlign: 'center', padding: '40px 20px', background: 'rgba(212,168,67,0.04)', border: '1px solid rgba(212,168,67,0.1)', borderRadius: 20 }}
          >
            <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: 22, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em' }}>
              Gostou do resultado?
            </h3>
            <p style={{ fontSize: 15, color: '#555', marginBottom: 24 }}>Gere um novo pack com looks diferentes</p>
            <a href="/" className="btn btn-gold" style={{ padding: '14px 32px' }}>
              <Sparkles size={15} /> Gerar novas fotos
            </a>
          </motion.div>
        </div>
      </div>

      <style jsx global>{`
        .card-overlay { opacity: 0 !important; }
        div:hover > .card-overlay,
        div[style*="rgba(212,168,67,0.15)"] { opacity: 1 !important; }

        div:hover .download-btn { opacity: 1 !important; }

        @media (max-width: 640px) {
          div[style*="grid-template-columns: repeat(auto-fill, minmax(220px"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </>
  );
}

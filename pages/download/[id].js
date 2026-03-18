import { useState } from 'react';
import Head from 'next/head';
import s from '../../styles/Download.module.css';

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

  // Junta foto grátis + 9 pagas em uma lista de 10
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
      <div className={s.page}>
        <div className={s.expired}>
          <h2>Link expirado</h2>
          <p>Este link expirou após 7 dias. As fotos foram removidas do servidor.</p>
          <a href="/" className="btn btn-gold">Criar novas fotos →</a>
        </div>
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

  return (
    <>
      <Head><title>Suas fotos prontas — FotoIA</title></Head>
      <div className={s.page}>
        <nav className={s.nav}>
          <a href="/" className={s.navLogo}>FotoIA ✦</a>
        </nav>
        <div className="container">
          <div className={s.header}>
            <h1 className={s.titulo}>
              {pedido.nome ? `${pedido.nome.split(' ')[0]}, aqui estão suas fotos! 🎉` : 'Suas fotos profissionais! 🎉'}
            </h1>
            <p className={s.sub}>
              {pedido.fotos.length} fotos geradas com Flux.1 AI · Link válido até {new Date(pedido.expiresAt).toLocaleDateString('pt-BR')}
            </p>
            <div className={s.acoes}>
              <button className="btn btn-gold" onClick={baixarTodas} disabled={baixando}>
                {baixando ? '⏳ Preparando ZIP...' : `⬇ Baixar todas (${pedido.fotos.length} fotos)`}
              </button>
              {selecionadas.size > 0 && (
                <button className={s.btnSelecionadas} onClick={baixarSelecionadas} disabled={baixando}>
                  Baixar {selecionadas.size} selecionada{selecionadas.size > 1 ? 's' : ''}
                </button>
              )}
            </div>
          </div>

          <div className={s.grid}>
            {pedido.fotos.map((url, i) => (
              <div
                key={i}
                className={`${s.fotoCard} ${selecionadas.has(i) ? s.selecionada : ''}`}
                onClick={() => toggleSelecionada(i)}
              >
                <img src={url} alt={`Foto ${i + 1}`} loading="lazy" />
                {i === 0 && <span className={s.tagGratis}>Grátis</span>}
                <div className={s.overlay}>
                  <div className={s.check}>{selecionadas.has(i) ? '✓' : ''}</div>
                  <a href={url} download={`fotoia_${i + 1}.jpg`} target="_blank" rel="noreferrer"
                    className={s.btnBaixar} onClick={e => e.stopPropagation()}>⬇</a>
                </div>
              </div>
            ))}
          </div>

          <div className={s.footer}>
            <a href="/" className="btn btn-gold">✨ Gerar novas fotos</a>
          </div>
        </div>
      </div>
    </>
  );
}

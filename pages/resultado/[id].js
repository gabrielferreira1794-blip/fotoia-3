// Página de resultado: mostra 1 foto grátis + 9 bloqueadas com PIX nativo
import { useState, useEffect } from 'react';
import Head from 'next/head';
import s from '../../styles/Resultado.module.css';

export async function getServerSideProps({ params }) {
  const { supabaseAdmin } = await import('../../utils/supabase');
  const { data: pedido } = await supabaseAdmin
    .from('pedidos')
    .select('id, status, foto_gratis, fotos_pagas, nome, pix_pago, genero')
    .eq('id', params.id)
    .single();

  if (!pedido) return { notFound: true };

  return {
    props: {
      pedido: {
        id: pedido.id,
        status: pedido.status,
        nome: pedido.nome,
        fotoGratis: pedido.foto_gratis || null,
        fotosPagas: pedido.fotos_pagas || [],
        pixPago: pedido.pix_pago || false,
        genero: pedido.genero || 'feminino',
      },
    },
  };
}

// Tela de carregamento enquanto processa
function TelaCarregando({ nome }) {
  const [dot, setDot] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDot(d => (d + 1) % 4), 500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className={s.loading}>
      <div className={s.loadingSpinner} />
      <h2 className={s.loadingTitulo}>
        {nome ? `Gerando sua foto, ${nome.split(' ')[0]}` : 'Gerando sua foto'}{'...'.slice(0, dot + 1)}
      </h2>
      <p className={s.loadingSub}>
        Nossa IA está aprendendo seu rosto com Flux.1.<br />
        Isso leva entre 10 e 20 minutos. Pode fechar esta aba — você receberá um email.
      </p>
      <div className={s.loadingSteps}>
        {['Analisando suas fotos', 'Treinando modelo Flux.1', 'Gerando headshot grátis'].map((step, i) => (
          <div key={step} className={s.loadingStep}>
            <span className={s.loadingDot} style={{ animationDelay: `${i * 0.4}s` }} />
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}

// QR Code PIX
function CheckoutPix({ pedidoId, onPago }) {
  const [dados, setDados] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const [verificando, setVerificando] = useState(false);

  useEffect(() => {
    // Cria ou busca cobrança PIX
    fetch('/api/pagar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pedidoId }),
    })
      .then(r => r.json())
      .then(setDados)
      .catch(console.error);
  }, [pedidoId]);

  useEffect(() => {
    if (!dados) return;
    // Polling para verificar pagamento a cada 5 segundos
    const interval = setInterval(async () => {
      setVerificando(true);
      const r = await fetch(`/api/status?id=${pedidoId}`);
      const d = await r.json();
      setVerificando(false);
      if (d.pixPago) { onPago(); clearInterval(interval); }
    }, 5000);
    return () => clearInterval(interval);
  }, [dados, pedidoId, onPago]);

  const copiar = () => {
    navigator.clipboard.writeText(dados.brCode);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  return (
    <div className={s.checkout}>
      <div className={s.checkoutHeader}>
        <div className={s.checkoutBadge}>🔒 Desbloqueie as 9 fotos restantes</div>
        <h2 className={s.checkoutTitulo}>Pague R$49,90 via PIX</h2>
        <p className={s.checkoutSub}>Aprovação instantânea · Fotos liberadas em segundos após o pagamento</p>
      </div>

      {!dados ? (
        <div className={s.checkoutLoading}>
          <div className="spinner spinner-gold" /> Gerando QR Code...
        </div>
      ) : (
        <>
          {dados.qrCodeImage && (
            <div className={s.qrWrapper}>
              <img
                src={`data:image/png;base64,${dados.qrCodeImage}`}
                alt="QR Code PIX"
                className={s.qrImg}
              />
              {verificando && (
                <div className={s.qrVerificando}>
                  <span className="spinner spinner-gold" /> Verificando pagamento...
                </div>
              )}
            </div>
          )}

          <div className={s.pixCopiaCola}>
            <p className={s.pixLabel}>Ou use o código Pix Copia e Cola:</p>
            <div className={s.pixCode}>
              <span className={s.pixCodeText}>{dados.brCode?.slice(0, 50)}...</span>
              <button className={s.pixCopiarBtn} onClick={copiar}>
                {copiado ? '✓ Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>

          <div className={s.checkoutGarantias}>
            {['🔐 Pagamento 100% seguro', '⚡ Fotos liberadas na hora', '📧 Enviamos por email também'].map(g => (
              <div key={g} className={s.garantia}>{g}</div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function Resultado({ pedido: pedidoInicial }) {
  const [pedido, setPedido] = useState(pedidoInicial);
  const [foiPago, setFoiPago] = useState(pedidoInicial.pixPago);

  // Polling para detectar quando a foto grátis fica pronta
  useEffect(() => {
    if (pedido.status === 'foto_gratis_pronta' || pedido.status === 'pronto') return;

    const interval = setInterval(async () => {
      const r = await fetch(`/api/status?id=${pedido.id}`);
      const d = await r.json();
      if (d.fotoGratisPronta || d.status === 'foto_gratis_pronta' || d.status === 'pronto') {
        window.location.reload(); // recarrega para pegar SSR com foto pronta
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [pedido]);

  const onPago = () => {
    setFoiPago(true);
    setTimeout(() => window.location.reload(), 1500);
  };

  const processando = !['foto_gratis_pronta', 'aguardando_pagamento', 'gerando_resto', 'pronto'].includes(pedido.status);
  const todasProntas = pedido.status === 'pronto' || foiPago;

  return (
    <>
      <Head>
        <title>Suas fotos — FotoIA</title>
      </Head>

      <nav className={s.nav}>
        <a href="/" className={s.navLogo}>FotoIA ✦</a>
        {todasProntas && (
          <a href={`/download/${pedido.id}`} className="btn btn-gold" style={{ padding: '10px 24px', fontSize: '14px' }}>
            Baixar fotos ⬇
          </a>
        )}
      </nav>

      <main className={s.main}>
        {processando ? (
          <div className="container">
            <TelaCarregando nome={pedido.nome} />
          </div>
        ) : (
          <div className={s.layout}>
            {/* Coluna esquerda — foto grátis */}
            <div className={s.fotoGratisSide}>
              <div className={s.fotoGratisHeader}>
                <span className={s.tagGratis}>✓ Grátis</span>
                <h2 className={s.fotoGratisTitulo}>
                  {pedido.nome ? `Olá, ${pedido.nome.split(' ')[0]}!` : 'Sua foto profissional'}
                </h2>
                <p className={s.fotoGratisSub}>Aqui está seu headshot gerado com Flux.1 AI</p>
              </div>

              {pedido.fotoGratis ? (
                <div className={s.fotoGratisWrap}>
                  <img src={pedido.fotoGratis} alt="Sua foto profissional" className={s.fotoGratisImg} />
                  <div className={s.fotoGratisActions}>
                    <a href={pedido.fotoGratis} download="fotoia_gratis.jpg" target="_blank" rel="noreferrer"
                      className="btn btn-outline" style={{ fontSize: '13px', padding: '10px 20px' }}>
                      ⬇ Baixar esta foto
                    </a>
                  </div>
                </div>
              ) : (
                <div className={s.fotoPlaceholder}>
                  <div className="spinner spinner-gold" />
                  <p>Gerando sua foto grátis...</p>
                </div>
              )}
            </div>

            {/* Coluna direita — 9 bloqueadas + PIX */}
            <div className={s.fotosLockedSide}>
              <div className={s.lockedHeader}>
                <h3 className={s.lockedTitulo}>
                  {todasProntas ? '🎉 Suas 9 fotos estão prontas!' : '🔒 Mais 9 fotos esperando por você'}
                </h3>
                <p className={s.lockedSub}>
                  {todasProntas
                    ? 'Baixe todas as suas fotos profissionais'
                    : 'Estilos variados: outdoor, formal, editorial, lifestyle e mais'}
                </p>
              </div>

              {/* Grid 3x3 das fotos desbloqueadas OU bloqueadas */}
              <div className={s.fotosGrid}>
                {todasProntas && pedido.fotosPagas.length > 0
                  ? pedido.fotosPagas.map((url, i) => (
                    <div key={i} className={s.fotoDesbloqueada}>
                      <img src={url} alt={`Foto ${i + 2}`} />
                    </div>
                  ))
                  : Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className={s.fotoBloqueada}>
                      <div className={s.fotoBloqueadaBlur} style={{ backgroundImage: pedido.fotoGratis ? `url(${pedido.fotoGratis})` : undefined }} />
                      <div className={s.fotoBloqueadaOverlay}>
                        <span className={s.lockIcon}>🔒</span>
                      </div>
                    </div>
                  ))
                }
              </div>

              {/* Checkout PIX ou botão de download */}
              {todasProntas ? (
                <a href={`/download/${pedido.id}`} className="btn btn-gold" style={{ width: '100%', padding: '18px', fontSize: '16px', borderRadius: '12px', marginTop: '20px' }}>
                  Ver e baixar todas as 10 fotos →
                </a>
              ) : (
                pedido.fotoGratis && <CheckoutPix pedidoId={pedido.id} onPago={onPago} />
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}

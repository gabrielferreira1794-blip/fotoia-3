import { useState, useEffect } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Lock, Download, CheckCircle2, Zap, Shield, Mail, Copy, Check } from 'lucide-react';

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

const LOADING_STEPS = [
  'Analisando suas fotos',
  'Treinando modelo IA',
  'Gerando headshot grátis',
];

function TelaCarregando({ nome }) {
  const [stepAtivo, setStepAtivo] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStepAtivo(s => (s + 1) % LOADING_STEPS.length), 2500);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ textAlign: 'center', maxWidth: 480, margin: '0 auto', padding: '0 20px' }}
      >
        {/* Spinner animado */}
        <div style={{ position: 'relative', width: 72, height: 72, margin: '0 auto 32px' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
            style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(212,168,67,0.15)', borderTopColor: '#d4a843' }}
          />
          <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', background: 'rgba(212,168,67,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={22} color="#d4a843" />
          </div>
        </div>

        <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 26, fontWeight: 700, marginBottom: 12, letterSpacing: '-0.02em' }}>
          {nome ? `Gerando sua foto, ${nome.split(' ')[0]}` : 'Gerando sua foto'}
        </h2>
        <p style={{ fontSize: 15, color: '#666', lineHeight: 1.7, marginBottom: 40 }}>
          Nossa IA está processando seu rosto.<br />
          Isso leva menos de 1 minuto. Aguarde nesta página.
        </p>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {LOADING_STEPS.map((step, i) => (
            <motion.div
              key={step}
              animate={{ opacity: stepAtivo === i ? 1 : 0.3 }}
              transition={{ duration: 0.4 }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, background: stepAtivo === i ? 'rgba(212,168,67,0.07)' : 'rgba(255,255,255,0.02)', border: `1px solid ${stepAtivo === i ? 'rgba(212,168,67,0.25)' : 'rgba(255,255,255,0.05)'}`, borderRadius: 12, padding: '12px 16px', transition: 'all 0.4s' }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: stepAtivo === i ? '#d4a843' : '#333', flexShrink: 0, transition: 'background 0.4s' }} />
              <span style={{ fontSize: 14, color: stepAtivo === i ? '#e8e4de' : '#555', fontFamily: 'Sora, sans-serif', fontWeight: stepAtivo === i ? 600 : 400, transition: 'all 0.4s' }}>
                {step}
              </span>
              {stepAtivo > i && <CheckCircle2 size={14} color="#d4a843" style={{ marginLeft: 'auto' }} />}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function CheckoutPix({ pedidoId, onPago }) {
  const [dados, setDados] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const [verificando, setVerificando] = useState(false);

  useEffect(() => {
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
    navigator.clipboard.writeText(dados.pixCopiaECola);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden' }}
    >
      {/* Header */}
      <div style={{ background: 'rgba(212,168,67,0.06)', borderBottom: '1px solid rgba(212,168,67,0.12)', padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Lock size={14} color="#d4a843" />
          <span style={{ fontSize: 12, color: '#d4a843', fontFamily: 'Sora, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Desbloqueie as 9 fotos restantes
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 32, fontWeight: 800, color: '#f5f5f5', letterSpacing: '-0.03em' }}>R$49,90</span>
          <span style={{ fontSize: 14, color: '#555' }}>via PIX</span>
        </div>
        <p style={{ fontSize: 13, color: '#555', marginTop: 4 }}>Aprovação instantânea · Fotos liberadas em segundos</p>
      </div>

      <div style={{ padding: 24 }}>
        {!dados ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '32px 0', color: '#666' }}>
            <span className="spinner spinner-gold" /> Gerando QR Code...
          </div>
        ) : (
          <>
            {dados.qrcodeBase64 && (
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <div style={{ background: '#fff', borderRadius: 12, padding: 12, display: 'inline-block' }}>
                    <img src={dados.qrcodeBase64} alt="QR Code PIX" style={{ width: 180, height: 180, display: 'block' }} />
                  </div>
                  <AnimatePresence>
                    {verificando && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'absolute', inset: 0, background: 'rgba(13,13,13,0.85)', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <span className="spinner spinner-gold" />
                        <span style={{ fontSize: 12, color: '#d4a843' }}>Verificando...</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <p style={{ fontSize: 13, color: '#555', marginTop: 12 }}>Escaneie o QR Code com o app do seu banco</p>
              </div>
            )}

            {/* Copia e Cola */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 12, color: '#555', marginBottom: 8 }}>Ou use o código PIX Copia e Cola:</p>
              <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 14px', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#555', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                  {dados.pixCopiaECola?.slice(0, 45)}...
                </span>
                <button onClick={copiar} style={{ background: copiado ? 'rgba(34,197,94,0.15)' : 'rgba(212,168,67,0.12)', border: `1px solid ${copiado ? 'rgba(34,197,94,0.3)' : 'rgba(212,168,67,0.3)'}`, color: copiado ? '#22c55e' : '#d4a843', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontFamily: 'Sora, sans-serif', fontWeight: 600, cursor: 'pointer', transition: 'all .2s', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                  {copiado ? <><Check size={13} /> Copiado!</> : <><Copy size={13} /> Copiar</>}
                </button>
              </div>
            </div>

            {/* Garantias */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { icon: Shield, text: 'Pagamento 100% seguro' },
                { icon: Zap, text: 'Fotos liberadas na hora' },
                { icon: Mail, text: 'Enviamos por email também' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#555' }}>
                  <Icon size={13} color="#d4a843" /> {text}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

export default function Resultado({ pedido: pedidoInicial }) {
  const [pedido, setPedido] = useState(pedidoInicial);
  const [foiPago, setFoiPago] = useState(pedidoInicial.pixPago);

  useEffect(() => {
    if (pedido.status === 'foto_gratis_pronta' || pedido.status === 'pronto') return;

    const interval = setInterval(async () => {
      const r = await fetch(`/api/status?id=${pedido.id}`);
      const d = await r.json();
      if (d.fotoGratisPronta || d.status === 'foto_gratis_pronta' || d.status === 'pronto') {
        window.location.reload();
      }
    }, 3000);
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
      <Head><title>Suas fotos — FotoIA</title></Head>

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: 'rgba(13,13,13,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <a href="/" style={{ fontFamily: 'Sora, sans-serif', fontSize: 18, fontWeight: 800, color: '#d4a843', textDecoration: 'none', letterSpacing: '-0.02em' }}>
          FotoIA <span style={{ opacity: 0.4, fontSize: 12 }}>✦</span>
        </a>
        {todasProntas && (
          <a href={`/download/${pedido.id}`} className="btn btn-gold" style={{ padding: '10px 20px', fontSize: 13 }}>
            <Download size={14} /> Baixar fotos
          </a>
        )}
      </nav>

      <main style={{ minHeight: '100vh' }}>
        {processando ? (
          <div className="container">
            <TelaCarregando nome={pedido.nome} />
          </div>
        ) : (
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>

            {/* FOTO GRÁTIS */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#22c55e', padding: '5px 14px', borderRadius: 100, fontSize: 12, fontFamily: 'Sora, sans-serif', fontWeight: 600, marginBottom: 12 }}>
                  <CheckCircle2 size={12} /> Grátis
                </div>
                <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 24, fontWeight: 700, marginBottom: 6, letterSpacing: '-0.02em' }}>
                  {pedido.nome ? `Olá, ${pedido.nome.split(' ')[0]}!` : 'Sua foto profissional'}
                </h2>
                <p style={{ fontSize: 14, color: '#555' }}>Aqui está seu headshot gerado por IA</p>
              </div>

              {pedido.fotoGratis ? (
                <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 16 }}>
                  <img src={pedido.fotoGratis} alt="Sua foto profissional" style={{ width: '100%', display: 'block', aspectRatio: '1/1', objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{ aspectRatio: '1/1', background: '#141414', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
                  <span className="spinner spinner-gold" />
                  <p style={{ fontSize: 14, color: '#555' }}>Gerando sua foto grátis...</p>
                </div>
              )}

              {pedido.fotoGratis && (
                <a href={pedido.fotoGratis} download="fotoia_gratis.jpg" target="_blank" rel="noreferrer" className="btn btn-outline" style={{ width: '100%', padding: '12px', fontSize: 14 }}>
                  <Download size={14} /> Baixar esta foto
                </a>
              )}
            </motion.div>

            {/* FOTOS BLOQUEADAS + CHECKOUT */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: 20, fontWeight: 700, marginBottom: 6, letterSpacing: '-0.02em' }}>
                  {todasProntas ? '🎉 Suas 9 fotos estão prontas!' : 'Mais 9 fotos esperando por você'}
                </h3>
                <p style={{ fontSize: 14, color: '#555' }}>
                  {todasProntas ? 'Baixe todas as suas fotos profissionais' : 'Estilos variados: outdoor, formal, editorial, lifestyle e mais'}
                </p>
              </div>

              {/* Grid 3x3 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
                {todasProntas && pedido.fotosPagas.length > 0
                  ? pedido.fotosPagas.map((url, i) => (
                    <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: i * 0.04 }}
                      style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', aspectRatio: '1/1' }}>
                      <img src={url} alt={`Foto ${i + 2}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </motion.div>
                  ))
                  : Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '1/1' }}>
                      <div style={{ position: 'absolute', inset: 0, backgroundImage: pedido.fotoGratis ? `url(${pedido.fotoGratis})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(12px)', transform: 'scale(1.1)' }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(13,13,13,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Lock size={18} color="rgba(212,168,67,0.6)" />
                      </div>
                    </div>
                  ))
                }
              </div>

              {todasProntas ? (
                <a href={`/download/${pedido.id}`} className="btn btn-gold" style={{ width: '100%', padding: 18, fontSize: 15, borderRadius: 12 }}>
                  Ver e baixar todas as 10 fotos <Download size={15} />
                </a>
              ) : (
                pedido.fotoGratis && <CheckoutPix pedidoId={pedido.id} onPago={onPago} />
              )}
            </motion.div>
          </div>
        )}
      </main>

      <style jsx global>{`
        @media (max-width: 768px) {
          main > div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}

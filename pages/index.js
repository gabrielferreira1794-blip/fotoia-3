import { useState, useRef, useCallback } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle2, ArrowRight, Shield, Zap, Star, Camera, Upload, ArrowDown, Lock, MessageCircle } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const DEPOIMENTOS = [
  { nome: 'Ana Carvalho', cargo: 'Gerente de Marketing', texto: 'Ficou incrível! Usei no LinkedIn e recebi vários elogios. Processo super simples e rápido.' },
  { nome: 'Lucas Ferreira', cargo: 'Engenheiro de Software', texto: 'As fotos pareciam de estúdio profissional. Valia muito mais do que paguei.' },
  { nome: 'Mariana Costa', cargo: 'Advogada', texto: 'Enviei 3 fotos e em minutos tinha um headshot profissional perfeito para meu perfil.' },
];

const PASSOS = [
  { n: '01', icon: Upload, titulo: 'Envie 3 fotos', desc: 'Frente e os dois perfis do rosto. Quanto melhor a iluminação, melhor o resultado.' },
  { n: '02', icon: Sparkles, titulo: 'IA aprende seu rosto', desc: 'Nosso modelo Flux.1 é treinado especificamente para você em minutos.' },
  { n: '03', icon: Camera, titulo: 'Veja 1 foto grátis', desc: 'Receba um headshot profissional grátis para avaliar a qualidade.' },
  { n: '04', icon: Zap, titulo: 'Desbloqueie as 9 restantes', desc: 'Pague R$49,90 via PIX e receba as outras 9 fotos em segundos.' },
];

const PILLS = [
  { icon: CheckCircle2, text: '1 foto grátis' },
  { icon: Shield, text: 'Sem cartão de crédito' },
  { icon: Zap, text: 'Resultado em minutos' },
  { icon: CheckCircle2, text: 'PIX instantâneo' },
];

const SLOTS = [
  { slot: 'frente', emoji: '🙂', label: 'De Frente', desc: 'Olhando para a câmera' },
  { slot: 'esquerda', emoji: '👈', label: 'Perfil Esq.', desc: 'Virado para esquerda' },
  { slot: 'direita', emoji: '👉', label: 'Perfil Dir.', desc: 'Virado para direita' },
];

export default function Home() {
  const [etapa, setEtapa] = useState('form');
  const [genero, setGenero] = useState('feminino');
  const [fotos, setFotos] = useState({ frente: null, esquerda: null, direita: null });
  const [email, setEmail] = useState('');
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [erro, setErro] = useState('');
  const [pedidoId, setPedidoId] = useState(null);

  const refs = { frente: useRef(), esquerda: useRef(), direita: useRef() };

  const selecionarFoto = useCallback(async (slot, file) => {
    if (!file) return;
    const { default: compress } = await import('browser-image-compression');
    const comprimida = await compress(file, { maxSizeMB: 1, maxWidthOrHeight: 1024 });
    const preview = URL.createObjectURL(comprimida);
    setFotos(prev => ({ ...prev, [slot]: { file: comprimida, preview } }));
  }, []);

  const todasSelecionadas = fotos.frente && fotos.esquerda && fotos.direita;

  const enviar = async () => {
    setErro('');
    if (!todasSelecionadas) return setErro('Envie as 3 fotos do rosto.');
    if (!email) return setErro('Informe seu email.');
    if (!nome) return setErro('Informe seu nome.');

    setEtapa('enviando');
    try {
      const form = new FormData();
      form.append('email', email);
      form.append('nome', nome);
      form.append('whatsapp', whatsapp);
      form.append('genero', genero);
      form.append('frente', fotos.frente.file);
      form.append('esquerda', fotos.esquerda.file);
      form.append('direita', fotos.direita.file);

      const res = await fetch('/api/iniciar', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || 'Erro ao processar');

      setPedidoId(data.pedidoId);
      setEtapa('aguardando');
    } catch (e) {
      setErro(e.message);
      setEtapa('form');
    }
  };

  if (etapa === 'aguardando' && pedidoId) {
    if (typeof window !== 'undefined') {
      window.location.href = `/aguardando?pedido=${pedidoId}`;
    }
    return null;
  }

  return (
    <>
      <Head>
        <title>FotoIA — Fotos Profissionais com Inteligência Artificial</title>
        <meta name="description" content="Gere fotos profissionais com IA em minutos. Receba 1 foto grátis e desbloqueie 9 mais com PIX." />
      </Head>

      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px',
        background: 'rgba(13,13,13,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 20, fontWeight: 800, color: '#d4a843', letterSpacing: '-0.02em' }}>
          FotoIA <span style={{ opacity: 0.4, fontSize: 14 }}>✦</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <a href="#como-funciona" style={{ fontSize: 14, color: '#666', textDecoration: 'none', fontFamily: 'Inter, sans-serif', transition: 'color .2s' }}
            onMouseEnter={e => e.target.style.color = '#f5f5f5'}
            onMouseLeave={e => e.target.style.color = '#666'}
          >
            Como funciona
          </a>
          <a href="#gerar" className="btn btn-gold" style={{ padding: '10px 20px', fontSize: 13 }}>
            Começar grátis
          </a>
        </div>
      </nav>

      <main>
        {/* HERO */}
        <section style={{ position: 'relative', overflow: 'hidden', padding: '164px 0 100px', textAlign: 'center' }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse 90% 55% at 50% -5%, rgba(212,168,67,0.16) 0%, transparent 65%)',
            pointerEvents: 'none',
          }} />
          <div className="container">
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              style={{ maxWidth: 780, margin: '0 auto' }}
            >
              <motion.div variants={fadeUp} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.22)', color: '#d4a843', padding: '6px 18px', borderRadius: 100, fontSize: 12, fontFamily: 'Sora, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 32 }}>
                <Sparkles size={11} />
                Powered by Flux.1 · Modelo mais avançado do mercado
              </motion.div>

              <motion.h1 variants={fadeUp} style={{ fontSize: 'clamp(42px, 7vw, 80px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: 24, fontFamily: 'Sora, sans-serif' }}>
                Sua foto profissional<br />
                <span style={{ background: 'linear-gradient(135deg, #d4a843 0%, #f5cc68 60%, #c9973a 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  gerada por IA
                </span><br />
                em minutos
              </motion.h1>

              <motion.p variants={fadeUp} style={{ fontSize: 18, color: '#777', lineHeight: 1.75, marginBottom: 36 }}>
                Envie 3 fotos do seu rosto e receba <strong style={{ color: '#e8e4de', fontWeight: 600 }}>1 foto grátis</strong> agora.<br />
                Gostou? Desbloqueie as outras 9 por <strong style={{ color: '#e8e4de', fontWeight: 600 }}>R$ 49,90 via PIX</strong>.
              </motion.p>

              <motion.div variants={fadeUp} style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 44 }}>
                {PILLS.map(({ icon: Icon, text }) => (
                  <span key={text} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', padding: '8px 16px', borderRadius: 100, fontSize: 13, color: '#c8c4be' }}>
                    <Icon size={13} color="#d4a843" /> {text}
                  </span>
                ))}
              </motion.div>

              <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <a href="#gerar" className="btn btn-gold" style={{ padding: '18px 44px', fontSize: 16 }}>
                  Gerar minha foto grátis <ArrowDown size={16} />
                </a>
                <p style={{ fontSize: 13, color: '#444' }}>4.200+ profissionais já usaram · Sem cadastro</p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* EXEMPLOS */}
        <section id="exemplos" style={{ padding: '80px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="container">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} style={{ textAlign: 'center', marginBottom: 48 }}>
              <h2 style={{ fontSize: 'clamp(24px, 4vw, 42px)', fontWeight: 700, marginBottom: 12, fontFamily: 'Sora, sans-serif', letterSpacing: '-0.02em' }}>
                De selfie para headshot profissional
              </h2>
              <p style={{ fontSize: 16, color: '#666' }}>Resultados reais gerados com Flux.1 AI</p>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
              {[
                { label: 'Headshot Executivo', desc: 'LinkedIn e portfólio profissional' },
                { label: 'Lifestyle Urbano', desc: 'Estilo natural e descontraído' },
                { label: 'Editorial Fashion', desc: 'Look editorial de alta produção' },
              ].map((ex, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20, overflow: 'hidden' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <div style={{ aspectRatio: '3/4', borderRadius: 10, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>📸</div>
                      <span style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.75)', color: '#999', padding: '3px 10px', borderRadius: 100, fontSize: 11, fontFamily: 'Sora, sans-serif' }}>Antes</span>
                    </div>
                    <ArrowRight size={18} color="#3a3a3a" style={{ flexShrink: 0 }} />
                    <div style={{ position: 'relative', flex: 1 }}>
                      <div style={{ aspectRatio: '3/4', borderRadius: 10, background: 'rgba(212,168,67,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>✨</div>
                      <span style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(212,168,67,0.18)', color: '#d4a843', padding: '3px 10px', borderRadius: 100, fontSize: 11, fontFamily: 'Sora, sans-serif' }}>Depois</span>
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
                    <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{ex.label}</p>
                    <p style={{ fontSize: 12, color: '#555' }}>{ex.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FORM */}
        <section id="gerar" style={{ padding: '60px 0 100px' }}>
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              style={{
                background: '#141414',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 24,
                padding: 48,
                maxWidth: 680,
                margin: '0 auto',
                boxShadow: '0 0 80px rgba(212,168,67,0.05), 0 32px 80px rgba(0,0,0,0.4)',
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: 36 }}>
                <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>
                  Gere sua foto grátis agora
                </h2>
                <p style={{ fontSize: 14, color: '#555' }}>Preencha em 1 minuto · Sem cartão de crédito</p>
              </div>

              {/* Gênero */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
                {['feminino', 'masculino'].map(g => (
                  <button key={g} type="button" onClick={() => setGenero(g)} style={{
                    flex: 1, padding: '12px 16px',
                    background: genero === g ? 'rgba(212,168,67,0.12)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${genero === g ? 'rgba(212,168,67,0.4)' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 10,
                    color: genero === g ? '#d4a843' : '#555',
                    fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 600,
                    cursor: 'pointer', transition: 'all .2s',
                  }}>
                    {g === 'feminino' ? '👩 Feminino' : '👨 Masculino'}
                  </button>
                ))}
              </div>

              {/* Label fotos */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#c8c4be' }}>3 fotos do rosto <span style={{ color: '#d4a843' }}>*</span></span>
                <span style={{ fontSize: 12, color: '#555' }}>frente + perfil esquerdo + direito</span>
              </div>

              {/* Foto slots */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
                {SLOTS.map(({ slot, emoji, label, desc }) => (
                  <div
                    key={slot}
                    className="foto-slot"
                    onClick={() => refs[slot].current?.click()}
                    style={{
                      position: 'relative', aspectRatio: '3/4',
                      background: fotos[slot] ? 'transparent' : 'rgba(255,255,255,0.02)',
                      border: `1.5px dashed ${fotos[slot] ? 'rgba(212,168,67,0.5)' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: 12,
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      gap: 6, cursor: 'pointer', transition: 'all .2s',
                      overflow: 'hidden', textAlign: 'center', padding: 12,
                    }}
                  >
                    <input ref={refs[slot]} type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={e => selecionarFoto(slot, e.target.files[0])} />
                    {fotos[slot] ? (
                      <>
                        <img src={fotos[slot].preview} alt={label} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div className="foto-slot-overlay">
                          <CheckCircle2 size={22} color="#d4a843" />
                          <span style={{ fontSize: 11, color: '#fff', fontFamily: 'Sora, sans-serif' }}>Trocar</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: 26 }}>{emoji}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, fontFamily: 'Sora, sans-serif', color: '#c8c4be' }}>{label}</div>
                        <div style={{ fontSize: 10, color: '#555', lineHeight: 1.4 }}>{desc}</div>
                        <div style={{ fontSize: 11, color: '#d4a843', background: 'rgba(212,168,67,0.1)', padding: '4px 12px', borderRadius: 100, marginTop: 2 }}>+ Adicionar</div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Campos */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 13, color: '#666', fontFamily: 'Inter, sans-serif' }}>Nome completo <span style={{ color: '#d4a843' }}>*</span></label>
                    <input type="text" placeholder="Seu nome" value={nome} onChange={e => setNome(e.target.value)} className="input-base" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 13, color: '#666', fontFamily: 'Inter, sans-serif' }}>Email <span style={{ color: '#d4a843' }}>*</span></label>
                    <input type="email" placeholder="para receber as fotos" value={email} onChange={e => setEmail(e.target.value)} className="input-base" />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 13, color: '#666', fontFamily: 'Inter, sans-serif' }}>
                    WhatsApp <span style={{ fontSize: 11, color: '#444' }}>(opcional — para receber aviso)</span>
                  </label>
                  <input type="tel" placeholder="(11) 99999-9999" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className="input-base" />
                </div>
              </div>

              {/* Erro */}
              <AnimatePresence>
                {erro && (
                  <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    style={{ background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.2)', color: '#ff8080', padding: '12px 16px', borderRadius: 10, fontSize: 14, marginBottom: 16, overflow: 'hidden' }}>
                    {erro}
                  </motion.div>
                )}
              </AnimatePresence>

              <button className="btn btn-gold" onClick={enviar}
                disabled={etapa === 'enviando' || !todasSelecionadas || !email || !nome}
                style={{ width: '100%', padding: 18, fontSize: 16, borderRadius: 12, letterSpacing: '-0.01em' }}>
                {etapa === 'enviando' ? (
                  <><span className="spinner" /> Enviando fotos...</>
                ) : (
                  <><Sparkles size={16} /> Gerar minha foto grátis</>
                )}
              </button>

              <p style={{ textAlign: 'center', fontSize: 12, color: '#444', marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                <Shield size={11} color="#555" /> Suas fotos são usadas apenas para gerar as imagens e excluídas em 7 dias.
              </p>
            </motion.div>
          </div>
        </section>

        {/* COMO FUNCIONA */}
        <section id="como-funciona" style={{ padding: '80px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="container">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
              style={{ textAlign: 'center', marginBottom: 48 }}>
              <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 'clamp(24px, 4vw, 42px)', fontWeight: 700, marginBottom: 12, letterSpacing: '-0.02em' }}>
                Como funciona
              </h2>
              <p style={{ fontSize: 16, color: '#555' }}>4 passos simples, resultado profissional</p>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
              {PASSOS.map(({ n, icon: Icon, titulo, desc }, i) => (
                <motion.div key={n}
                  initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.09 }}
                  style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 28 }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 38, fontWeight: 800, color: 'rgba(212,168,67,0.18)', lineHeight: 1 }}>{n}</div>
                    <div style={{ width: 38, height: 38, background: 'rgba(212,168,67,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4a843', flexShrink: 0 }}>
                      <Icon size={18} />
                    </div>
                  </div>
                  <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: 16, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.01em' }}>{titulo}</h3>
                  <p style={{ fontSize: 14, color: '#555', lineHeight: 1.65 }}>{desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* DEPOIMENTOS */}
        <section style={{ padding: '80px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="container">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
              style={{ textAlign: 'center', marginBottom: 48 }}>
              <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 'clamp(24px, 4vw, 42px)', fontWeight: 700, marginBottom: 12, letterSpacing: '-0.02em' }}>
                O que nossos clientes dizem
              </h2>
              <p style={{ fontSize: 16, color: '#555' }}>Mais de 4.200 profissionais satisfeitos</p>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {DEPOIMENTOS.map((d, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.09 }}
                  style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 28 }}
                >
                  <div style={{ display: 'flex', gap: 3, marginBottom: 16 }}>
                    {Array.from({ length: 5 }).map((_, j) => <Star key={j} size={13} fill="#d4a843" color="#d4a843" />)}
                  </div>
                  <p style={{ fontSize: 15, color: '#c8c4be', lineHeight: 1.7, marginBottom: 20 }}>"{d.texto}"</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#d4a843', fontFamily: 'Sora, sans-serif', flexShrink: 0 }}>
                      {d.nome[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'Sora, sans-serif' }}>{d.nome}</div>
                      <div style={{ fontSize: 12, color: '#555' }}>{d.cargo}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section style={{ padding: '100px 0', background: 'radial-gradient(ellipse 60% 80% at 50% 50%, rgba(212,168,67,0.07) 0%, transparent 65%)', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
          <div className="container">
            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 800, marginBottom: 16, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                Pronto para sua melhor<br />foto profissional?
              </h2>
              <p style={{ fontSize: 17, color: '#555', marginBottom: 36 }}>1 foto grátis. Sem cartão de crédito. Resultado em minutos.</p>
              <a href="#gerar" className="btn btn-gold" style={{ padding: '18px 44px', fontSize: 16 }}>
                Começar agora — é grátis <Sparkles size={15} />
              </a>
            </motion.div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer style={{ padding: '36px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
        <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 18, fontWeight: 800, color: '#d4a843', marginBottom: 10, letterSpacing: '-0.02em' }}>
          FotoIA <span style={{ opacity: 0.4, fontSize: 13 }}>✦</span>
        </div>
        <p style={{ fontSize: 13, color: '#3a3a3a' }}>
          © {new Date().getFullYear()} FotoIA · Fotos geradas com Flux.1 AI · Suas fotos são excluídas em 7 dias
        </p>
      </footer>
    </>
  );
}

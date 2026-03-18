import { useState, useRef, useCallback } from 'react';
import Head from 'next/head';
import s from '../styles/Home.module.css';

const EXEMPLOS = [
  { label: 'Headshot Executivo' },
  { label: 'Lifestyle Urbano' },
  { label: 'Editorial Fashion' },
];

const DEPOIMENTOS = [
  { nome: 'Ana Carvalho', cargo: 'Gerente de Marketing', texto: 'Ficou incrível! Usei no LinkedIn e recebi vários elogios. Processo super simples e rápido.' },
  { nome: 'Lucas Ferreira', cargo: 'Engenheiro de Software', texto: 'As fotos pareciam de estúdio profissional. Valia muito mais do que paguei.' },
  { nome: 'Mariana Costa', cargo: 'Advogada', texto: 'Enviei minha foto e em menos de 1 minuto tinha um headshot profissional perfeito.' },
];

export default function Home() {
  const [etapa, setEtapa] = useState('form');
  const [genero, setGenero] = useState('feminino');
  const [foto, setFoto] = useState(null);
  const [email, setEmail] = useState('');
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [erro, setErro] = useState('');
  const [pedidoId, setPedidoId] = useState(null);

  const refFoto = useRef();

  const selecionarFoto = useCallback(async (file) => {
    if (!file) return;
    const { default: compress } = await import('browser-image-compression');
    const comprimida = await compress(file, { maxSizeMB: 1, maxWidthOrHeight: 1024 });
    const preview = URL.createObjectURL(comprimida);
    setFoto({ file: comprimida, preview });
  }, []);

  const enviar = async () => {
    setErro('');
    if (!foto) return setErro('Envie uma foto do seu rosto.');
    if (!email) return setErro('Informe seu email.');
    if (!nome) return setErro('Informe seu nome.');

    setEtapa('enviando');
    try {
      const form = new FormData();
      form.append('email', email);
      form.append('nome', nome);
      form.append('whatsapp', whatsapp);
      form.append('genero', genero);
      form.append('frente', foto.file);

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
        <meta name="description" content="Gere fotos profissionais com IA em menos de 1 minuto. Receba 1 foto grátis e desbloqueie 9 mais com PIX." />
      </Head>

      <nav className={s.nav}>
        <div className="container" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div className={s.logo}>FotoIA ✦</div>
          <a href="#como-funciona" className={s.navLink}>Como funciona</a>
        </div>
      </nav>

      <main>
        <section className={s.hero}>
          <div className={s.heroBg} />
          <div className="container">
            <div className={s.heroContent}>
              <div className={`${s.badge} fade-up`}>
                ✦ Powered by InstantID · Resultado em menos de 1 minuto
              </div>
              <h1 className={`${s.heroTitle} fade-up-1`}>
                Sua foto profissional<br />
                <span className={s.heroHighlight}>gerada por IA</span><br />
                em minutos
              </h1>
              <p className={`${s.heroSub} fade-up-2`}>
                Envie <strong>1 foto</strong> do seu rosto e receba <strong>1 foto grátis</strong> em menos de 1 minuto.<br />
                Gostou? Desbloqueie as outras 9 por <strong>R$ 49,90 via PIX</strong>.
              </p>
              <div className={`${s.heroPills} fade-up-3`}>
                {['✓ 1 foto grátis', '✓ Resultado em ~1 minuto', '✓ Sem cadastro de cartão', '✓ PIX instantâneo'].map(p => (
                  <span key={p} className={s.pill}>{p}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className={s.exemplos} id="como-funciona">
          <div className="container">
            <h2 className={s.sectionTitle}>De selfie para headshot profissional</h2>
            <div className={s.exemplosGrid}>
              {EXEMPLOS.map((ex, i) => (
                <div key={i} className={s.exemploCard}>
                  <div className={s.exemploImgs}>
                    <div className={s.exemploImg}>
                      <div className={s.exemploLabel}>Antes</div>
                      <div className={s.imgPlaceholder}>📸</div>
                    </div>
                    <div className={s.exemploArrow}>→</div>
                    <div className={s.exemploImg}>
                      <div className={`${s.exemploLabel} ${s.labelDepois}`}>Depois</div>
                      <div className={`${s.imgPlaceholder} ${s.imgGerada}`}>✨</div>
                    </div>
                  </div>
                  <p className={s.exemploCaption}>{ex.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={s.formSection} id="gerar">
          <div className="container">
            <div className={s.formCard}>
              <h2 className={s.formTitle}>Gere sua foto grátis agora</h2>
              <p className={s.formSub}>Resultado em menos de 1 minuto · Sem cartão de crédito</p>

              <div className={s.generoToggle}>
                {['feminino', 'masculino'].map(g => (
                  <button
                    key={g}
                    className={`${s.generoBtn} ${genero === g ? s.generoBtnAtivo : ''}`}
                    onClick={() => setGenero(g)}
                    type="button"
                  >
                    {g === 'feminino' ? '👩 Feminino' : '👨 Masculino'}
                  </button>
                ))}
              </div>

              <div className={s.fotosLabel}>
                <span>Envie 1 foto do seu rosto</span>
                <span className={s.fotosHint}>foto de frente, boa iluminação, rosto visível</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                <div
                  className={s.fotoSlot}
                  style={{ width: '200px', height: '220px' }}
                  onClick={() => refFoto.current?.click()}
                >
                  <input
                    ref={refFoto}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => selecionarFoto(e.target.files[0])}
                  />
                  {foto ? (
                    <>
                      <img src={foto.preview} alt="sua foto" className={s.fotoPreview} />
                      <div className={s.fotoSlotOverlay}>
                        <span className={s.fotoSlotCheck}>✓</span>
                        <span className={s.fotoSlotTrocar}>Trocar</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={s.fotoSlotIcon}>🤳</div>
                      <div className={s.fotoSlotLabel}>Sua foto</div>
                      <div className={s.fotoSlotDesc}>Frente, boa iluminação</div>
                      <div className={s.fotoSlotBtn}>+ Adicionar</div>
                    </>
                  )}
                </div>
              </div>

              <div className={s.campos}>
                <div className={s.campoRow}>
                  <div className={s.campo}>
                    <label>Nome completo <span className={s.req}>*</span></label>
                    <input type="text" placeholder="Seu nome" value={nome} onChange={e => setNome(e.target.value)} className={s.input} />
                  </div>
                  <div className={s.campo}>
                    <label>Email <span className={s.req}>*</span></label>
                    <input type="email" placeholder="para receber as fotos" value={email} onChange={e => setEmail(e.target.value)} className={s.input} />
                  </div>
                </div>
                <div className={s.campo}>
                  <label>WhatsApp <span className={s.opt}>(opcional)</span></label>
                  <input type="tel" placeholder="(11) 99999-9999" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className={s.input} />
                </div>
              </div>

              {erro && <div className={s.erro}>{erro}</div>}

              <button
                className={`btn btn-gold ${s.btnEnviar}`}
                onClick={enviar}
                disabled={etapa === 'enviando' || !foto || !email || !nome}
              >
                {etapa === 'enviando' ? (
                  <><span className="spinner" /> Enviando foto...</>
                ) : (
                  <>✨ Gerar minha foto grátis</>
                )}
              </button>

              <p className={s.formNote}>
                🔒 Sua foto é usada apenas para gerar as imagens e é excluída em 7 dias.
              </p>
            </div>
          </div>
        </section>

        <section className={`${s.comoFunciona} section`}>
          <div className="container">
            <h2 className={s.sectionTitle}>Como funciona</h2>
            <div className={s.passos}>
              {[
                { n:'01', titulo:'Envie 1 foto', desc:'Uma foto de frente com boa iluminação. Quanto melhor a foto, melhor o resultado.' },
                { n:'02', titulo:'IA processa seu rosto', desc:'Nossa IA analisa seu rosto e gera a foto profissional em menos de 1 minuto.' },
                { n:'03', titulo:'Veja 1 foto grátis', desc:'Receba um headshot profissional grátis para avaliar a qualidade.' },
                { n:'04', titulo:'Desbloqueie as 9 restantes', desc:'Gostou? Pague R$49,90 via PIX e receba as outras 9 fotos instantaneamente.' },
              ].map(({ n, titulo, desc }) => (
                <div key={n} className={s.passo}>
                  <div className={s.passoNum}>{n}</div>
                  <h3 className={s.passoTitulo}>{titulo}</h3>
                  <p className={s.passodesc}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={`${s.depoimentos} section`}>
          <div className="container">
            <h2 className={s.sectionTitle}>O que nossos clientes dizem</h2>
            <div className={s.depoimentosGrid}>
              {DEPOIMENTOS.map((d, i) => (
                <div key={i} className={s.depoimento}>
                  <div className={s.depoimentoStars}>★★★★★</div>
                  <p className={s.depoimentoTexto}>"{d.texto}"</p>
                  <div className={s.depoimentoAutor}>
                    <div className={s.depoimentoAvatar}>{d.nome[0]}</div>
                    <div>
                      <div className={s.depoimentoNome}>{d.nome}</div>
                      <div className={s.depoimentoCargo}>{d.cargo}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={s.ctaFinal}>
          <div className="container" style={{ textAlign: 'center' }}>
            <h2 className={s.ctaTitulo}>Pronto para sua melhor foto profissional?</h2>
            <p className={s.ctaSub}>1 foto grátis. Resultado em menos de 1 minuto. Sem cartão de crédito.</p>
            <a href="#gerar" className="btn btn-gold">Começar agora — é grátis ✦</a>
          </div>
        </section>
      </main>

      <footer className={s.footer}>
        <div className="container" style={{ textAlign:'center' }}>
          <div className={s.logo} style={{ marginBottom: 12 }}>FotoIA ✦</div>
          <p>© {new Date().getFullYear()} FotoIA · Fotos geradas com InstantID AI · Suas fotos são excluídas em 7 dias</p>
        </div>
      </footer>
    </>
  );
}
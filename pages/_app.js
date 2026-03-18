import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />

      <a href="https://wa.me/5531973621147?text=Oi!%20Tenho%20uma%20duvida%20sobre%20o%20FotoIA" target="_blank" rel="noopener noreferrer" style={{ position:'fixed', bottom:'24px', right:'24px', zIndex:9999, backgroundColor:'#25D366', borderRadius:'50px', padding:'12px 20px', display:'flex', alignItems:'center', gap:'8px', boxShadow:'0 4px 20px rgba(37,211,102,0.4)', textDecoration:'none', color:'#fff', fontFamily:'sans-serif', fontWeight:'600', fontSize:'14px' }}>
        💬 Tire suas dúvidas
      </a>
    </>
  );
}
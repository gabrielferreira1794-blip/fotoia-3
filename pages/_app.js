import '../styles/globals.css';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />

      <motion.a
        href="https://wa.me/5531973621147?text=Oi!%20Tenho%20uma%20duvida%20sobre%20o%20FotoIA"
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.97 }}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          backgroundColor: '#25D366',
          borderRadius: 50,
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          boxShadow: '0 4px 24px rgba(37,211,102,0.35)',
          textDecoration: 'none',
          color: '#fff',
          fontFamily: 'Sora, sans-serif',
          fontWeight: 600,
          fontSize: 14,
          letterSpacing: '-0.01em',
        }}
      >
        <MessageCircle size={18} fill="white" />
        Tire suas dúvidas
      </motion.a>
    </>
  );
}

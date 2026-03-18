import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Aguardando() {
  const router = useRouter();
  const { pedido } = router.query;

  useEffect(() => {
    if (pedido) {
      // Redireciona imediatamente para a página de resultado
      router.replace(`/resultado/${pedido}`);
    }
  }, [pedido, router]);

  return (
    <>
      <Head><title>Redirecionando... — FotoIA</title></Head>
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0d0d0d', color:'#888', fontFamily:'sans-serif' }}>
        Redirecionando...
      </div>
    </>
  );
}

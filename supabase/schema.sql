-- =============================================
-- FOTOIA v3 — Cole no SQL Editor do Supabase
-- =============================================

CREATE TABLE pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  nome TEXT,
  whatsapp TEXT,
  genero TEXT DEFAULT 'feminino',   -- feminino | masculino

  -- 3 fotos de rosto obrigatórias para o treino LoRA
  foto_frente TEXT,
  foto_esquerda TEXT,
  foto_direita TEXT,

  status TEXT DEFAULT 'processando',
  -- processando → foto_gratis_pronta → aguardando_pagamento
  -- → pago → gerando_resto → pronto → erro

  foto_gratis TEXT,      -- 1ª foto exibida grátis
  fotos_pagas TEXT[],    -- 9 fotos desbloqueadas após PIX
  lora_url TEXT,         -- modelo LoRA treinado (reutilizável em recompras)
  fal_request_id TEXT,

  -- PIX Efí Bank
  pix_txid          TEXT UNIQUE,   -- txid da cobrança (UUID do pedido sem hífens)
  pix_copia_cola     TEXT,          -- código Pix Copia e Cola
  pix_qrcode_base64  TEXT,          -- QR Code em base64 (data:image/png;base64,...)
  pix_link           TEXT,          -- link da página de pagamento Efí
  pix_pago           BOOLEAN DEFAULT FALSE,
  pix_pago_em        TIMESTAMPTZ,

  custo_ia NUMERIC(8,4),
  erro_msg TEXT,

  created_at   TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at   TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'
);

CREATE INDEX ON pedidos(email);
CREATE INDEX ON pedidos(pix_txid);
CREATE INDEX ON pedidos(status);
CREATE INDEX ON pedidos(whatsapp);

ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only" ON pedidos USING (auth.role() = 'service_role');

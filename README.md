# FotoIA v3 — AI Photo SaaS

Plataforma de fotos profissionais geradas por IA. O cliente envia 3 fotos do rosto, recebe 1 headshot grátis e paga R$49,90 via PIX para desbloquear as outras 9.

## Stack
- **Frontend/Backend:** Next.js 14 (Pages Router)
- **Banco de dados:** Supabase
- **IA:** fal.ai (Flux.1 LoRA)
- **Armazenamento:** Cloudflare R2
- **Pagamentos PIX:** Efí Bank (Conta Pro — aceita Pessoa Física com CPF)
- **Email:** Resend
- **Deploy:** Vercel

## Fluxo completo
```
Cliente envia 3 fotos + dados
    ↓ /api/iniciar
Upload R2 → treino fal.ai LoRA (~15 min)
    ↓ webhook /api/webhooks/fal-treino
Gera 1 foto grátis → status: foto_gratis_pronta
    ↓ /resultado/[id] exibe foto grátis + QR PIX
Cliente paga PIX → Efí Bank confirma
    ↓ webhook /api/webhooks/pix
Gera 9 fotos → email automático → /download/[id]
```

## Deploy em 8 passos

### 1. Supabase
1. Crie projeto em supabase.com
2. SQL Editor → cole o conteúdo de `supabase/schema.sql` → Run
3. Copie: Project URL, anon key, service_role key

### 2. fal.ai
1. Crie conta em fal.ai
2. Keys → Create new key → copie a chave
3. Billing → adicione crédito (mínimo $10 para testes)

### 3. Cloudflare R2
1. Crie conta em cloudflare.com
2. R2 → Create bucket → nome: `fotoia`
3. Ative Public Access → anote a Public URL
4. Manage R2 API Tokens → Create Token (Read & Write) → copie Access Key ID e Secret

### 4. Efí Bank (Pessoa Física — aceita CPF)
1. Abra conta em sejaefi.com.br → Conta Efí Pro
2. Painel → Pix → Minhas Chaves → adicione sua chave
3. Painel → API → Minhas Aplicações → Criar Aplicação
4. Anote Client_Id e Client_Secret
5. Certificados → Criar certificado de produção → baixe o .p12
6. Converta o .p12 para Base64:
   - Mac/Linux: `base64 -i certificado_producao.p12 | tr -d '\n'`
   - Windows PowerShell: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("certificado.p12"))`

### 5. Resend
1. Crie conta em resend.com
2. Domains → verifique seu domínio
3. API Keys → Create API Key → copie a chave

### 6. Configurar variáveis
1. Copie `.env.example` → renomeie para `.env.local`
2. Preencha todos os valores

### 7. Deploy na Vercel
1. GitHub Desktop → publique o repositório no GitHub
2. vercel.com → Add New → Project → importe o repositório
3. Adicione todas as variáveis de ambiente (copie do .env.local)
4. Deploy

### 8. Registrar webhook da Efí (UMA VEZ após deploy)
Acesse no navegador:
```
https://seusite.vercel.app/api/admin/setup-webhook?secret=SEU_SETUP_SECRET
```
Deve retornar: `{"ok":true,"mensagem":"Webhook registrado com sucesso na Efí Bank!"}`

## Teste em homologação
1. Defina `EFI_SANDBOX=true` nas variáveis
2. Use as credenciais de homologação do painel Efí (seção "Homologação")
3. Faça um pedido de teste — o PIX não cobra dinheiro real em sandbox

## Estrutura de arquivos
```
fotoia/
├── pages/
│   ├── index.js                    ← Landing page + formulário
│   ├── resultado/[id].js           ← Foto grátis + PIX
│   ├── download/[id].js            ← Galeria + download
│   └── api/
│       ├── iniciar.js              ← Upload + inicia treino IA
│       ├── pagar.js                ← Cria cobrança PIX (Efí Bank)
│       ├── status.js               ← Polling de status
│       ├── fotos.js                ← Retorna URLs das fotos
│       ├── admin/
│       │   └── setup-webhook.js    ← Registra webhook na Efí (1x)
│       └── webhooks/
│           ├── fal-treino.js       ← Treino concluído → gera foto grátis
│           └── pix.js              ← PIX pago → gera 9 fotos + email
├── utils/
│   ├── pix.js                      ← Efí Bank: cobrança, webhook, validação
│   ├── ia.js                       ← fal.ai: treino LoRA + geração
│   ├── storage.js                  ← Cloudflare R2
│   ├── email.js                    ← Resend
│   └── supabase.js                 ← Clientes Supabase
└── supabase/
    └── schema.sql                  ← Schema do banco de dados
```

## Custos estimados por cliente
| Item | Custo |
|------|-------|
| Treino LoRA (fal.ai) | ~$0,45 |
| Geração 10 fotos (fal.ai) | ~$0,30 |
| Armazenamento R2 | ~$0,00 |
| Taxa PIX (Efí ~0,5%) | ~R$0,25 |
| **Total** | **~R$4,50** |
| **Venda** | **R$49,90** |
| **Margem bruta** | **~91%** |

// utils/ia.js — Híbrido: PhotoMaker para prévia rápida + LoRA para qualidade máxima
import { fal } from '@fal-ai/client';

fal.config({ credentials: process.env.FAL_KEY });

const PROMPTS_PHOTOMAKER = {
  feminino: 'professional headshot photo of a woman img, studio lighting, clean white background, sharp focus, natural makeup, highly realistic, 8k photography',
  masculino: 'professional headshot photo of a man img, studio lighting, clean white background, sharp focus, highly realistic, 8k photography',
};

const PROMPTS_LORA = {
  feminino: [
    'portrait of FOTOPESSOA, warm natural light, outdoor cafe bokeh background, lifestyle photography',
    'FOTOPESSOA elegant formal blazer, confident professional pose, corporate gradient background',
    'close-up portrait of FOTOPESSOA, golden hour sunlight, cinematic color grading, editorial style',
    'FOTOPESSOA smiling naturally, modern city street background, candid documentary style, vibrant',
    'FOTOPESSOA business casual outfit, contemporary glass office building, bright and airy',
    'dramatic portrait of FOTOPESSOA, rembrandt lighting, dark studio background, high fashion editorial',
    'FOTOPESSOA outdoor park greenery, relaxed happy expression, lifestyle photography, warm tones',
    'fashion editorial portrait of FOTOPESSOA, plain cream background, minimal style, high-end magazine',
    'FOTOPESSOA confident smile, modern coworking space background, bright natural light',
  ],
  masculino: [
    'portrait of FOTOPESSOA, warm natural light, outdoor cafe bokeh background, lifestyle photography',
    'FOTOPESSOA formal suit and tie, confident professional pose, corporate gradient background',
    'close-up portrait of FOTOPESSOA, golden hour sunlight, cinematic color grading, editorial style',
    'FOTOPESSOA smiling naturally, modern city street background, candid documentary style, vibrant',
    'FOTOPESSOA business casual, contemporary office setting, bright professional atmosphere',
    'dramatic portrait of FOTOPESSOA, rembrandt studio lighting, dark background, editorial',
    'FOTOPESSOA outdoor greenery park, relaxed confident pose, lifestyle photography warm tones',
    'editorial portrait of FOTOPESSOA, plain cream background, minimal clean style, high-end',
    'FOTOPESSOA confident smile, modern coworking space background, bright natural light',
  ],
};

// ── PRÉVIA RÁPIDA via PhotoMaker (~1 minuto) ─────────────────────────────────
/**
 * Inicia geração da foto grátis via PhotoMaker + webhook
 * Input: URL do ZIP com as 3 fotos já salvas no R2
 */
export const iniciarGeracaoGratis = async (zipUrl, pedidoId, genero) => {
  const g = genero || 'feminino';
  const webhookUrl = `${process.env.NEXT_PUBLIC_URL}/api/webhooks/fal-treino?pedidoId=${pedidoId}`;

  const { request_id } = await fal.queue.submit('fal-ai/photomaker', {
    input: {
      image_archive_url: zipUrl,
      prompt: PROMPTS_PHOTOMAKER[g],
      base_pipeline: 'photomaker',
      style: 'Photographic',
      style_strength: 25,
      num_inference_steps: 50,
      guidance_scale: 5,
      num_images: 1,
    },
    webhookUrl,
  });

  return request_id;
};

// ── 9 FOTOS PAGAS via LoRA (máxima qualidade) ────────────────────────────────
/**
 * Gera as 9 fotos pagas usando o modelo LoRA treinado
 * Chamado após PIX confirmado
 */
export const gerarFotosPagas = async (loraUrl, genero) => {
  const g = genero || 'feminino';
  const prompts = PROMPTS_LORA[g] || PROMPTS_LORA.feminino;

  return Promise.all(
    prompts.map(async (prompt) => {
      const result = await fal.run('fal-ai/flux-lora', {
        input: {
          prompt,
          loras: [{ path: loraUrl, scale: 0.9 }],
          num_inference_steps: 28,
          guidance_scale: 3.5,
          num_images: 1,
        },
      });
      return result.images[0].url;
    })
  );
};

// ── TREINO LoRA em paralelo ───────────────────────────────────────────────────
/**
 * Inicia treino LoRA em background (para as 9 fotos pagas)
 * Webhook diferente — salva o loraUrl quando terminar
 */
export const iniciarTreino = async (zipDataUrl, pedidoId) => {
  const webhookUrl = `${process.env.NEXT_PUBLIC_URL}/api/webhooks/fal-treino?pedidoId=${pedidoId}&tipo=treino`;

  const { request_id } = await fal.queue.submit('fal-ai/flux-lora-fast-training', {
    input: {
      images_data_url: zipDataUrl,
      trigger_word: 'FOTOPESSOA',
      steps: 1000,
    },
    webhookUrl,
  });

  return request_id;
};

// ── Empacota as 3 fotos em ZIP ────────────────────────────────────────────────
export const criarZipRosto = async (bufferFrente, bufferEsquerda, bufferDireita) => {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  zip.file('rosto_frente.jpg', bufferFrente);
  zip.file('rosto_esquerda.jpg', bufferEsquerda);
  zip.file('rosto_direita.jpg', bufferDireita);

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  return `data:application/zip;base64,${zipBuffer.toString('base64')}`;
};
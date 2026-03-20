// utils/ia.js — USO (Subject-Driven) para prévia rápida + LoRA para 9 fotos pagas
import { fal } from '@fal-ai/client';

fal.config({ credentials: process.env.FAL_KEY });

const PROMPTS_PREVIA = {
  feminino: 'professional headshot photo of a woman, studio lighting, clean white background, sharp focus, natural makeup, elegant blazer, ultra realistic portrait photography, 8k',
  masculino: 'professional headshot photo of a man, studio lighting, clean white background, sharp focus, suit and tie, ultra realistic portrait photography, 8k',
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
    'FOTOPESSOA confident smile, modern coworking space, bright natural light, professional',
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
    'FOTOPESSOA confident smile, modern coworking space, bright natural light, professional',
  ],
};

const NEG = 'blurry, low quality, distorted, deformed, ugly, bad anatomy, watermark, text, nsfw';

// ── PRÉVIA via USO (~30-60s, usa as 3 fotos de referência) ───────────────────
export const iniciarGeracaoGratis = async (urlFrente, urlEsquerda, urlDireita, pedidoId, genero) => {
  const g = genero || 'feminino';
  const webhookUrl = `${process.env.NEXT_PUBLIC_URL}/api/webhooks/fal-treino?pedidoId=${pedidoId}&tipo=previa`;

  const { request_id } = await fal.queue.submit('fal-ai/uso', {
    input: {
      prompt: PROMPTS_PREVIA[g],
      negative_prompt: NEG,
      input_image_urls: [urlFrente, urlEsquerda, urlDireita],
      image_size: 'portrait_4_3',
      num_inference_steps: 28,
      guidance_scale: 4,
      num_images: 1,
      enable_safety_checker: true,
      output_format: 'jpeg',
    },
    webhookUrl,
  });

  return request_id;
};

// ── 9 FOTOS PAGAS via LoRA (máxima qualidade, após PIX confirmado) ────────────
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

// ── ZIP das 3 fotos para o treino ─────────────────────────────────────────────
export const criarZipRosto = async (bufferFrente, bufferEsquerda, bufferDireita) => {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  zip.file('rosto_frente.jpg', bufferFrente);
  zip.file('rosto_esquerda.jpg', bufferEsquerda);
  zip.file('rosto_direita.jpg', bufferDireita);
  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  return `data:application/zip;base64,${zipBuffer.toString('base64')}`;
};
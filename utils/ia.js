// utils/ia.js — PuLID para prévia rápida + LoRA para as 9 fotos pagas
import { fal } from '@fal-ai/client';

fal.config({ credentials: process.env.FAL_KEY });

const NEG = 'flaws in the eyes, flaws in the face, lowres, non-HDRi, low quality, worst quality, artifacts, noise, text, watermark, glitch, deformed, mutated, ugly, disfigured, low resolution, blurry, nsfw';

const PROMPTS_PREVIA = {
  feminino: 'professional headshot of a woman, studio lighting, clean white background, sharp focus, natural makeup, highly realistic portrait photography, 8k',
  masculino: 'professional headshot of a man, studio lighting, clean white background, sharp focus, highly realistic portrait photography, 8k',
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

// ── PRÉVIA via PuLID (~30-60s, alta fidelidade facial) ────────────────────────
export const iniciarGeracaoGratis = async (urlFrente, urlEsquerda, urlDireita, pedidoId, genero) => {
  const g = genero || 'feminino';
  const webhookUrl = `${process.env.NEXT_PUBLIC_URL}/api/webhooks/fal-treino?pedidoId=${pedidoId}&tipo=previa`;

  const { request_id } = await fal.queue.submit('fal-ai/pulid', {
    input: {
      reference_images: [
        { image_url: urlFrente },
        { image_url: urlEsquerda },
        { image_url: urlDireita },
      ],
      prompt: PROMPTS_PREVIA[g],
      negative_prompt: NEG,
      num_images: 1,
      guidance_scale: 1.5,
      num_inference_steps: 4,
      id_scale: 0.9,
      mode: 'fidelity',
    },
    webhookUrl,
  });

  return request_id;
};

// ── 9 FOTOS PAGAS via LoRA (máxima qualidade) ────────────────────────────────
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
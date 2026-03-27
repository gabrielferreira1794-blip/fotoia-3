// utils/ia.js — Hybrid: Flux PuLID (prévia rápida) + LoRA (9 fotos pagas)
import { fal } from '@fal-ai/client';

fal.config({ credentials: process.env.FAL_KEY });

const PROMPT_PREVIA = {
  feminino: 'RAW photo, professional headshot of a woman, softbox studio lighting, neutral light gray background, sharp focus, detailed skin texture, 85mm portrait lens, natural expression, photorealistic, 8k high resolution',
  masculino: 'RAW photo, professional headshot of a man, softbox studio lighting, neutral light gray background, sharp focus, detailed skin texture, 85mm portrait lens, natural expression, photorealistic, 8k high resolution',
};

const PROMPTS_LORA = {
  feminino: [
    'RAW photo of FOTOPESSOA, natural outdoor portrait, warm bokeh background, shallow depth of field, lifestyle photography, candid professional expression, 4k photorealistic, high detail',
    'RAW photo of FOTOPESSOA wearing elegant blazer, confident pose, modern corporate office background, professional business portrait, sharp focus, photorealistic, high resolution',
    'close-up portrait of FOTOPESSOA, golden hour sunlight, cinematic color grading, editorial magazine quality, detailed skin, sharp focus, photorealistic',
    'RAW photo of FOTOPESSOA smiling naturally, urban city street background, candid lifestyle photography, vibrant colors, authentic expression, photorealistic, 4k',
    'portrait of FOTOPESSOA in business casual attire, bright modern glass office interior, airy natural light, professional headshot, photorealistic, sharp',
    'dramatic portrait of FOTOPESSOA, rembrandt studio lighting, dark studio background, high fashion editorial style, intense focus, photorealistic',
    'RAW photo of FOTOPESSOA in relaxed pose, lush green park background, warm afternoon golden light, lifestyle photography, natural expression, 4k photorealistic',
    'editorial portrait of FOTOPESSOA, clean cream studio background, minimalist high-end style, fashion magazine quality, sharp focus, photorealistic, 8k',
    'RAW photo of FOTOPESSOA, rooftop city view background, golden hour, confident professional pose, lifestyle editorial, photorealistic',
  ],
  masculino: [
    'RAW photo of FOTOPESSOA, natural outdoor portrait, warm bokeh background, shallow depth of field, lifestyle photography, confident professional expression, 4k photorealistic, high detail',
    'RAW photo of FOTOPESSOA wearing tailored suit, confident pose, modern corporate office background, professional business portrait, sharp focus, photorealistic, high resolution',
    'close-up portrait of FOTOPESSOA, golden hour sunlight, cinematic color grading, editorial magazine quality, detailed skin, sharp focus, photorealistic',
    'RAW photo of FOTOPESSOA smiling confidently, urban city street background, candid lifestyle photography, vibrant colors, authentic expression, photorealistic, 4k',
    'portrait of FOTOPESSOA in business casual, bright modern open-plan office, natural light, professional headshot, photorealistic, sharp',
    'dramatic portrait of FOTOPESSOA, rembrandt studio lighting, dark background, editorial style, sharp focus, intense expression, photorealistic',
    'RAW photo of FOTOPESSOA relaxed and confident, lush green park setting, warm afternoon light, lifestyle photography, natural expression, 4k photorealistic',
    'editorial portrait of FOTOPESSOA, plain light studio background, minimal clean style, high-end fashion quality, sharp focus, photorealistic, 8k',
    'RAW photo of FOTOPESSOA, rooftop city view background, golden hour light, confident pose, lifestyle editorial, photorealistic',
  ],
};

// ── PRÉVIA RÁPIDA via Flux PuLID (~30-60s) ───────────────────────────────────
// Nota: verificar endpoint exato em fal.ai/models — pode ser fal-ai/pulid ou fal-ai/flux-pulid
export const iniciarGeracaoPrevia = async (urlFrente, urlEsquerda, urlDireita, pedidoId, genero) => {
  const g = genero || 'feminino';
  const webhookUrl = `${process.env.NEXT_PUBLIC_URL}/api/webhooks/fal-treino?pedidoId=${pedidoId}&tipo=previa`;

  const { request_id } = await fal.queue.submit('fal-ai/flux-pulid', {
    input: {
      prompt: PROMPT_PREVIA[g],
      reference_images: [
        { image_url: urlFrente },
        { image_url: urlEsquerda },
        { image_url: urlDireita },
      ],
      num_inference_steps: 20,
      guidance_scale: 4.0,
      id_scale: 1.0,         // máxima preservação de identidade
      num_images: 1,
    },
    webhookUrl,
  });

  return request_id;
};

// ── TREINO LoRA (para as 9 fotos pagas, em paralelo com a prévia) ─────────────
export const iniciarTreino = async (zipDataUrl, pedidoId) => {
  const webhookUrl = `${process.env.NEXT_PUBLIC_URL}/api/webhooks/fal-treino?pedidoId=${pedidoId}&tipo=treino`;

  const { request_id } = await fal.queue.submit('fal-ai/flux-lora-fast-training', {
    input: {
      images_data_url: zipDataUrl,
      trigger_word: 'FOTOPESSOA',
      steps: 2000,
    },
    webhookUrl,
  });

  return request_id;
};

// ── 9 FOTOS PAGAS via LoRA (após PIX confirmado) ──────────────────────────────
export const gerarFotosPagas = async (loraUrl, genero) => {
  const g = genero || 'feminino';
  const prompts = PROMPTS_LORA[g] || PROMPTS_LORA.feminino;

  return Promise.all(
    prompts.map(async (prompt) => {
      const result = await fal.run('fal-ai/flux-lora', {
        input: {
          prompt,
          loras: [{ path: loraUrl, scale: 1.0 }],
          num_inference_steps: 35,
          guidance_scale: 4.5,
          image_size: { width: 1024, height: 1024 },
          num_images: 1,
          enable_safety_checker: false,
        },
      });
      return result.images[0].url;
    })
  );
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

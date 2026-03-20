// utils/ia.js — USO model para prévia + LoRA para 9 fotos pagas
import { fal } from '@fal-ai/client';

fal.config({ credentials: process.env.FAL_KEY });

const PROMPTS_PREVIA = {
  feminino: 'A stunning ultra-realistic professional headshot portrait photograph of this woman, taken by a world-class photographer. She is wearing an elegant dark blazer over a white shirt, perfect professional makeup, confident natural smile. Shot in a high-end photography studio with professional three-point lighting setup, soft box lights, clean light gray seamless background. The image has exceptional sharpness, beautiful bokeh, cinematic depth of field, photorealistic skin texture, 8K resolution, editorial magazine quality. This looks like it was shot by Annie Leibovitz for Forbes magazine.',
  masculino: 'A stunning ultra-realistic professional headshot portrait photograph of this man, taken by a world-class photographer. He is wearing a sharp charcoal suit with a crisp white shirt and dark tie, confident natural expression. Shot in a high-end photography studio with professional three-point lighting setup, soft box lights, clean light gray seamless background. The image has exceptional sharpness, beautiful bokeh, cinematic depth of field, photorealistic skin texture, 8K resolution, editorial magazine quality. This looks like it was shot for Forbes magazine.',
};

const NEG = 'cartoon, illustration, painting, drawing, anime, low quality, blurry, pixelated, distorted, deformed, ugly, bad anatomy, extra limbs, watermark, text, logo, nsfw, passport photo, id card, mugshot, flat lighting, overexposed, underexposed';

const PROMPTS_LORA = {
  feminino: [
    'portrait of FOTOPESSOA, warm natural light, outdoor cafe bokeh background, lifestyle photography, highly realistic',
    'FOTOPESSOA elegant formal blazer, confident professional pose, corporate gradient background, editorial quality',
    'close-up portrait of FOTOPESSOA, golden hour sunlight, cinematic color grading, high-end editorial photography',
    'FOTOPESSOA smiling naturally, modern city street background, candid documentary style, vibrant colors, realistic',
    'FOTOPESSOA business casual outfit, contemporary glass office building, bright and airy professional photography',
    'dramatic portrait of FOTOPESSOA, rembrandt lighting, dark studio background, high fashion editorial quality',
    'FOTOPESSOA outdoor park greenery, relaxed happy expression, lifestyle photography, warm tones, bokeh background',
    'fashion editorial portrait of FOTOPESSOA, plain cream background, minimal style, high-end magazine photography',
    'FOTOPESSOA confident expression, modern rooftop setting, golden hour light, luxury lifestyle photography',
  ],
  masculino: [
    'portrait of FOTOPESSOA, warm natural light, outdoor cafe bokeh background, lifestyle photography, highly realistic',
    'FOTOPESSOA formal suit and tie, confident professional pose, corporate gradient background, editorial quality',
    'close-up portrait of FOTOPESSOA, golden hour sunlight, cinematic color grading, high-end editorial photography',
    'FOTOPESSOA smiling naturally, modern city street background, candid documentary style, vibrant colors, realistic',
    'FOTOPESSOA business casual, contemporary office setting, bright professional atmosphere, high quality photography',
    'dramatic portrait of FOTOPESSOA, rembrandt studio lighting, dark background, editorial quality photography',
    'FOTOPESSOA outdoor park greenery, relaxed confident pose, lifestyle photography, warm tones, bokeh background',
    'editorial portrait of FOTOPESSOA, plain cream background, minimal clean style, high-end magazine photography',
    'FOTOPESSOA confident expression, modern rooftop setting, golden hour light, luxury lifestyle photography',
  ],
};

// ── PRÉVIA via USO (~30-60s) ──────────────────────────────────────────────────
export const iniciarGeracaoGratis = async (urlFrente, urlEsquerda, urlDireita, pedidoId, genero) => {
  const g = genero || 'feminino';
  const webhookUrl = `${process.env.NEXT_PUBLIC_URL}/api/webhooks/fal-treino?pedidoId=${pedidoId}&tipo=previa`;

  const { request_id } = await fal.queue.submit('fal-ai/uso', {
    input: {
      prompt: PROMPTS_PREVIA[g],
      negative_prompt: NEG,
      input_image_urls: [urlFrente, urlEsquerda, urlDireita],
      image_size: 'portrait_4_3',
      num_inference_steps: 50,
      guidance_scale: 7,
      num_images: 1,
      output_format: 'jpeg',
    },
    webhookUrl,
  });

  return request_id;
};

// ── 9 FOTOS PAGAS via LoRA ────────────────────────────────────────────────────
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
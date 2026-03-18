// utils/ia.js — Flux PuLID via fal.ai (sem treino, ~30-60 segundos)
import { fal } from '@fal-ai/client';

fal.config({ credentials: process.env.FAL_KEY });

const PROMPTS = {
  feminino: [
    'professional headshot photo of a woman img, studio lighting, clean white background, sharp focus, natural makeup, 8k ultra realistic photography',
    'portrait photo of a woman img, warm natural light, outdoor cafe bokeh background, lifestyle photography',
    'woman img in elegant formal blazer, confident professional pose, corporate background, business portrait',
    'close-up portrait of a woman img, golden hour sunlight, cinematic color grading, editorial photography',
    'woman img smiling naturally, modern city street background, candid documentary style, vibrant colors',
    'woman img in business casual outfit, contemporary office building, bright and airy photography',
    'dramatic portrait of a woman img, rembrandt lighting, dark studio background, high fashion editorial',
    'woman img in outdoor park greenery, relaxed happy expression, lifestyle photography, warm tones',
    'fashion editorial portrait of a woman img, plain cream background, minimal style, high-end magazine',
  ],
  masculino: [
    'professional headshot photo of a man img, studio lighting, clean white background, sharp focus, 8k ultra realistic photography',
    'portrait photo of a man img, warm natural light, outdoor cafe bokeh background, lifestyle photography',
    'man img in formal suit and tie, confident professional pose, corporate background, business portrait',
    'close-up portrait of a man img, golden hour sunlight, cinematic color grading, editorial photography',
    'man img smiling naturally, modern city street background, candid documentary style, vibrant colors',
    'man img in business casual outfit, contemporary office building, bright and airy photography',
    'dramatic portrait of a man img, rembrandt studio lighting, dark background, editorial photography',
    'man img in outdoor park greenery, relaxed confident pose, lifestyle photography, warm tones',
    'editorial portrait of a man img, plain cream background, minimal clean style, high-end magazine',
  ],
};

const NEG = 'bad quality, worst quality, text, signature, watermark, extra limbs, deformed, ugly, blurry';

const makeInput = (fotoUrl, prompt) => ({
  reference_image_url: fotoUrl,
  prompt,
  negative_prompt: NEG,
  num_inference_steps: 20,
  guidance_scale: 4,
  image_size: 'portrait_4_3',
  id_weight: 1,
  enable_safety_checker: true,
});

// Dispara geração da foto grátis via queue + webhook (~30-60s)
export const iniciarGeracaoGratis = async (fotoUrl, pedidoId, genero = 'feminino') => {
  const webhookUrl = `${process.env.NEXT_PUBLIC_URL}/api/webhooks/fal-treino?pedidoId=${pedidoId}`;
  const prompt = PROMPTS[genero]?.[0] || PROMPTS.feminino[0];

  const { request_id } = await fal.queue.submit('fal-ai/flux-pulid', {
    input: makeInput(fotoUrl, prompt),
    webhookUrl,
  });

  return request_id;
};

// Gera as 9 fotos pagas em paralelo (após PIX confirmado)
export const gerarFotosPagas = async (fotoUrl, genero = 'feminino') => {
  const prompts = (PROMPTS[genero] || PROMPTS.feminino).slice(1);

  return Promise.all(
    prompts.map(async (prompt) => {
      const result = await fal.run('fal-ai/flux-pulid', {
        input: makeInput(fotoUrl, prompt),
      });
      return result.images[0].url;
    })
  );
};
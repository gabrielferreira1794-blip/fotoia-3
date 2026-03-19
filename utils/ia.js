// utils/ia.js — instant-character via fal.ai (~30-60 segundos, sem treino)
import { fal } from '@fal-ai/client';

fal.config({ credentials: process.env.FAL_KEY });

const PROMPTS = {
  feminino: [
    'professional headshot photo of a woman, studio lighting, clean white background, sharp focus, natural makeup, 8k ultra realistic photography',
    'portrait of a woman, warm natural light, outdoor cafe bokeh background, lifestyle photography, soft smile',
    'woman in elegant formal blazer, confident professional pose, corporate gradient background, business portrait',
    'close-up portrait of a woman, golden hour sunlight, cinematic color grading, editorial photography',
    'woman smiling naturally, modern city street background, candid documentary style, vibrant colors',
    'woman in business casual outfit, contemporary office building, bright and airy photography',
    'dramatic portrait of a woman, rembrandt lighting, dark studio background, high fashion editorial',
    'woman in outdoor park greenery, relaxed happy expression, lifestyle photography, warm tones',
    'fashion editorial portrait of a woman, plain cream background, minimal style, high-end magazine',
  ],
  masculino: [
    'professional headshot photo of a man, studio lighting, clean white background, sharp focus, 8k ultra realistic photography',
    'portrait of a man, warm natural light, outdoor cafe bokeh background, lifestyle photography',
    'man in formal suit and tie, confident professional pose, corporate gradient background, business portrait',
    'close-up portrait of a man, golden hour sunlight, cinematic color grading, editorial photography',
    'man smiling naturally, modern city street background, candid documentary style, vibrant colors',
    'man in business casual outfit, contemporary office building, bright and airy photography',
    'dramatic portrait of a man, rembrandt studio lighting, dark background, editorial photography',
    'man in outdoor park greenery, relaxed confident pose, lifestyle photography, warm tones',
    'editorial portrait of a man, plain cream background, minimal clean style, high-end magazine',
  ],
};

const makeInput = (fotoUrl, prompt) => ({
  image_url: fotoUrl,
  prompt,
  image_size: 'portrait_4_3',
  num_inference_steps: 28,
  guidance_scale: 3.5,
  num_images: 1,
  enable_safety_checker: true,
  output_format: 'jpeg',
});

// Dispara geração da foto grátis via queue + webhook (~30-60s)
export const iniciarGeracaoGratis = async (fotoUrl, pedidoId, genero = 'feminino') => {
  const webhookUrl = `${process.env.NEXT_PUBLIC_URL}/api/webhooks/fal-treino?pedidoId=${pedidoId}`;
  const prompt = PROMPTS[genero]?.[0] || PROMPTS.feminino[0];

  const { request_id } = await fal.queue.submit('fal-ai/instant-character', {
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
      const result = await fal.run('fal-ai/instant-character', {
        input: makeInput(fotoUrl, prompt),
      });
      return result.images[0].url;
    })
  );
};
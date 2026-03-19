// utils/ia.js — Flux.1 LoRA via fal.ai (melhor qualidade para headshots)
import { fal } from '@fal-ai/client';
 
fal.config({ credentials: process.env.FAL_KEY });
 
const PROMPTS = {
  feminino: [
    'professional headshot of FOTOPESSOA, studio lighting, clean white background, sharp focus, 8k ultra realistic photography',
    'portrait of FOTOPESSOA, warm natural light, outdoor cafe bokeh background, lifestyle photography',
    'FOTOPESSOA elegant formal blazer, confident professional pose, corporate gradient background',
    'close-up portrait of FOTOPESSOA, golden hour sunlight, cinematic color grading, editorial style',
    'FOTOPESSOA smiling naturally, modern city street background, candid documentary style, vibrant',
    'FOTOPESSOA business casual outfit, contemporary glass office building, bright and airy',
    'dramatic portrait of FOTOPESSOA, rembrandt lighting, dark studio background, high fashion editorial',
    'FOTOPESSOA outdoor park greenery, relaxed happy expression, lifestyle photography, warm tones',
    'fashion editorial portrait of FOTOPESSOA, plain cream background, minimal style, high-end magazine',
  ],
  masculino: [
    'professional headshot of FOTOPESSOA, studio lighting, clean white background, sharp focus, 8k ultra realistic photography',
    'portrait of FOTOPESSOA, warm natural light, outdoor cafe bokeh background, lifestyle photography',
    'FOTOPESSOA formal suit and tie, confident professional pose, corporate gradient background',
    'close-up portrait of FOTOPESSOA, golden hour sunlight, cinematic color grading, editorial style',
    'FOTOPESSOA smiling naturally, modern city street background, candid documentary style, vibrant',
    'FOTOPESSOA business casual, contemporary office setting, bright professional atmosphere',
    'dramatic portrait of FOTOPESSOA, rembrandt studio lighting, dark background, editorial',
    'FOTOPESSOA outdoor greenery park, relaxed confident pose, lifestyle photography warm tones',
    'editorial portrait of FOTOPESSOA, plain cream background, minimal clean style, high-end',
  ],
};
 
// Gera 1 foto grátis após treino concluído
export const gerarFotoGratis = async (loraUrl, genero = 'feminino') => {
  const prompt = PROMPTS[genero]?.[0] || PROMPTS.feminino[0];
 
  const result = await fal.run('fal-ai/flux-lora', {
    input: {
      prompt,
      loras: [{ path: loraUrl, scale: 0.88 }],
      num_inference_steps: 28,
      guidance_scale: 3.5,
      image_size: 'portrait_4_3',
      num_images: 1,
      enable_safety_checker: true,
      output_format: 'jpeg',
    },
  });
 
  return result.images[0].url;
};
 
// Gera as 9 fotos pagas em paralelo (após PIX confirmado)
export const gerarFotosPagas = async (loraUrl, genero = 'feminino') => {
  const prompts = (PROMPTS[genero] || PROMPTS.feminino).slice(1);
 
  return Promise.all(
    prompts.map(async (prompt) => {
      const result = await fal.run('fal-ai/flux-lora', {
        input: {
          prompt,
          loras: [{ path: loraUrl, scale: 0.88 }],
          num_inference_steps: 28,
          guidance_scale: 3.5,
          image_size: 'portrait_4_3',
          num_images: 1,
          enable_safety_checker: true,
          output_format: 'jpeg',
        },
      });
      return result.images[0].url;
    })
  );
};
 
// Inicia treino LoRA — webhook avisa quando terminar (~10-15 min)
export const iniciarTreino = async (zipDataUrl, pedidoId) => {
  const webhookUrl = `${process.env.NEXT_PUBLIC_URL}/api/webhooks/fal-treino?pedidoId=${pedidoId}`;
 
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
 
// Empacota as 3 fotos em ZIP para o treino
export const criarZipRosto = async (bufferFrente, bufferEsquerda, bufferDireita) => {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
 
  zip.file('rosto_frente.jpg', bufferFrente);
  zip.file('rosto_esquerda.jpg', bufferEsquerda);
  zip.file('rosto_direita.jpg', bufferDireita);
 
  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  return `data:application/zip;base64,${zipBuffer.toString('base64')}`;
};
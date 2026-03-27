// utils/ia.js — Flux.1 LoRA via fal.ai (máxima qualidade fotorrealista)
import { fal } from '@fal-ai/client';

fal.config({ credentials: process.env.FAL_KEY });

// Trigger word aparece no início de cada prompt para máxima identidade
const PROMPTS = {
  feminino: [
    // Foto grátis — headshot profissional limpo
    'RAW photo of FOTOPESSOA, professional headshot, softbox studio lighting, neutral light gray background, sharp focus, detailed skin texture, 85mm portrait lens, f/2.8 aperture, photorealistic, 8k high resolution',
    // 9 fotos pagas
    'RAW photo of FOTOPESSOA, natural outdoor portrait, warm bokeh background, shallow depth of field, lifestyle photography, candid professional expression, 4k photorealistic, high detail',
    'RAW photo of FOTOPESSOA wearing elegant blazer, confident pose, modern corporate office background, professional business portrait, sharp focus, photorealistic, high resolution',
    'close-up portrait of FOTOPESSOA, golden hour sunlight, cinematic color grading, editorial magazine quality, detailed skin, sharp focus, photorealistic',
    'RAW photo of FOTOPESSOA smiling naturally, urban city street background, candid lifestyle photography, vibrant colors, authentic expression, photorealistic, 4k',
    'portrait of FOTOPESSOA in business casual attire, bright modern glass office interior, airy natural light, professional headshot, photorealistic, sharp',
    'dramatic portrait of FOTOPESSOA, rembrandt studio lighting, dark studio background, high fashion editorial style, intense focus, photorealistic',
    'RAW photo of FOTOPESSOA in relaxed pose, lush green park background, warm afternoon golden light, lifestyle photography, natural expression, 4k photorealistic',
    'editorial portrait of FOTOPESSOA, clean cream studio background, minimalist high-end style, fashion magazine quality, sharp focus, photorealistic, 8k',
  ],
  masculino: [
    // Foto grátis — headshot profissional limpo
    'RAW photo of FOTOPESSOA, professional headshot, softbox studio lighting, neutral light gray background, sharp focus, detailed skin texture, 85mm portrait lens, f/2.8 aperture, photorealistic, 8k high resolution',
    // 9 fotos pagas
    'RAW photo of FOTOPESSOA, natural outdoor portrait, warm bokeh background, shallow depth of field, lifestyle photography, confident professional expression, 4k photorealistic, high detail',
    'RAW photo of FOTOPESSOA wearing tailored suit, confident pose, modern corporate office background, professional business portrait, sharp focus, photorealistic, high resolution',
    'close-up portrait of FOTOPESSOA, golden hour sunlight, cinematic color grading, editorial magazine quality, detailed skin, sharp focus, photorealistic',
    'RAW photo of FOTOPESSOA smiling confidently, urban city street background, candid lifestyle photography, vibrant colors, authentic expression, photorealistic, 4k',
    'portrait of FOTOPESSOA in business casual, bright modern open-plan office, natural light, professional headshot, photorealistic, sharp',
    'dramatic portrait of FOTOPESSOA, rembrandt studio lighting, dark background, editorial style, sharp focus, intense expression, photorealistic',
    'RAW photo of FOTOPESSOA relaxed and confident, lush green park setting, warm afternoon light, lifestyle photography, natural expression, 4k photorealistic',
    'editorial portrait of FOTOPESSOA, plain light studio background, minimal clean style, high-end fashion quality, sharp focus, photorealistic, 8k',
  ],
};

// Gera 1 foto grátis após treino LoRA concluído
export const gerarFotoGratis = async (loraUrl, genero) => {
  const g = genero || 'feminino';
  const prompt = PROMPTS[g]?.[0] || PROMPTS.feminino[0];

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
};

// Gera as 9 fotos pagas em paralelo (após PIX confirmado)
export const gerarFotosPagas = async (loraUrl, genero) => {
  const g = genero || 'feminino';
  const prompts = (PROMPTS[g] || PROMPTS.feminino).slice(1);

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

// Inicia treino LoRA — webhook avisa quando terminar
export const iniciarTreino = async (zipDataUrl, pedidoId) => {
  const webhookUrl = `${process.env.NEXT_PUBLIC_URL}/api/webhooks/fal-treino?pedidoId=${pedidoId}&tipo=treino`;

  const { request_id } = await fal.queue.submit('fal-ai/flux-lora-fast-training', {
    input: {
      images_data_url: zipDataUrl,
      trigger_word: 'FOTOPESSOA',
      steps: 2000,         // dobrado: mais steps = face mais fiel com poucas fotos
      multiresolution_training: true, // treina em múltiplas resoluções
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

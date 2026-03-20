// utils/ia.js — Gemini (Nano Banana) para prévia rápida + LoRA para 9 fotos pagas
import { fal } from '@fal-ai/client';
import { GoogleGenAI } from '@google/genai';

fal.config({ credentials: process.env.FAL_KEY });

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

// ── PRÉVIA via Gemini Nano Banana (~15-30s, alta qualidade) ───────────────────
/**
 * Gera 1 foto profissional usando Gemini com as 3 fotos de referência
 * Retorna buffer da imagem gerada
 */
export const gerarPreviaGemini = async (bufFrente, bufEsquerda, bufDireita, genero) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const g = genero || 'feminino';

  const prompt = g === 'feminino'
    ? `You are a professional photographer. I will provide 3 reference photos of the same woman from different angles (front, left profile, right profile). Generate a new ultra-realistic professional headshot photo of THIS EXACT PERSON with the same facial features, skin tone, hair color and style. The photo should be: studio lighting, clean white/light gray background, sharp focus, natural professional expression, blazer or professional top, photorealistic 8K quality. Maintain the person's exact facial identity - same face structure, eyes, nose, lips. Do not change how the person looks.`
    : `You are a professional photographer. I will provide 3 reference photos of the same man from different angles (front, left profile, right profile). Generate a new ultra-realistic professional headshot photo of THIS EXACT PERSON with the same facial features, skin tone, hair color and style. The photo should be: studio lighting, clean white/light gray background, sharp focus, natural professional expression, suit or professional top, photorealistic 8K quality. Maintain the person's exact facial identity - same face structure, eyes, nose, lips. Do not change how the person looks.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-05-20',
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          { inlineData: { mimeType: 'image/jpeg', data: bufFrente.toString('base64') } },
          { inlineData: { mimeType: 'image/jpeg', data: bufEsquerda.toString('base64') } },
          { inlineData: { mimeType: 'image/jpeg', data: bufDireita.toString('base64') } },
        ],
      },
    ],
    config: {
      responseModalities: ['IMAGE', 'TEXT'],
    },
  });

  // Extrai a imagem gerada
  const parts = response.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find(p => p.inlineData?.data);
  if (!imagePart) throw new Error('Gemini nao retornou imagem: ' + JSON.stringify(parts));

  return Buffer.from(imagePart.inlineData.data, 'base64');
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
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY,
  },
});

/**
 * Faz upload de um buffer ou stream para o R2
 * Retorna a URL pública do arquivo
 */
export const uploadParaR2 = async (buffer, nomeArquivo, contentType = 'image/jpeg') => {
  await r2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: nomeArquivo,
    Body: buffer,
    ContentType: contentType,
  }));

  return `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${nomeArquivo}`;
};

/**
 * Faz download de uma URL externa e salva no R2
 * Usado para salvar fotos geradas pela fal.ai
 */
export const baixarEsalvarNoR2 = async (urlExterna, nomeArquivo) => {
  const response = await fetch(urlExterna);
  const buffer = Buffer.from(await response.arrayBuffer());
  return uploadParaR2(buffer, nomeArquivo, 'image/jpeg');
};

/**
 * Deleta arquivo do R2
 */
export const deletarDoR2 = async (nomeArquivo) => {
  await r2.send(new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: nomeArquivo,
  }));
};

import { embed } from 'ai';
import { createGoogleProvider } from '@/lib/google';

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text.trim()) {
    throw new Error('Teks embedding tidak boleh kosong.');
  }

  const { embedding } = await embed({
    model: createGoogleProvider().embedding('gemini-embedding-001'),
    value: text,
    dimensions: 768,
  });

  if (embedding.length !== 768) {
    throw new Error(`Dimensi embedding tidak sesuai: diharapkan 768, didapat ${embedding.length}.`);
  }

  return embedding;
}
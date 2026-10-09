import { convertToModelMessages, createUIMessageStreamResponse, streamText, toUIMessageStream } from 'ai';
import { generateEmbedding } from '@/lib/embeddings';
import { createGoogleProvider } from '@/lib/google';
import { supabaseAdmin } from '@/lib/supabase';

type ChatMessage = {
  role?: unknown;
  content?: unknown;
  parts?: unknown;
};

function getMessageText(message: ChatMessage): string {
  if (typeof message.content === 'string') {
    return message.content;
  }

  if (!Array.isArray(message.parts)) {
    return '';
  }

  return message.parts
    .filter((part): part is { type: string; text: string } => (
      typeof part === 'object'
      && part !== null
      && 'type' in part
      && part.type === 'text'
      && 'text' in part
      && typeof part.text === 'string'
    ))
    .map((part) => part.text)
    .join('');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = body?.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: 'Array messages tidak boleh kosong' }, { status: 400 });
    }

    const invalidMessage = messages.some((message) => (
      typeof message !== 'object'
      || message === null
      || !['user', 'assistant'].includes(message.role)
    ));

    if (invalidMessage) {
      return Response.json({ error: 'Format messages tidak valid' }, { status: 400 });
    }

    const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user');
    const userQuery = lastUserMessage ? getMessageText(lastUserMessage) : '';

    if (!userQuery.trim()) {
      return Response.json({ error: 'Pesan pengguna tidak boleh kosong' }, { status: 400 });
    }

    const queryEmbedding = await generateEmbedding(userQuery);
    const { data: matchedDocs, error } = await supabaseAdmin.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.3,
      match_count: 3,
    });

    if (error) {
      console.error('Vector Search Error:', error);
    }

    const context = matchedDocs && matchedDocs.length > 0
      ? matchedDocs.map((doc: { content: string }) => `- ${doc.content}`).join('\n\n')
      : 'Tidak ada catatan relevan yang ditemukan di Second Brain.';

    const systemPrompt = `Kamu adalah asisten Second Brain & Smart Learning Assistant yang cerdas dan suportif.
Gunakan informasi dari catatan pribadi pengguna di bawah ini untuk menjawab pertanyaan secara akurat.

KONTEKS CATATAN PENGGUNA:
${context}

Aturan:
1. Jika informasi ada di dalam catatan, jelaskan berdasarkan catatan tersebut.
2. Jika informasi tidak ada di dalam catatan, jawab menggunakan pengetahuan umummu, tetapi berikan catatan kecil bahwa informasi tersebut tidak ada di catatan pribadi.`;

    const modelMessages = await convertToModelMessages(messages);
    const result = streamText({
      model: createGoogleProvider().interactions('gemini-3.8-flash'),
      system: systemPrompt,
      messages: modelMessages,
      abortSignal: req.signal,
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({
        stream: result.stream,
        originalMessages: messages,
        onError: (streamError) => {
          console.error('[Chat API] Gagal melakukan streaming dari Gemini:', streamError);
          return 'Gagal memproses chat dengan Gemini. Periksa konfigurasi API dan coba lagi.';
        },
      }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Chat API Error Detail]:', err);
    return Response.json({ error: message }, { status: 500 });
  }
}

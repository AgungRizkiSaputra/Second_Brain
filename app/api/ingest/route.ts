import { NextResponse } from 'next/server';
import { generateEmbedding } from '@/lib/embeddings';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { content, title } = await req.json();

    if (!content) {
      return NextResponse.json({ error: 'Konten catatan wajib diisi' }, { status: 400 });
    }

    // 1. Ubah teks catatan menjadi vector embedding
    const embedding = await generateEmbedding(content);

    // 2. Simpan ke tabel 'documents' di Supabase
    const { error } = await supabaseAdmin.from('documents').insert([
      {
        content,
        metadata: { title: title || 'Catatan Tanpa Judul', createdAt: new Date().toISOString() },
        embedding,
      },
    ]);

    if (error) {
      console.error('Supabase Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Catatan berhasil disimpan!' });
  } catch (err: any) {
    console.error('Ingest Error:', err);
    return NextResponse.json({ error: err.message || 'Gagal menyimpan catatan' }, { status: 500 });
  }
}
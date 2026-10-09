'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { BookOpen, Send, PlusCircle, CheckCircle2, Loader2, Bot, User } from 'lucide-react';

export default function Home() {
  // State Form Catatan
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestSuccess, setIngestSuccess] = useState(false);

  // Vercel AI SDK Hook untuk Chat
  const [input, setInput] = useState('');
  const { messages, sendMessage, status } = useChat({
  id: 'second-brain-chat',
  });
  const isLoading = status === 'submitted' || status === 'streaming';

  const handleChatSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    sendMessage({ text: input });
    setInput('');
  };

  // Handler Simpan Catatan ke /api/ingest
  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsIngesting(true);
    setIngestSuccess(false);

    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });

      if (res.ok) {
        setTitle('');
        setContent('');
        setIngestSuccess(true);
        setTimeout(() => setIngestSuccess(false), 3000);
      } else {
        alert('Gagal menyimpan catatan.');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menyimpan.');
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row h-screen overflow-hidden">
      {/* PANEL KIRI: Input Catatan Baru */}
      <section className="w-full md:w-1/3 bg-slate-900 border-r border-slate-800 p-6 flex flex-col overflow-y-auto">
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className="w-6 h-6 text-emerald-400" />
          <h1 className="text-xl font-bold tracking-tight text-white">Second Brain Input</h1>
        </div>

        <form onSubmit={handleSaveNote} className="flex flex-col gap-4 flex-1">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Judul Catatan
            </label>
            <input
              type="text"
              placeholder="Contoh: Rangkuman Materi RAG & Vector DB"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div className="flex-1 flex flex-col">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Isi Materi / Catatan
            </label>
            <textarea
              placeholder="Tempel materi, artikel, atau catatan belajarmu di sini..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-64 md:h-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition resize-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isIngesting}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition"
          >
            {isIngesting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses Vector...</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                <span>Simpan ke Second Brain</span>
              </>
            )}
          </button>

          {ingestSuccess && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-lg flex items-center gap-2 text-emerald-300 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Catatan berhasil disimpan & di-embedding!</span>
            </div>
          )}
        </form>
      </section>

      {/* PANEL KANAN: Chatbot Assistant */}
      <section className="w-full md:w-2/3 flex flex-col h-full bg-slate-950">
        {/* Header Chat */}
        <header className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-emerald-400" />
            <h2 className="font-semibold text-slate-200">AI Learning Assistant</h2>
          </div>
          <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full">
            Gemini RAG Active
          </span>
        </header>

        {/* Bubble Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center gap-2">
              <Bot className="w-12 h-12 text-slate-700" />
              <p className="text-sm">Belum ada percakapan.</p>
              <p className="text-xs text-slate-600 max-w-xs">
                Masukkan catatan di panel kiri, lalu tanyakan sesuatu berdasarkan catatan tersebut!
              </p>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role !== 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 flex-shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-none'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">
                    {m.parts
                      .filter((part) => part.type === 'text')
                      .map((part) => part.text)
                      .join('')}
                  </p>
                </div>
                {m.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 flex-shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex items-center gap-2 text-slate-400 text-xs italic">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              <span>Mencari di Second Brain & menyusun jawaban...</span>
            </div>
          )}
        </div>

        {/* Form Input Chat */}
        <form onSubmit={handleChatSubmit} className="p-4 border-t border-slate-800 bg-slate-900/30">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tanyakan sesuatu berdasarkan catatanmu..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white px-5 rounded-xl flex items-center justify-center transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
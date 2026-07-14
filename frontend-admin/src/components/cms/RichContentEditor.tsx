import { Bold, Code2, Eye, Heading2, Italic, Link2, List, ListOrdered, Quote, Type } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

interface RichContentEditorProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  minHeight?: number;
  hint?: string;
}

const previewShell = (content: string) => `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body{margin:0;padding:24px;font-family:Inter,ui-sans-serif,system-ui;color:#0f172a;line-height:1.75;background:#fff}
h1,h2,h3{line-height:1.25;margin:1.5em 0 .6em}h2{font-size:1.55rem}h3{font-size:1.25rem}
p{margin:.8em 0}a{color:#2563eb}blockquote{border-left:4px solid #06b6d4;background:#f8fafc;margin:1.4em 0;padding:12px 18px;border-radius:0 12px 12px 0}img{max-width:100%;height:auto;border-radius:14px}ul,ol{padding-left:1.4rem}code{background:#f1f5f9;padding:.15rem .35rem;border-radius:.35rem}pre{overflow:auto;background:#0f172a;color:#e2e8f0;padding:18px;border-radius:14px}
</style></head><body>${content || '<p style="color:#94a3b8">Chưa có nội dung để xem trước.</p>'}</body></html>`;

export default function RichContentEditor({
  label = 'Nội dung',
  value,
  onChange,
  minHeight = 360,
  hint = 'Soạn HTML có cấu trúc. Preview được chạy trong iframe sandbox.',
}: RichContentEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const preview = useMemo(() => previewShell(value), [value]);

  const wrapSelection = (before: string, after = before) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || 'Nội dung';
    const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  };

  const insertList = (ordered: boolean) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end).trim() || 'Mục 1\nMục 2';
    const items = selected.split(/\n+/).map((item) => `<li>${item.replace(/^[-*]\s*/, '')}</li>`).join('\n');
    const tag = ordered ? 'ol' : 'ul';
    const block = `<${tag}>\n${items}\n</${tag}>`;
    onChange(`${value.slice(0, start)}${block}${value.slice(end)}`);
  };

  const addLink = () => {
    const href = window.prompt('Nhập URL liên kết', 'https://');
    if (!href) return;
    wrapSelection(`<a href="${href}" target="_blank" rel="noopener noreferrer">`, '</a>');
  };

  const tools = [
    { label: 'Đoạn văn', icon: Type, action: () => wrapSelection('<p>', '</p>') },
    { label: 'Tiêu đề 2', icon: Heading2, action: () => wrapSelection('<h2>', '</h2>') },
    { label: 'In đậm', icon: Bold, action: () => wrapSelection('<strong>', '</strong>') },
    { label: 'In nghiêng', icon: Italic, action: () => wrapSelection('<em>', '</em>') },
    { label: 'Trích dẫn', icon: Quote, action: () => wrapSelection('<blockquote>', '</blockquote>') },
    { label: 'Danh sách', icon: List, action: () => insertList(false) },
    { label: 'Danh sách số', icon: ListOrdered, action: () => insertList(true) },
    { label: 'Liên kết', icon: Link2, action: addLink },
    { label: 'Khối mã', icon: Code2, action: () => wrapSelection('<pre><code>', '</code></pre>') },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <header className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <label className="text-sm font-black text-slate-900">{label}</label>
          <p className="mt-0.5 text-xs leading-5 text-slate-500">{hint}</p>
        </div>
        <div className="inline-flex self-start rounded-xl border border-slate-200 bg-white p-1">
          <button type="button" onClick={() => setMode('edit')} className={`inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-xs font-black ${mode === 'edit' ? 'bg-slate-950 text-white' : 'text-slate-500 hover:bg-slate-50'}`}><Code2 className="h-3.5 w-3.5" />Soạn thảo</button>
          <button type="button" onClick={() => setMode('preview')} className={`inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-xs font-black ${mode === 'preview' ? 'bg-slate-950 text-white' : 'text-slate-500 hover:bg-slate-50'}`}><Eye className="h-3.5 w-3.5" />Preview</button>
        </div>
      </header>

      {mode === 'edit' ? (
        <>
          <div className="flex flex-wrap gap-1 border-b border-slate-100 p-2">
            {tools.map((tool) => <button key={tool.label} type="button" onClick={tool.action} title={tool.label} aria-label={tool.label} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-primary-700"><tool.icon className="h-4 w-4" /></button>)}
        </div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          spellCheck
          style={{ minHeight }}
          className="block w-full resize-y bg-white p-5 font-mono text-sm leading-7 text-slate-800 outline-none placeholder:text-slate-400"
          placeholder="<h2>Tiêu đề nội dung</h2>\n<p>Nội dung chi tiết...</p>"
        />
      ) : (
        <iframe title="Xem trước nội dung CMS" sandbox="" srcDoc={preview} style={{ minHeight }} className="block w-full border-0 bg-white" />
      )}
    </section>
  );
}

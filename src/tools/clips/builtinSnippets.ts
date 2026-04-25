export interface Snippet {
  id: string;
  title: string;
  description: string;
  lang: 'javascript' | 'bash' | 'typescript';
  code: string;
  tags: string[];
  builtin: true;
}

export const BUILTIN_SNIPPETS: Snippet[] = [
  {
    id: 'claude-screenshot',
    title: 'Claude スクリーンショット',
    description: 'ページ全体をキャプチャしてクリップボードにコピー。Claudeに貼り付けて共有できます。',
    lang: 'javascript',
    tags: ['claude', 'screenshot'],
    builtin: true,
    code: `(async () => {
  // html2canvas を CDN から読み込み
  if (!window.html2canvas) {
    await new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  const canvas = await html2canvas(document.documentElement, {
    useCORS: true,
    scale: window.devicePixelRatio,
  });
  canvas.toBlob(async blob => {
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      console.log('✅ スクリーンショットをクリップボードにコピーしました。Claudeに貼り付けてください。');
    } catch {
      const a = Object.assign(document.createElement('a'), {
        href: URL.createObjectURL(blob), download: 'screenshot.png',
      });
      a.click();
      console.log('✅ スクリーンショットをダウンロードしました。');
    }
  });
})();`,
  },
  {
    id: 'claude-dom',
    title: 'Claude DOM ダンプ',
    description: 'DOM構造をテキストでクリップボードにコピー。Claudeにレイアウト・構造を伝えられます。',
    lang: 'javascript',
    tags: ['claude', 'dom'],
    builtin: true,
    code: `(() => {
  const seen = new WeakSet();
  function dump(el, depth = 0) {
    if (depth > 6 || !el?.tagName || seen.has(el)) return '';
    seen.add(el);
    const indent = '  '.repeat(depth);
    const tag = el.tagName.toLowerCase();
    const id = el.id ? \` #\${el.id}\` : '';
    const cls = el.className && typeof el.className === 'string' && el.className.trim()
      ? ' .' + el.className.trim().split(/\\s+/).slice(0, 3).join('.') : '';
    const role = el.getAttribute('role') ? \` [role=\${el.getAttribute('role')}]\` : '';
    const aria = el.getAttribute('aria-label') ? \` [aria-label="\${el.getAttribute('aria-label')}"]\` : '';
    const text = el.children.length === 0 && el.textContent?.trim()
      ? \` "\${el.textContent.trim().slice(0, 80)}"\` : '';
    const children = Array.from(el.children).map(c => dump(c, depth + 1)).filter(Boolean).join('\\n');
    return \`\${indent}<\${tag}\${id}\${cls}\${role}\${aria}\${text}>\${children ? '\\n' + children : ''}\`;
  }
  const output = \`--- DOM (\${location.href}) ---\\n\` + dump(document.body);
  navigator.clipboard.writeText(output)
    .then(() => console.log('✅ DOM をクリップボードにコピーしました。Claudeに貼り付けてください。'))
    .catch(() => { console.log('コピー失敗。以下をコピーしてください：'); console.log(output); });
})();`,
  },
];

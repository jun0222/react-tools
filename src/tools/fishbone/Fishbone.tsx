import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import mermaid from 'mermaid';
import { Fish } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import './Fishbone.css';

const STORAGE_KEY = 'fishbone-data';

interface Cause {
  id: string;
  text: string;
}

interface Category {
  id: string;
  name: string;
  causes: Cause[];
}

interface FishboneData {
  effect: string;
  categories: Category[];
}

let _id = 0;
const uid = () => `fb${++_id}`;

const DEFAULT: FishboneData = {
  effect: 'ソフトウェアリリース遅延',
  categories: [
    { id: uid(), name: '人 (Man)', causes: [{ id: uid(), text: '経験不足' }, { id: uid(), text: 'スキルギャップ' }] },
    { id: uid(), name: '方法 (Method)', causes: [{ id: uid(), text: 'プロセス未整備' }] },
    { id: uid(), name: '機械 (Machine)', causes: [{ id: uid(), text: 'ツール不足' }] },
    { id: uid(), name: '材料 (Material)', causes: [{ id: uid(), text: '品質のばらつき' }] },
  ],
};

const load = (): FishboneData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT;
  } catch { return DEFAULT; }
};

const buildCode = (data: FishboneData): string => {
  const esc = (s: string) => s.replace(/"/g, "'");
  const lines = [
    'ishikawa',
    `    "${esc(data.effect)}"`,
  ];
  for (const cat of data.categories) {
    lines.push(`        "${esc(cat.name)}"`);
    for (const cause of cat.causes) {
      lines.push(`            "${esc(cause.text)}"`);
    }
  }
  return lines.join('\n');
};

let renderSeq = 0;

const Fishbone = () => {
  const { dark } = useTheme();
  const [data, setData] = useState<FishboneData>(load);
  const [hasSvg, setHasSvg] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [causeInputs, setCauseInputs] = useState<Record<string, string>>({});
  const [toast, setToast] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);
  const svgCache = useRef('');

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }, [data]);

  const code = useMemo(() => buildCode(data), [data]);

  const [debounced, setDebounced] = useState(code);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(code), 400);
    return () => clearTimeout(t);
  }, [code]);

  useEffect(() => {
    if (!previewRef.current) return;
    if (!debounced.trim()) {
      previewRef.current.innerHTML = '';
      svgCache.current = '';
      setHasSvg(false);
      return;
    }
    const id = `fb-svg-${++renderSeq}`;
    mermaid.initialize({ startOnLoad: false, theme: dark ? 'dark' : 'default' });
    mermaid.render(id, debounced)
      .then(({ svg }) => {
        if (previewRef.current) {
          previewRef.current.innerHTML = svg;
          svgCache.current = svg;
          setHasSvg(true);
        }
      })
      .catch(() => {
        if (previewRef.current) {
          previewRef.current.innerHTML = '<span style="color:#f87171;font-size:12px">Syntax error</span>';
          svgCache.current = '';
          setHasSvg(false);
        }
      });
  }, [debounced, dark]);

  const showToast = useCallback((msg: string) => {
    setToast(msg); setTimeout(() => setToast(''), 1800);
  }, []);

  const addCategory = () => {
    if (!newCatName.trim()) return;
    setData(prev => ({ ...prev, categories: [...prev.categories, { id: uid(), name: newCatName.trim(), causes: [] }] }));
    setNewCatName('');
  };

  const removeCategory = (cid: string) =>
    setData(prev => ({ ...prev, categories: prev.categories.filter(c => c.id !== cid) }));

  const addCause = (cid: string) => {
    const text = (causeInputs[cid] ?? '').trim();
    if (!text) return;
    setData(prev => ({
      ...prev,
      categories: prev.categories.map(c =>
        c.id === cid ? { ...c, causes: [...c.causes, { id: uid(), text }] } : c
      ),
    }));
    setCauseInputs(prev => ({ ...prev, [cid]: '' }));
  };

  const removeCause = (cid: string, causeid: string) =>
    setData(prev => ({
      ...prev,
      categories: prev.categories.map(c =>
        c.id === cid ? { ...c, causes: c.causes.filter(ca => ca.id !== causeid) } : c
      ),
    }));

  const exportSvg = () => {
    const svg = svgCache.current; if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'fishbone.svg' });
    a.click(); URL.revokeObjectURL(a.href);
    showToast('SVGを保存しました');
  };

  const exportPng = useCallback(() => {
    const svg = svgCache.current; if (!svg) return;
    const wm = svg.match(/width="(\d+(?:\.\d+)?)"/), hm = svg.match(/height="(\d+(?:\.\d+)?)"/);
    const w = wm ? parseFloat(wm[1]) : 900, h = hm ? parseFloat(hm[1]) : 400, scale = 2;
    const svgUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = w * scale; canvas.height = h * scale;
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      ctx.scale(scale, scale); ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(svgUrl);
      canvas.toBlob(blob => {
        if (!blob) return;
        const pngUrl = URL.createObjectURL(blob);
        const a = Object.assign(document.createElement('a'), { href: pngUrl, download: 'fishbone.png' });
        a.click(); URL.revokeObjectURL(pngUrl);
        showToast('PNGを保存しました');
      }, 'image/png');
    };
    img.src = svgUrl;
  }, [showToast]);

  return (
    <div className={`fishbone-root ${dark ? 'dark' : 'light'}`}>
      <div className="fb-header">
        <div className="fb-logo-icon"><Fish size={20} color="white" /></div>
        <h1><span className="fb-accent">Fishbone</span> 特性要因図</h1>
        {hasSvg && (
          <div className="fb-export-row">
            <button className="fb-btn fb-btn-ghost" onClick={exportSvg}>SVG</button>
            <button className="fb-btn fb-btn-ghost" onClick={exportPng}>PNG</button>
          </div>
        )}
      </div>

      {/* ===== PREVIEW — top ===== */}
      <div className="fb-preview-wrap">
        {!hasSvg && <div className="fb-preview-empty">フィッシュボーン図がここに表示されます</div>}
        <div ref={previewRef} className="fb-preview-inner" />
      </div>

      {/* ===== FORM — bottom ===== */}
      <div className="fb-form-area">
        <div className="fb-form-group">
          <span className="fb-form-label">問題 / 効果</span>
          <input
            className="fb-input"
            placeholder="問題・結果を入力"
            value={data.effect}
            onChange={e => setData(prev => ({ ...prev, effect: e.target.value }))}
          />
        </div>

        <div className="fb-sections">
          {data.categories.map(cat => (
            <div key={cat.id} className="fb-section-block">
              <div className="fb-section-header">
                <span className="fb-section-name">● {cat.name}</span>
                <button className="fb-btn fb-btn-ghost fb-btn-xs" onClick={() => removeCategory(cat.id)}>✕</button>
              </div>
              <div className="fb-cause-list">
                {cat.causes.map(cause => (
                  <div key={cause.id} className="fb-cause-item">
                    <span className="fb-cause-text">{cause.text}</span>
                    <button className="fb-btn fb-btn-ghost fb-btn-xs" onClick={() => removeCause(cat.id, cause.id)}>✕</button>
                  </div>
                ))}
                <div className="fb-cause-add">
                  <input
                    className="fb-input"
                    placeholder="要因を追加..."
                    value={causeInputs[cat.id] ?? ''}
                    onChange={e => setCauseInputs(prev => ({ ...prev, [cat.id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && addCause(cat.id)}
                  />
                  <button className="fb-btn fb-btn-primary fb-btn-xs" onClick={() => addCause(cat.id)} disabled={!(causeInputs[cat.id] ?? '').trim()}>追加</button>
                </div>
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              className="fb-input"
              placeholder="カテゴリ名 (例: 人, 方法, 機械...)"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCategory()}
              style={{ maxWidth: 280 }}
            />
            <button className="fb-btn fb-btn-primary" onClick={addCategory} disabled={!newCatName.trim()}>＋ カテゴリ追加</button>
          </div>
        </div>
      </div>

      {toast && <div className="fb-toast">{toast}</div>}
    </div>
  );
};

export default Fishbone;

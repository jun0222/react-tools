import { useState, useCallback, useMemo } from 'react';
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
  effect: '問題・結果',
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

// CJK character width for proper text measurement
const charWidth = (ch: string) => ch.charCodeAt(0) > 0x7f ? 14 : 8;
const textWidth = (s: string) => [...s].reduce((acc, c) => acc + charWidth(c), 0);

const generateSVG = (data: FishboneData, dark: boolean): string => {
  const W = 900, H = 500;
  const spineY = H / 2;
  const headX = W - 60;
  const tailX = 80;
  const n = data.categories.length;

  const bg = dark ? '#0d0d14' : '#f4f6fa';
  const textColor = dark ? '#e0e0e0' : '#1a1a2e';
  const spineColor = dark ? '#6366f1' : '#4f46e5';
  const boneColor = dark ? '#888' : '#555';
  const headBg = dark ? '#ef4444' : '#dc2626';
  const catColors = ['#ef4444', '#f97316', '#3b82f6', '#10b981', '#a855f7', '#06b6d4', '#ec4899', '#f59e0b'];

  // Place bones: top half uses first ceil(n/2), bottom half uses rest
  const top = data.categories.slice(0, Math.ceil(n / 2));
  const bot = data.categories.slice(Math.ceil(n / 2));

  const boneSpacing = (headX - tailX - 80) / Math.max(top.length, bot.length, 1);
  const startX = tailX + 80;

  const lines: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`,
    `<rect width="${W}" height="${H}" fill="${bg}" rx="8"/>`,
    // Spine
    `<line x1="${tailX}" y1="${spineY}" x2="${headX}" y2="${spineY}" stroke="${spineColor}" stroke-width="3"/>`,
    // Arrow head
    `<polygon points="${headX},${spineY} ${headX - 14},${spineY - 7} ${headX - 14},${spineY + 7}" fill="${headBg}"/>`,
    // Effect box
    `<rect x="${headX}" y="${spineY - 28}" width="120" height="56" rx="8" fill="${headBg}"/>`,
    `<text x="${headX + 60}" y="${spineY + 6}" text-anchor="middle" font-size="13" font-weight="700" fill="white" font-family="sans-serif">${data.effect.slice(0, 8)}</text>`,
  ];

  const renderBone = (cat: Category, idx: number, isTop: boolean) => {
    const bx = startX + idx * boneSpacing;
    const dy = isTop ? -100 : 100;
    const color = catColors[idx % catColors.length];
    const boneEndY = spineY + dy;
    const boneStartY = spineY;

    lines.push(`<line x1="${bx}" y1="${boneStartY}" x2="${bx}" y2="${boneEndY}" stroke="${color}" stroke-width="2"/>`);

    // Category label
    const labelY = isTop ? boneEndY - 10 : boneEndY + 20;
    const tw = textWidth(cat.name);
    const lx = bx - tw / 2;
    lines.push(`<rect x="${lx - 4}" y="${labelY - 16}" width="${tw + 8}" height="20" rx="4" fill="${color}" opacity="0.9"/>`);
    lines.push(`<text x="${bx}" y="${labelY}" text-anchor="middle" font-size="11" font-weight="700" fill="white" font-family="sans-serif">${cat.name}</text>`);

    // Causes — sub-branches
    cat.causes.forEach((cause, ci) => {
      const offset = (ci + 1) * boneSpacing * 0.15;
      const cx = bx - offset;
      const fraction = (ci + 1) / (cat.causes.length + 1);
      const cy = boneStartY + (boneEndY - boneStartY) * fraction;
      const subLen = 50;
      const subEndY = cy + (isTop ? -subLen * 0.5 : subLen * 0.5);
      const subEndX = cx - subLen * 0.6;
      lines.push(`<line x1="${cx}" y1="${cy}" x2="${subEndX}" y2="${subEndY}" stroke="${boneColor}" stroke-width="1.5"/>`);
      const textY = isTop ? subEndY - 4 : subEndY + 14;
      lines.push(`<text x="${subEndX}" y="${textY}" text-anchor="end" font-size="10" fill="${textColor}" font-family="sans-serif">${cause.text}</text>`);
    });
  };

  top.forEach((cat, i) => renderBone(cat, i, true));
  bot.forEach((cat, i) => renderBone(cat, i, false));

  lines.push('</svg>');
  return lines.join('\n');
};

const Fishbone = () => {
  const { dark } = useTheme();
  const [data, setData] = useState<FishboneData>(load);
  const [newCatName, setNewCatName] = useState('');
  const [causeInputs, setCauseInputs] = useState<Record<string, string>>({});
  const [toast, setToast] = useState('');

  const save = (d: FishboneData) => {
    setData(d);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  };

  const showToast = useCallback((msg: string) => {
    setToast(msg); setTimeout(() => setToast(''), 1800);
  }, []);

  const svg = useMemo(() => generateSVG(data, dark), [data, dark]);

  const addCategory = () => {
    if (!newCatName.trim()) return;
    save({ ...data, categories: [...data.categories, { id: uid(), name: newCatName.trim(), causes: [] }] });
    setNewCatName('');
  };

  const removeCategory = (cid: string) =>
    save({ ...data, categories: data.categories.filter(c => c.id !== cid) });

  const addCause = (cid: string) => {
    const text = (causeInputs[cid] ?? '').trim();
    if (!text) return;
    save({ ...data, categories: data.categories.map(c => c.id === cid ? { ...c, causes: [...c.causes, { id: uid(), text }] } : c) });
    setCauseInputs(prev => ({ ...prev, [cid]: '' }));
  };

  const removeCause = (cid: string, causeid: string) =>
    save({ ...data, categories: data.categories.map(c => c.id === cid ? { ...c, causes: c.causes.filter(ca => ca.id !== causeid) } : c) });

  const exportSvg = () => {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'fishbone.svg' });
    a.click(); URL.revokeObjectURL(a.href);
    showToast('SVGを保存しました');
  };

  const exportPng = useCallback(() => {
    const scale = 2;
    const svgUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 900 * scale; canvas.height = 500 * scale;
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
  }, [svg, showToast]);

  return (
    <div className={`fishbone-root ${dark ? 'dark' : 'light'}`}>
      <div className="fb-header">
        <div className="fb-logo-icon"><Fish size={22} color="white" /></div>
        <h1><span className="fb-accent">Fishbone</span> 特性要因図</h1>
      </div>

      <div className="fb-layout">
        {/* ===== LEFT: Form ===== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="fb-panel">
            <div className="fb-panel-title">問題 / 効果</div>
            <input
              className="fb-input"
              placeholder="問題・結果を入力"
              value={data.effect}
              onChange={e => save({ ...data, effect: e.target.value })}
            />
          </div>

          <div className="fb-panel">
            <div className="fb-panel-title">原因カテゴリ</div>
            {data.categories.map(cat => (
              <div key={cat.id} className="fb-category">
                <div className="fb-category-header">
                  <span className="fb-category-name">{cat.name}</span>
                  <button className="fb-btn-danger" onClick={() => removeCategory(cat.id)}>✕</button>
                </div>
                <div className="fb-causes-list">
                  {cat.causes.map(cause => (
                    <div key={cause.id} className="fb-cause-item">
                      <span>・{cause.text}</span>
                      <button className="fb-btn-danger" onClick={() => removeCause(cat.id, cause.id)}>✕</button>
                    </div>
                  ))}
                  <div className="fb-cause-add-row">
                    <input
                      className="fb-input"
                      placeholder="要因を追加..."
                      value={causeInputs[cat.id] ?? ''}
                      onChange={e => setCauseInputs(prev => ({ ...prev, [cat.id]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && addCause(cat.id)}
                      style={{ fontSize: 12 }}
                    />
                    <button className="fb-btn fb-btn-primary" style={{ padding: '4px 10px' }} onClick={() => addCause(cat.id)}>追加</button>
                  </div>
                </div>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 6 }}>
              <input
                className="fb-input"
                placeholder="カテゴリ名 (例: 人, 方法, 機械...)"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCategory()}
              />
              <button className="fb-btn fb-btn-primary" onClick={addCategory} disabled={!newCatName.trim()}>追加</button>
            </div>
          </div>
        </div>

        {/* ===== RIGHT: Preview ===== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="fb-preview" dangerouslySetInnerHTML={{ __html: svg }} />
          <div className="fb-export-row">
            <button className="fb-btn fb-btn-ghost" onClick={exportSvg}>SVG 保存</button>
            <button className="fb-btn fb-btn-ghost" onClick={exportPng}>PNG 保存</button>
          </div>
        </div>
      </div>

      {toast && <div className="fb-toast">{toast}</div>}
    </div>
  );
};

export default Fishbone;

import { useState, useRef, useCallback } from 'react';
import { Layout, Download, Upload, Save, ChevronUp, ChevronDown, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import {
  type Slide,
  type SlideLayout,
  type SlideshowData,
  LAYOUT_CONFIG,
  LAYOUTS,
  addSlide,
  removeSlide,
  moveSlide,
  generateAsciiSlide,
  generateAsciiPresentation,
  exportJson,
  importJson,
} from './slideshowCore';
import './Slideshow.css';

const STORAGE_KEY = 'slideshow-state-v1';
const DEFAULT_DATA: SlideshowData = { presentationTitle: '', slides: [] };

const loadData = (): SlideshowData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = importJson(raw);
      if (parsed) return parsed;
    }
  } catch { /* ignore */ }
  return DEFAULT_DATA;
};

// ---- Slide thumbnail ----

const SlideThumbnail = ({ layout }: { layout: SlideLayout }) => (
  <div className={`sw-thumb sw-thumb-${layout.replace('-', '_')}`}>
    {layout === 'title' && (
      <div className="sw-thumb-inner sw-thumb-title-inner">
        <div className="sw-thumb-title-bar" />
        <div className="sw-thumb-title-sep" />
        <div className="sw-thumb-title-sub" />
      </div>
    )}
    {layout === 'section' && (
      <div className="sw-thumb-inner sw-thumb-section-inner">
        <div className="sw-thumb-sec-line" />
        <div className="sw-thumb-sec-text" />
        <div className="sw-thumb-sec-line" />
      </div>
    )}
    {layout === 'content' && (
      <div className="sw-thumb-inner sw-thumb-content-inner">
        <div className="sw-thumb-cnt-title" />
        <div className="sw-thumb-cnt-sep" />
        <div className="sw-thumb-cnt-line" />
        <div className="sw-thumb-cnt-line sw-thumb-cnt-line-short" />
        <div className="sw-thumb-cnt-line" />
      </div>
    )}
    {layout === 'two-col' && (
      <div className="sw-thumb-inner sw-thumb-twocol-inner">
        <div className="sw-thumb-tc-title" />
        <div className="sw-thumb-tc-sep" />
        <div className="sw-thumb-tc-cols">
          <div className="sw-thumb-tc-col">
            <div className="sw-thumb-tc-line" />
            <div className="sw-thumb-tc-line sw-thumb-tc-line-short" />
          </div>
          <div className="sw-thumb-tc-div" />
          <div className="sw-thumb-tc-col">
            <div className="sw-thumb-tc-line" />
            <div className="sw-thumb-tc-line" />
          </div>
        </div>
      </div>
    )}
  </div>
);

// ---- Slide editor ----

interface EditorProps {
  slide: Slide;
  index: number;
  total: number;
  onChange: (patch: Partial<Slide>) => void;
}

const SlideEditor = ({ slide, index, total, onChange }: EditorProps) => {
  const ascii = generateAsciiSlide(slide, index, total);

  return (
    <div className="sw-edit-wrap">
      <div className="sw-edit-section">
        <div className="sw-edit-label">レイアウト</div>
        <div className="sw-layout-picker">
          {LAYOUTS.map(l => (
            <button
              key={l}
              className={`sw-layout-btn ${slide.layout === l ? 'sw-layout-btn-active' : ''}`}
              onClick={() => onChange({ layout: l })}
            >
              {LAYOUT_CONFIG[l].name}
            </button>
          ))}
        </div>
      </div>

      {slide.layout !== 'blank' && (
        <div className="sw-edit-section">
          <div className="sw-edit-label">
            {slide.layout === 'title' ? 'タイトル' :
             slide.layout === 'section' ? 'セクション名' : 'スライドタイトル'}
          </div>
          <input
            className="sw-edit-input"
            value={slide.title}
            onChange={e => onChange({ title: e.target.value })}
            placeholder={
              slide.layout === 'title' ? 'プレゼンテーションのタイトル' :
              slide.layout === 'section' ? 'セクション名' : 'スライドのタイトル'
            }
            aria-label="スライドタイトル"
          />
        </div>
      )}

      {(slide.layout === 'title' || slide.layout === 'content') && (
        <div className="sw-edit-section">
          <div className="sw-edit-label">
            {slide.layout === 'title' ? 'サブタイトル' : '本文（1行1ポイント）'}
          </div>
          <textarea
            className="sw-edit-textarea"
            value={slide.body}
            onChange={e => onChange({ body: e.target.value })}
            placeholder={
              slide.layout === 'title'
                ? 'サブタイトル・発表者名など'
                : '・ポイント1\n・ポイント2\n・ポイント3'
            }
            rows={slide.layout === 'title' ? 3 : 6}
            aria-label="本文"
          />
        </div>
      )}

      {slide.layout === 'two-col' && (
        <div className="sw-edit-section">
          <div className="sw-edit-label">本文（2カラム）</div>
          <div className="sw-edit-two-col">
            <div className="sw-edit-col">
              <div className="sw-edit-sublabel">左カラム</div>
              <textarea
                className="sw-edit-textarea"
                value={slide.body}
                onChange={e => onChange({ body: e.target.value })}
                placeholder="左の内容"
                rows={5}
                aria-label="左カラム"
              />
            </div>
            <div className="sw-edit-col">
              <div className="sw-edit-sublabel">右カラム</div>
              <textarea
                className="sw-edit-textarea"
                value={slide.bodyRight}
                onChange={e => onChange({ bodyRight: e.target.value })}
                placeholder="右の内容"
                rows={5}
                aria-label="右カラム"
              />
            </div>
          </div>
        </div>
      )}

      <details className="sw-ascii-details">
        <summary className="sw-ascii-summary">ASCIIプレビュー</summary>
        <pre className="sw-ascii-pre">{ascii}</pre>
      </details>
    </div>
  );
};

// ---- Main component ----

const Slideshow = () => {
  const { dark } = useTheme();
  const [data, setData] = useState<SlideshowData>(loadData);
  const [selectedId, setSelectedId] = useState<string | null>(
    () => loadData().slides[0]?.id ?? null
  );
  const [toast, setToast] = useState('');
  const importRef = useRef<HTMLInputElement>(null);

  const slides = data.slides;
  const selectedSlide = slides.find(s => s.id === selectedId) ?? null;
  const selectedIndex = slides.findIndex(s => s.id === selectedId);

  const persist = (next: SlideshowData) => {
    setData(next);
    try { localStorage.setItem(STORAGE_KEY, exportJson(next)); } catch { /* ignore */ }
  };

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  }, []);

  const updateSlide = (id: string, patch: Partial<Slide>) =>
    persist({ ...data, slides: slides.map(s => s.id === id ? { ...s, ...patch } : s) });

  const handleAddSlide = (layout: SlideLayout) => {
    const idx = selectedIndex >= 0 ? selectedIndex : slides.length - 1;
    const newSlides = addSlide(slides, layout, idx >= 0 ? idx : undefined);
    const newSlide = newSlides[idx >= 0 ? idx + 1 : newSlides.length - 1];
    persist({ ...data, slides: newSlides });
    setSelectedId(newSlide.id);
  };

  const handleRemoveSlide = (id: string) => {
    const newSlides = removeSlide(slides, id);
    persist({ ...data, slides: newSlides });
    if (newSlides.length === 0) {
      setSelectedId(null);
    } else if (selectedId === id) {
      const idx = Math.min(selectedIndex, newSlides.length - 1);
      setSelectedId(newSlides[Math.max(0, idx)]?.id ?? null);
    }
  };

  const handleMoveSlide = (id: string, direction: 'up' | 'down') =>
    persist({ ...data, slides: moveSlide(slides, id, direction) });

  const handleExportJson = () => {
    const json = exportJson(data);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safe = (data.presentationTitle || 'untitled').replace(/[<>:"/\\|?*\s]+/g, '_');
    a.download = `slideshow_${safe}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('JSONをエクスポートしました');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const result = importJson(ev.target?.result as string);
      if (!result) { showToast('読み込み失敗'); return; }
      persist(result);
      setSelectedId(result.slides[0]?.id ?? null);
      showToast('インポートしました');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportTxt = () => {
    const content = generateAsciiPresentation(data);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safe = (data.presentationTitle || 'untitled').replace(/[<>:"/\\|?*\s]+/g, '_');
    a.download = `slideshow_${safe}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('.txtを保存しました');
  };

  return (
    <div className={`slideshow-tool ${dark ? 'dark' : 'light'}`}>
      <div className="sw-header">
        <div className="sw-logo"><Layout size={22} color="white" /></div>
        <div className="sw-title-area">
          <h1>Slide<span className="sw-accent">show</span></h1>
          <input
            className="sw-pres-title"
            placeholder="プレゼンテーションのタイトル"
            value={data.presentationTitle}
            onChange={e => persist({ ...data, presentationTitle: e.target.value })}
            aria-label="プレゼンテーションタイトル"
          />
        </div>
        <div className="sw-header-actions">
          <button className="sw-btn sw-btn-ghost" onClick={handleExportJson}>
            <Download size={13} /> JSON
          </button>
          <button className="sw-btn sw-btn-ghost" onClick={() => importRef.current?.click()}>
            <Upload size={13} /> インポート
          </button>
          <button
            className="sw-btn sw-btn-primary"
            onClick={handleExportTxt}
            disabled={slides.length === 0}
          >
            <Save size={13} /> .txt保存
          </button>
          <input
            ref={importRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImportJson}
          />
        </div>
      </div>

      <div className="sw-main">
        {/* left: slide list */}
        <div className="sw-list">
          <div className="sw-list-slides">
            {slides.length === 0 && (
              <div className="sw-list-empty">スライドを追加してください</div>
            )}
            {slides.map((slide, i) => (
              <div
                key={slide.id}
                className={`sw-slide-item ${selectedId === slide.id ? 'sw-slide-item-active' : ''}`}
                onClick={() => setSelectedId(slide.id)}
              >
                <div className="sw-slide-num">{i + 1}</div>
                <SlideThumbnail layout={slide.layout} />
                <div className="sw-slide-info">
                  <span className="sw-slide-layout-badge">{LAYOUT_CONFIG[slide.layout].name}</span>
                  <span className="sw-slide-title-text">
                    {slide.title || '（無題）'}
                  </span>
                </div>
                <div className="sw-slide-controls">
                  <button
                    className="sw-ctrl-btn"
                    onClick={e => { e.stopPropagation(); handleMoveSlide(slide.id, 'up'); }}
                    disabled={i === 0}
                    aria-label="上へ"
                  ><ChevronUp size={12} /></button>
                  <button
                    className="sw-ctrl-btn"
                    onClick={e => { e.stopPropagation(); handleMoveSlide(slide.id, 'down'); }}
                    disabled={i === slides.length - 1}
                    aria-label="下へ"
                  ><ChevronDown size={12} /></button>
                  <button
                    className="sw-ctrl-btn sw-ctrl-del"
                    onClick={e => { e.stopPropagation(); handleRemoveSlide(slide.id); }}
                    aria-label="削除"
                  ><X size={12} /></button>
                </div>
              </div>
            ))}
          </div>

          <div className="sw-add-bar">
            <div className="sw-add-label">スライドを追加</div>
            <div className="sw-add-btns">
              {LAYOUTS.map(layout => (
                <button
                  key={layout}
                  className="sw-add-btn"
                  onClick={() => handleAddSlide(layout)}
                  title={`${LAYOUT_CONFIG[layout].name}スライドを追加`}
                >
                  {LAYOUT_CONFIG[layout].name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* right: editor */}
        <div className="sw-editor">
          {selectedSlide ? (
            <SlideEditor
              slide={selectedSlide}
              index={selectedIndex}
              total={slides.length}
              onChange={patch => updateSlide(selectedSlide.id, patch)}
            />
          ) : (
            <div className="sw-editor-empty">
              <Layout size={40} className="sw-editor-empty-icon" />
              <p>左のパネルからスライドを選択するか<br />「スライドを追加」で始めましょう</p>
            </div>
          )}
        </div>
      </div>

      {toast && <div className="sw-toast">{toast}</div>}
    </div>
  );
};

export default Slideshow;

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

const useDebounce = <T,>(value: T, ms: number): T => {
  const [val, setVal] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setVal(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return val;
};
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Layout, Download, Upload, ChevronUp, ChevronDown, X, Plus } from 'lucide-react';
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
  exportJson,
  importJson,
} from './slideshowCore';
import { PresentationDoc } from './PresentationDoc';
import './Slideshow.css';

const STORAGE_KEY = 'slideshow-state-v2';
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

// ---- スライドプレビュー（CSS） ----

const SlidePreview = ({ slide }: { slide: Slide }) => {
  const layout = slide.layout;
  return (
    <div className={`sw-preview sw-preview-${layout.replace('-', '_')}`}>
      {layout === 'title' && (
        <div className="sw-pv-title-inner">
          <div className="sw-pv-title-text">{slide.title || 'タイトル'}</div>
          <div className="sw-pv-title-sep" />
          {slide.body && <div className="sw-pv-subtitle-text">{slide.body}</div>}
        </div>
      )}
      {layout === 'section' && (
        <div className="sw-pv-section-inner">
          <div className="sw-pv-sec-line" />
          <div className="sw-pv-sec-text">{slide.title || 'セクション'}</div>
          <div className="sw-pv-sec-line" />
        </div>
      )}
      {layout === 'content' && (
        <>
          <div className="sw-pv-topbar" />
          <div className="sw-pv-content-inner">
            <div className="sw-pv-slide-title">{slide.title || 'タイトル'}</div>
            <div className="sw-pv-slide-sep" />
            <div className="sw-pv-body">{slide.body}</div>
          </div>
        </>
      )}
      {layout === 'two-col' && (
        <>
          <div className="sw-pv-topbar" />
          <div className="sw-pv-content-inner">
            <div className="sw-pv-slide-title">{slide.title || 'タイトル'}</div>
            <div className="sw-pv-slide-sep" />
            <div className="sw-pv-twocol">
              <div className="sw-pv-col">
                <div className="sw-pv-col-label">左</div>
                <div className="sw-pv-body">{slide.body}</div>
              </div>
              <div className="sw-pv-col-div" />
              <div className="sw-pv-col">
                <div className="sw-pv-col-label">右</div>
                <div className="sw-pv-body">{slide.bodyRight}</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ---- スライドサムネイル（リスト用） ----

const SlideThumbnail = ({ layout }: { layout: SlideLayout }) => (
  <div className={`sw-thumb sw-thumb-${layout.replace('-', '_')}`}>
    {layout === 'title' && (
      <div className="sw-thumb-title-inner">
        <div className="sw-thumb-title-bar" />
        <div className="sw-thumb-title-sep" />
        <div className="sw-thumb-title-sub" />
      </div>
    )}
    {layout === 'section' && (
      <div className="sw-thumb-section-inner">
        <div className="sw-thumb-sec-line" />
        <div className="sw-thumb-sec-text" />
        <div className="sw-thumb-sec-line" />
      </div>
    )}
    {layout === 'content' && (
      <div className="sw-thumb-content-inner">
        <div className="sw-thumb-topbar" />
        <div className="sw-thumb-cnt-title" />
        <div className="sw-thumb-cnt-sep" />
        <div className="sw-thumb-cnt-line" />
        <div className="sw-thumb-cnt-line sw-thumb-cnt-line-short" />
        <div className="sw-thumb-cnt-line" />
      </div>
    )}
    {layout === 'two-col' && (
      <div className="sw-thumb-twocol-inner">
        <div className="sw-thumb-topbar" />
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

// ---- スライドエディタ ----

interface EditorProps {
  slide: Slide;
  onChange: (patch: Partial<Slide>) => void;
}

const SlideEditor = ({ slide, onChange }: EditorProps) => (
  <div className="sw-edit-wrap">
    {/* レイアウト */}
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

    {/* タイトル */}
    {slide.layout !== 'blank' && (
      <div className="sw-edit-section">
        <div className="sw-edit-label">
          {slide.layout === 'title' ? 'メインタイトル' :
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
          aria-label="タイトル"
        />
      </div>
    )}

    {/* コンテンツ本文 */}
    {(slide.layout === 'title' || slide.layout === 'content') && (
      <div className="sw-edit-section">
        <div className="sw-edit-label">
          {slide.layout === 'title' ? 'サブタイトル' : '本文'}
        </div>
        <textarea
          className="sw-edit-textarea"
          value={slide.body}
          onChange={e => onChange({ body: e.target.value })}
          placeholder={slide.layout === 'title' ? 'サブタイトル・発表者名など' : '内容を書いてください'}
          rows={slide.layout === 'title' ? 2 : 6}
          aria-label={slide.layout === 'title' ? 'サブタイトル' : '本文'}
        />
      </div>
    )}

    {/* 2カラム */}
    {slide.layout === 'two-col' && (
      <div className="sw-edit-section">
        <div className="sw-edit-label">本文</div>
        <div className="sw-edit-two-col">
          <div>
            <div className="sw-edit-sublabel">左</div>
            <textarea
              className="sw-edit-textarea"
              value={slide.body}
              onChange={e => onChange({ body: e.target.value })}
              placeholder="左カラムの内容"
              rows={5}
              aria-label="左カラム"
            />
          </div>
          <div>
            <div className="sw-edit-sublabel">右</div>
            <textarea
              className="sw-edit-textarea"
              value={slide.bodyRight}
              onChange={e => onChange({ bodyRight: e.target.value })}
              placeholder="右カラムの内容"
              rows={5}
              aria-label="右カラム"
            />
          </div>
        </div>
      </div>
    )}
  </div>
);

// ---- メインコンポーネント ----

const Slideshow = () => {
  const { dark } = useTheme();
  const [data, setData] = useState<SlideshowData>(loadData);
  const [selectedId, setSelectedId] = useState<string | null>(
    () => loadData().slides[0]?.id ?? null
  );
  const [toast, setToast] = useState('');
  const importRef = useRef<HTMLInputElement>(null);

  const safe    = (data.presentationTitle || 'untitled').replace(/[<>:"/\\|?*\s]+/g, '_');
  const pdfData = useDebounce(data, 700);
  const pdfDoc  = useMemo(() => <PresentationDoc data={pdfData} />, [pdfData]);

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
    const after = selectedIndex >= 0 ? selectedIndex : slides.length - 1;
    const newSlides = addSlide(slides, layout, after >= 0 ? after : undefined);
    const newSlide = newSlides[after >= 0 ? after + 1 : newSlides.length - 1];
    persist({ ...data, slides: newSlides });
    setSelectedId(newSlide.id);
  };

  const handleRemoveSlide = (id: string) => {
    const newSlides = removeSlide(slides, id);
    persist({ ...data, slides: newSlides });
    if (newSlides.length === 0) {
      setSelectedId(null);
    } else if (selectedId === id) {
      const idx = Math.max(0, Math.min(selectedIndex, newSlides.length - 1));
      setSelectedId(newSlides[idx]?.id ?? null);
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
    a.download = `${safe}.json`;
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

  return (
    <div className={`slideshow-tool ${dark ? 'dark' : 'light'}`}>
      {/* ヘッダー */}
      <div className="sw-header">
        <div className="sw-logo"><Layout size={22} color="white" /></div>
        <div className="sw-title-area">
          <h1>Slide<span className="sw-accent">show</span></h1>
          <input
            className="sw-pres-title"
            placeholder="プレゼンテーションタイトル"
            value={data.presentationTitle}
            onChange={e => persist({ ...data, presentationTitle: e.target.value })}
            aria-label="プレゼンテーションタイトル"
          />
        </div>
        <div className="sw-header-actions">
          <button className="sw-btn sw-btn-ghost" onClick={handleExportJson} disabled={slides.length === 0}>
            <Download size={13} /> JSONエクスポート
          </button>
          <button className="sw-btn sw-btn-ghost" onClick={() => importRef.current?.click()}>
            <Upload size={13} /> JSONインポート
          </button>
          {slides.length > 0 ? (
            <PDFDownloadLink
              document={pdfDoc}
              fileName={`${safe}.pdf`}
              className="sw-btn sw-btn-primary"
            >
              {({ loading }) => (
                <><Download size={13} /> {loading ? '生成中…' : 'PDF を保存'}</>
              )}
            </PDFDownloadLink>
          ) : (
            <button className="sw-btn sw-btn-primary" disabled>
              <Download size={13} /> PDF を保存
            </button>
          )}
          <input
            ref={importRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImportJson}
          />
        </div>
      </div>

      {/* メイン */}
      <div className="sw-main">
        {/* 左：スライドリスト */}
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
                  <span className="sw-slide-title-text">{slide.title || '（無題）'}</span>
                </div>
                <div className="sw-slide-controls">
                  <button
                    className="sw-ctrl-btn"
                    onClick={e => { e.stopPropagation(); handleMoveSlide(slide.id, 'up'); }}
                    disabled={i === 0}
                    aria-label="上へ"
                  ><ChevronUp size={11} /></button>
                  <button
                    className="sw-ctrl-btn"
                    onClick={e => { e.stopPropagation(); handleMoveSlide(slide.id, 'down'); }}
                    disabled={i === slides.length - 1}
                    aria-label="下へ"
                  ><ChevronDown size={11} /></button>
                  <button
                    className="sw-ctrl-btn sw-ctrl-del"
                    onClick={e => { e.stopPropagation(); handleRemoveSlide(slide.id); }}
                    aria-label="削除"
                  ><X size={11} /></button>
                </div>
              </div>
            ))}
          </div>

          <div className="sw-add-bar">
            <div className="sw-add-label"><Plus size={10} /> スライドを追加</div>
            <div className="sw-add-btns">
              {LAYOUTS.map(layout => (
                <button
                  key={layout}
                  className="sw-add-btn"
                  onClick={() => handleAddSlide(layout)}
                  title={`${LAYOUT_CONFIG[layout].name}を追加`}
                >
                  {LAYOUT_CONFIG[layout].name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 中央：エディタ */}
        <div className="sw-editor-panel">
          {selectedSlide ? (
            <SlideEditor
              slide={selectedSlide}
              onChange={patch => updateSlide(selectedSlide.id, patch)}
            />
          ) : (
            <div className="sw-editor-empty">
              <Layout size={36} className="sw-editor-empty-icon" />
              <p>スライドを選択するか<br />左下のボタンで追加してください</p>
            </div>
          )}
        </div>

        {/* 右：CSSプレビュー */}
        <div className="sw-preview-panel">
          <div className="sw-preview-label">プレビュー</div>
          {selectedSlide ? (
            <div className="sw-preview-wrap">
              <SlidePreview slide={selectedSlide} />
              <div className="sw-preview-caption">
                {selectedIndex + 1} / {slides.length} &nbsp;·&nbsp; {LAYOUT_CONFIG[selectedSlide.layout].name}
              </div>
            </div>
          ) : (
            <div className="sw-preview-placeholder">スライドを選択</div>
          )}
        </div>
      </div>

      {toast && <div className="sw-toast">{toast}</div>}
    </div>
  );
};

export default Slideshow;

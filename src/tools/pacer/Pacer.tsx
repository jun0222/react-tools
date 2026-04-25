import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { splitText } from './pacerCore';
import type { SplitMode } from './pacerCore';
import './Pacer.css';

type Phase = 'setup' | 'reading';

const Pacer = () => {
  const { dark } = useTheme();
  const [phase, setPhase] = useState<Phase>('setup');
  const [rawText, setRawText] = useState('');
  const [splitMode, setSplitMode] = useState<SplitMode>('paragraph');
  const [secsPerPage, setSecsPerPage] = useState(6);
  const [charsPerPage, setCharsPerPage] = useState(300);

  const [chunks, setChunks] = useState<string[]>([]);
  const [idx, setIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [countdown, setCountdown] = useState(1); // 1 → 0

  const goNext = useCallback(() => {
    setIdx(prev => Math.min(prev + 1, chunks.length - 1));
  }, [chunks.length]);

  const goPrev = useCallback(() => {
    setIdx(prev => Math.max(prev - 1, 0));
  }, []);

  // Reset countdown on page change or play state change
  useEffect(() => { setCountdown(1); }, [idx, isPlaying]);

  // Auto-advance timer
  useEffect(() => {
    if (!isPlaying) return;
    const totalMs = secsPerPage * 1000;
    const intervalMs = 50;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += intervalMs;
      setCountdown(Math.max(0, 1 - elapsed / totalMs));
      if (elapsed >= totalMs) {
        elapsed = 0;
        setCountdown(1);
        setIdx(prev => {
          if (prev >= chunks.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, idx, secsPerPage, chunks.length]);

  // Keyboard shortcuts
  useEffect(() => {
    if (phase !== 'reading') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ') { e.preventDefault(); setIsPlaying(v => !v); }
      if (e.key === 'ArrowRight') { goNext(); }
      if (e.key === 'ArrowLeft') { goPrev(); }
      if (e.key === 'Escape') { setPhase('setup'); setIsPlaying(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, goNext, goPrev]);

  const startReading = () => {
    const result = splitText(rawText, splitMode, charsPerPage);
    if (!result.length) return;
    setChunks(result);
    setIdx(0);
    setIsPlaying(false);
    setPhase('reading');
  };

  const totalPages = chunks.length;
  const pagesProgress = totalPages > 0 ? (idx + 1) / totalPages : 0;

  return (
    <div className={`pc-root ${dark ? 'dark' : 'light'}`}>
      <header className="pc-header">
        <div className="pc-logo-icon">⚡</div>
        <h1><span className="accent">Pacer</span></h1>
      </header>

      {phase === 'setup' && (
        <div className="pc-setup">
          <textarea
            className="pc-textarea"
            placeholder="ここにテキストを貼り付けてください…&#10;&#10;本・仕様書・記事など、何でも対応します。"
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            aria-label="読み込むテキスト"
          />

          <div className="pc-config">
            <div className="pc-config-group">
              <span className="pc-config-label">分割</span>
              <select className="pc-select" value={splitMode} onChange={e => setSplitMode(e.target.value as SplitMode)}>
                <option value="paragraph">段落（空行）</option>
                <option value="line">行</option>
                <option value="chars">N文字</option>
              </select>
              {splitMode === 'chars' && (
                <input
                  type="number"
                  className="pc-number"
                  value={charsPerPage}
                  min={50}
                  max={2000}
                  onChange={e => setCharsPerPage(Number(e.target.value))}
                  aria-label="1ページの文字数"
                />
              )}
            </div>
            <div className="pc-divider" />
            <div className="pc-config-group">
              <span className="pc-config-label">秒/ページ</span>
              <input
                type="number"
                className="pc-number"
                value={secsPerPage}
                min={1}
                max={60}
                onChange={e => setSecsPerPage(Number(e.target.value))}
                aria-label="1ページあたりの秒数"
              />
            </div>
          </div>

          <button className="pc-start-btn" onClick={startReading} disabled={!rawText.trim()}>
            読み始める →
          </button>
        </div>
      )}

      {phase === 'reading' && (
        <div className="pc-reading">
          {/* Overall progress */}
          <div className="pc-progress-bar-outer" role="progressbar" aria-valuenow={idx + 1} aria-valuemax={totalPages}>
            <div className="pc-progress-bar-inner" style={{ width: `${pagesProgress * 100}%` }} />
          </div>
          <div className="pc-page-counter">{idx + 1} / {totalPages}</div>

          {/* Content */}
          <div className="pc-content">
            <p className="pc-content-text">{chunks[idx]}</p>
          </div>

          {/* Countdown bar */}
          <div className="pc-countdown-outer">
            <div className="pc-countdown-inner" style={{ width: `${countdown * 100}%` }} />
          </div>

          {/* Controls */}
          <div className="pc-controls">
            <button className="pc-btn pc-btn-back" onClick={() => { setPhase('setup'); setIsPlaying(false); }}>
              ← 設定に戻る
            </button>
            <button className="pc-btn pc-btn-ghost" onClick={goPrev} disabled={idx === 0} aria-label="前のページ">
              ←
            </button>
            <button className="pc-btn pc-btn-play" onClick={() => setIsPlaying(v => !v)} aria-label={isPlaying ? '一時停止' : '再生'}>
              {isPlaying ? '⏸ 一時停止' : '▶ 再生'}
            </button>
            <button className="pc-btn pc-btn-ghost" onClick={goNext} disabled={idx === chunks.length - 1} aria-label="次のページ">
              →
            </button>
          </div>

          <p className="pc-shortcut-hint">Space: 再生/停止 ← →: 移動 Esc: 設定へ</p>
        </div>
      )}
    </div>
  );
};

export default Pacer;
import { useState, useEffect } from 'react';
import { Salad, Download } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import './Meal.css';

const SK_MEAL    = 'meal-meal';
const SK_ADVICE  = 'meal-advice';
const SK_PROFILE = 'meal-profile';

type Profile = {
  gender: '男性' | '女性';
  birthYear: number;
  birthMonth: number;
  height: number;
  weight: number;
};

const DEFAULT_PROFILE: Profile = {
  gender: '男性',
  birthYear: 1994,
  birthMonth: 2,
  height: 177,
  weight: 70,
};

const loadStr = (key: string): string => {
  try { return localStorage.getItem(key) ?? ''; } catch { return ''; }
};
const loadProfile = (): Profile => {
  try {
    const raw = localStorage.getItem(SK_PROFILE);
    return raw ? { ...DEFAULT_PROFILE, ...JSON.parse(raw) } : DEFAULT_PROFILE;
  } catch { return DEFAULT_PROFILE; }
};

const calcAge = (birthYear: number, birthMonth: number): number => {
  const now = new Date();
  const age = now.getFullYear() - birthYear;
  return now.getMonth() + 1 >= birthMonth ? age : age - 1;
};

// ── ASCII art helpers ─────────────────────────────────────
const W = 56;

const cw = (c: string): number => {
  const code = c.codePointAt(0) ?? 0;
  if (
    (code >= 0x1100 && code <= 0x115F) ||
    (code >= 0x2E80 && code <= 0x303E) ||
    (code >= 0x3040 && code <= 0xA4CF) ||
    (code >= 0xAC00 && code <= 0xD7AF) ||
    (code >= 0xF900 && code <= 0xFAFF) ||
    (code >= 0xFE10 && code <= 0xFE1F) ||
    (code >= 0xFE30 && code <= 0xFE4F) ||
    (code >= 0xFF00 && code <= 0xFF60) ||
    (code >= 0xFFE0 && code <= 0xFFE6)
  ) return 2;
  return 1;
};

const sw = (s: string): number => [...s].reduce((acc, c) => acc + cw(c), 0);
const pad = (s: string, width: number): string => s + ' '.repeat(Math.max(0, width - sw(s)));

const wrapText = (text: string, width: number): string[] =>
  text.split('\n').flatMap(raw => {
    if (raw === '') return [''];
    const lines: string[] = [];
    let cur = '', curW = 0;
    for (const ch of raw) {
      const w = cw(ch);
      if (curW + w > width) { lines.push(cur); cur = ch; curW = w; }
      else { cur += ch; curW += w; }
    }
    lines.push(cur);
    return lines;
  });

const row   = (s = '') => `║ ${pad(s, W)} ║`;
const sep   = (t: 'top' | 'mid' | 'bot') => {
  const [l, r] = t === 'top' ? ['╔', '╗'] : t === 'mid' ? ['╠', '╣'] : ['╚', '╝'];
  return `${l}${'═'.repeat(W + 2)}${r}`;
};
const hdiv  = (label: string) => row(`${label} ${'─'.repeat(W - sw(label) - 1)}`);
const blank = row();

const buildAscii = (meal: string, advice: string, profile: Profile): string => {
  const age  = calcAge(profile.birthYear, profile.birthMonth);
  const date = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  });
  const profileLine = `${profile.gender} ${age}歳 ${profile.height}cm ${profile.weight}kg`;
  return [
    sep('top'),
    row(`MEAL LOG  ·  ${date}`),
    row(profileLine),
    sep('mid'),
    blank,
    hdiv('食事'),
    blank,
    ...wrapText(meal.trim(), W).map(row),
    blank,
    sep('mid'),
    blank,
    hdiv('アドバイス'),
    blank,
    ...wrapText(advice.trim(), W).map(row),
    blank,
    sep('bot'),
  ].join('\n');
};

// ── Prompt ───────────────────────────────────────────────
const buildPrompt = (meal: string, profile: Profile): string => {
  const age = calcAge(profile.birthYear, profile.birthMonth);
  return `以下のプロフィールと食事内容を元に、ダイエットと健康の観点からアドバイスをください。

【プロフィール】
性別：${profile.gender}
年齢：${age}歳
身長：${profile.height}cm
体重：${profile.weight}kg

【今日の食事】
${meal.trim()}

---
以下のフォーマットで厳密に回答してください。見出しの文言・順番・記号は変えないでください。

## 推定栄養素
総カロリー：〇〇 kcal
タンパク質：〇〇 g（〇〇%）
脂質　　　：〇〇 g（〇〇%）
炭水化物　：〇〇 g（〇〇%）

## 1日推奨摂取量との比較
カロリー　：推奨〇〇kcal に対して〇〇%（過不足 〇〇kcal）
タンパク質：推奨〇〇g に対して〇〇%
脂質　　　：推奨〇〇g に対して〇〇%
炭水化物　：推奨〇〇g に対して〇〇%

## 評価
良い点：〇〇
課題点：〇〇

## 改善アドバイス
・〇〇
・〇〇

## 明日以降のおすすめ
・〇〇
・〇〇`;
};

// ── Component ────────────────────────────────────────────
const Meal = () => {
  const { dark } = useTheme();
  const [meal,    setMeal]    = useState(() => loadStr(SK_MEAL));
  const [advice,  setAdvice]  = useState(() => loadStr(SK_ADVICE));
  const [profile, setProfile] = useState<Profile>(loadProfile);
  const [copied,  setCopied]  = useState(false);

  useEffect(() => { localStorage.setItem(SK_MEAL,    meal);               }, [meal]);
  useEffect(() => { localStorage.setItem(SK_ADVICE,  advice);             }, [advice]);
  useEffect(() => { localStorage.setItem(SK_PROFILE, JSON.stringify(profile)); }, [profile]);

  const setP = <K extends keyof Profile>(key: K, val: Profile[K]) =>
    setProfile(prev => ({ ...prev, [key]: val }));

  const canCopy     = meal.trim().length > 0;
  const canDownload = meal.trim().length > 0 && advice.trim().length > 0;

  const handleCopy = async () => {
    if (!canCopy) return;
    try {
      await navigator.clipboard.writeText(buildPrompt(meal, profile));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  const handleDownload = () => {
    if (!canDownload) return;
    const content = buildAscii(meal, advice, profile);
    const date    = new Date().toISOString().slice(0, 10);
    const blob    = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url     = URL.createObjectURL(blob);
    const a       = document.createElement('a');
    a.href = url; a.download = `meal-${date}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const age = calcAge(profile.birthYear, profile.birthMonth);

  return (
    <div className={`ml-root ${dark ? 'dark' : 'light'}`}>
      <div className="ml-header">
        <div className="ml-logo"><Salad size={20} color="white" /></div>
        <h1><span className="ml-accent">Meal</span></h1>
        <button className="ml-btn ml-btn--copy" onClick={handleCopy} disabled={!canCopy}>
          {copied ? 'コピーしました！' : 'プロンプトをコピー'}
        </button>
        <button className="ml-btn ml-btn--dl" onClick={handleDownload} disabled={!canDownload}>
          <Download size={13} />ダウンロード
        </button>
      </div>

      <div className="ml-body">
        {/* Profile */}
        <div className="ml-profile">
          <select
            className="ml-profile-select"
            value={profile.gender}
            onChange={e => setP('gender', e.target.value as Profile['gender'])}
          >
            <option value="男性">男性</option>
            <option value="女性">女性</option>
          </select>
          <div className="ml-profile-field">
            <label className="ml-profile-label">生年</label>
            <input
              type="number" className="ml-profile-num ml-profile-num--year"
              value={profile.birthYear}
              onChange={e => setP('birthYear', Number(e.target.value))}
              min={1900} max={2020}
            />
            <span className="ml-profile-unit">年</span>
            <input
              type="number" className="ml-profile-num ml-profile-num--month"
              value={profile.birthMonth}
              onChange={e => setP('birthMonth', Number(e.target.value))}
              min={1} max={12}
            />
            <span className="ml-profile-unit">月</span>
          </div>
          <span className="ml-profile-age">{age}歳</span>
          <div className="ml-profile-field">
            <label className="ml-profile-label">身長</label>
            <input
              type="number" className="ml-profile-num ml-profile-num--body"
              value={profile.height}
              onChange={e => setP('height', Number(e.target.value))}
              min={100} max={250}
            />
            <span className="ml-profile-unit">cm</span>
          </div>
          <div className="ml-profile-field">
            <label className="ml-profile-label">体重</label>
            <input
              type="number" className="ml-profile-num ml-profile-num--body"
              value={profile.weight}
              onChange={e => setP('weight', Number(e.target.value))}
              min={20} max={300}
            />
            <span className="ml-profile-unit">kg</span>
          </div>
        </div>

        {/* Meal input */}
        <div className="ml-field">
          <div className="ml-field-header">
            <span className="ml-field-label">食べたもの</span>
            {meal && (
              <button className="ml-reset-btn" onClick={() => setMeal('')}>リセット</button>
            )}
          </div>
          <textarea
            className="ml-textarea"
            placeholder={"例：\n朝：トースト、コーヒー\n昼：ラーメン\n夜：焼き肉、ビール2杯"}
            value={meal}
            onChange={e => setMeal(e.target.value)}
            rows={7}
          />
        </div>

        {/* Advice input */}
        <div className="ml-field">
          <div className="ml-field-header">
            <span className="ml-field-label">アドバイス（LLMから貼り付け）</span>
            {advice && (
              <button className="ml-reset-btn" onClick={() => setAdvice('')}>リセット</button>
            )}
          </div>
          <textarea
            className="ml-textarea"
            placeholder="プロンプトをコピーしてLLMに渡し、返ってきたアドバイスをここに貼り付けてください"
            value={advice}
            onChange={e => setAdvice(e.target.value)}
            rows={12}
          />
        </div>
      </div>
    </div>
  );
};

export default Meal;

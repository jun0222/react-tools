import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { cycleElapsedSec, beepCount, fmtSeconds } from './intervalbellCore';
import './Intervalbell.css';

const SK_INTERVAL = 'intervalbell-interval';

const load = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
};

const playBeep = () => {
  try {
    type WebkitWindow = typeof window & { webkitAudioContext?: typeof AudioContext };
    const Ctx = window.AudioContext || (window as WebkitWindow).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
    osc.onended = () => ctx.close();
  } catch { /* AudioContext unavailable */ }
};

const Intervalbell = () => {
  const { dark } = useTheme();
  const [intervalSec, setIntervalSec] = useState<number>(() => load(SK_INTERVAL, 30));
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [beeps, setBeeps] = useState(0);
  const [flash, setFlash] = useState(false);

  const startTimeRef = useRef(0);
  const lastBeepRef = useRef(0);
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      const now = Date.now() - startTimeRef.current;
      setElapsedMs(now);
      const bc = beepCount(now, intervalSec);
      if (bc > lastBeepRef.current) {
        lastBeepRef.current = bc;
        setBeeps(bc);
        playBeep();
        setFlash(true);
        setTimeout(() => setFlash(false), 200);
      }
    }, 100);
    return () => clearInterval(timer);
  }, [running, intervalSec]);

  const handleStart = async () => {
    startTimeRef.current = Date.now();
    lastBeepRef.current = 0;
    setElapsedMs(0);
    setBeeps(0);
    setRunning(true);
    try {
      type WakeLockNavigator = Navigator & {
        wakeLock?: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> };
      };
      wakeLockRef.current = (await (navigator as WakeLockNavigator).wakeLock?.request('screen')) ?? null;
    } catch { /* unsupported or denied */ }
  };

  const handleStop = () => {
    setRunning(false);
    wakeLockRef.current?.release().catch(() => { /* ignore */ });
    wakeLockRef.current = null;
  };

  const handleIntervalChange = (v: number) => {
    setIntervalSec(v);
    localStorage.setItem(SK_INTERVAL, JSON.stringify(v));
  };

  const cycleSec = cycleElapsedSec(elapsedMs, intervalSec);

  return (
    <div className={`ib-root ${dark ? 'dark' : 'light'} ${flash ? 'ib-flash' : ''}`}>
      <div className="ib-header">
        <div className="ib-logo"><Bell size={20} color="white" /></div>
        <h1><span className="ib-accent">Intervalbell</span></h1>
      </div>

      <div className="ib-body">
        <label className="ib-interval-label" htmlFor="ib-interval-input">
          間隔（秒）
          <input
            id="ib-interval-input"
            type="number"
            className="ib-interval-input"
            min={1}
            value={intervalSec}
            disabled={running}
            onChange={e => handleIntervalChange(Number(e.target.value))}
          />
        </label>

        <div className="ib-display">
          <div className="ib-cycle-time">{fmtSeconds(cycleSec)}</div>
          <div className="ib-beep-count">🔔 {beeps}回</div>
        </div>

        <div className="ib-controls">
          {!running ? (
            <button className="ib-start-btn" onClick={handleStart}>開始</button>
          ) : (
            <button className="ib-stop-btn" onClick={handleStop}>停止</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Intervalbell;
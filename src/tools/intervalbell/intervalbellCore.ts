export const cycleElapsedSec = (elapsedMs: number, intervalSec: number): number => {
  const totalSec = Math.floor(elapsedMs / 1000);
  return totalSec % intervalSec;
};

export const beepCount = (elapsedMs: number, intervalSec: number): number => {
  const totalSec = Math.floor(elapsedMs / 1000);
  return Math.floor(totalSec / intervalSec);
};

export const fmtSeconds = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};
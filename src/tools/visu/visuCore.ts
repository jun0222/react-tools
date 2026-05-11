// ---- CSV parsing ----

export interface CsvData {
  headers: string[];
  rows: string[][];
}

export const parseCsv = (text: string): CsvData => {
  if (!text.trim()) return { headers: [], rows: [] };

  const lines = text.trim().split('\n').filter(l => l.trim());
  if (!lines.length) return { headers: [], rows: [] };

  const splitRow = (line: string): string[] =>
    line.split(',').map(cell => cell.trim());

  const headers = splitRow(lines[0]);
  const rows = lines.slice(1).map(splitRow);
  return { headers, rows };
};

// ---- Matrix (comparison table) ----

export interface MatrixCell {
  row: string;
  col: string;
  value: string;
}

export interface MatrixData {
  rowLabels: string[];
  colLabels: string[];
  cells: Record<string, Record<string, string>>;
}

export const emptyMatrix = (): MatrixData => ({
  rowLabels: ['', '', ''],
  colLabels: ['', '', ''],
  cells: {},
});

export const getCell = (m: MatrixData, row: string, col: string): string =>
  m.cells[row]?.[col] ?? '';

export const setCell = (
  m: MatrixData,
  row: string,
  col: string,
  value: string,
): MatrixData => ({
  ...m,
  cells: {
    ...m.cells,
    [row]: { ...(m.cells[row] ?? {}), [col]: value },
  },
});

// ---- Number parsing ----

export const parseNumber = (s: string): number | null => {
  if (!s.trim()) return null;
  const n = Number(s.replace(/,/g, ''));
  return isNaN(n) ? null : n;
};

// ---- Bar chart data ----

export interface BarEntry {
  label: string;
  value: number;
}

export const extractBarData = (csv: CsvData, labelCol = 0, valueCol = 1): BarEntry[] => {
  if (!csv.rows.length) return [];
  return csv.rows
    .map(row => {
      const label = row[labelCol] ?? '';
      const value = parseNumber(row[valueCol] ?? '');
      return value !== null ? { label, value } : null;
    })
    .filter((e): e is BarEntry => e !== null);
};

// ---- Bar chart SVG ----

export const generateBarSVG = (
  entries: BarEntry[],
  dark: boolean,
  maxWidth = 500,
  barHeight = 28,
): string => {
  if (!entries.length) return '';

  const maxVal = Math.max(...entries.map(e => e.value));
  if (maxVal <= 0) return '';

  const labelW = 120;
  const valueW = 50;
  const barAreaW = maxWidth - labelW - valueW - 20;
  const gap = 8;
  const height = entries.length * (barHeight + gap) + 20;

  const bg = dark ? '#1a1a24' : '#f8f8fc';
  const textColor = dark ? '#e0e0e0' : '#1a1a2e';
  const barColor = dark ? '#6366f1' : '#6366f1';
  const dimColor = dark ? '#666' : '#888';

  const bars = entries.map((e, i) => {
    const y = 10 + i * (barHeight + gap);
    const barW = Math.round((e.value / maxVal) * barAreaW);
    return `<g>
  <text x="${labelW - 6}" y="${y + barHeight / 2}" text-anchor="end" dominant-baseline="middle" fill="${textColor}" font-size="11" font-family="system-ui,sans-serif">${e.label.length > 14 ? e.label.slice(0, 13) + '…' : e.label}</text>
  <rect x="${labelW}" y="${y}" width="${barW}" height="${barHeight}" rx="3" fill="${barColor}" opacity="0.85"/>
  <text x="${labelW + barW + 5}" y="${y + barHeight / 2}" dominant-baseline="middle" fill="${dimColor}" font-size="10" font-family="system-ui,sans-serif">${e.value}</text>
</g>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${maxWidth}" height="${height}" style="background:${bg};display:block">
${bars.join('\n')}
</svg>`;
};
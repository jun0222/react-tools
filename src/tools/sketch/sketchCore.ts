export type DiagramType = 'flow' | 'state' | 'graph';

export interface Snippet {
  label: string;
  code: string;
  desc: string;
}

export interface DiagramConfig {
  id: DiagramType;
  name: string;
  defaultCode: string;
  snippets: Snippet[];
}

// ============================================================
// Simple Notation Parser
//
// Syntax:
//   A → B          solid right arrow
//   A ← B          solid left arrow (B→A)
//   A ↔ B          bidirectional
//   A --- B         undirected line
//   A --> B         dashed right
//   A →[ラベル] B   labeled arrow
//   {ひし形}        diamond node
//   (丸角)          rounded node
//   ((円))          circle node
//   [(DB)]          cylinder node
//   group 名前:     subgraph start
//   end             subgraph end
//   # コメント      ignored
// ============================================================

type NodeShape = 'rect' | 'diamond' | 'round' | 'circle' | 'db';
type ArrowDir  = 'right' | 'left' | 'both' | 'undirected';

interface NodeInfo { label: string; shape: NodeShape }
interface ArrowInfo { dir: ArrowDir; dashed: boolean; label?: string }
interface Conn { from: NodeInfo; to: NodeInfo; arrow: ArrowInfo }

const parseNodeText = (raw: string): NodeInfo => {
  const t = raw.trim();
  if (t.startsWith('((') && t.endsWith('))')) return { label: t.slice(2, -2).trim(), shape: 'circle' };
  if (t.startsWith('[(') && t.endsWith(')]')) return { label: t.slice(2, -2).trim(), shape: 'db' };
  if (t.startsWith('{') && t.endsWith('}'))   return { label: t.slice(1, -1).trim(), shape: 'diamond' };
  if (t.startsWith('(') && t.endsWith(')'))   return { label: t.slice(1, -1).trim(), shape: 'round' };
  if (t.startsWith('[') && t.endsWith(']'))   return { label: t.slice(1, -1).trim(), shape: 'rect' };
  return { label: t, shape: 'rect' };
};

const parseArrowStr = (s: string): { dir: ArrowDir; dashed: boolean } => {
  if (s === '↔' || s === '<->')  return { dir: 'both',       dashed: false };
  if (s === '←' || s === '<-')   return { dir: 'left',       dashed: false };
  if (s === '<--')                return { dir: 'left',       dashed: true  };
  if (s === '→' || s === '->')   return { dir: 'right',      dashed: false };
  if (s === '-->')                return { dir: 'right',      dashed: true  };
  return                                 { dir: 'undirected', dashed: false };
};

// Arrow pattern: longest alternatives first to avoid partial matches
const ARROW_SRC = '(↔|<->|←|<--|<-|→|-->|->|---|--)';
const ARROW_WITH_LABEL_SRC = ARROW_SRC + '(\\[([^\\]]*)\\])?';

export const lineToConns = (line: string): { conns: Conn[]; hasArrow: boolean } => {
  const re = new RegExp(ARROW_WITH_LABEL_SRC, 'g');
  const parts: Array<{ kind: 'node' | 'arrow'; text: string; arrowInfo?: ArrowInfo }> = [];
  let lastIdx = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(line)) !== null) {
    const before = line.slice(lastIdx, m.index).trim();
    if (before) parts.push({ kind: 'node', text: before });
    parts.push({
      kind: 'arrow',
      text: m[0],
      arrowInfo: { ...parseArrowStr(m[1]), label: m[3] },
    });
    lastIdx = m.index + m[0].length;
  }
  const after = line.slice(lastIdx).trim();
  if (after) parts.push({ kind: 'node', text: after });

  const hasArrow = parts.some(p => p.kind === 'arrow');
  const conns: Conn[] = [];

  for (let i = 0; i + 2 < parts.length; i += 2) {
    const Lp = parts[i];
    const Ap = parts[i + 1];
    const Rp = parts[i + 2];
    if (Lp?.kind !== 'node' || Ap?.kind !== 'arrow' || Rp?.kind !== 'node') continue;

    const L = parseNodeText(Lp.text);
    const R = parseNodeText(Rp.text);
    const arrow = Ap.arrowInfo!;

    if (arrow.dir === 'right' || arrow.dir === 'undirected') {
      conns.push({ from: L, to: R, arrow });
    } else if (arrow.dir === 'left') {
      conns.push({ from: R, to: L, arrow: { ...arrow, dir: 'right' } });
    } else {
      conns.push({ from: L, to: R, arrow: { ...arrow, dir: 'right' } });
      conns.push({ from: R, to: L, arrow: { ...arrow, dir: 'right' } });
    }
  }

  return { conns, hasArrow };
};

// ---- Mermaid generation helpers ----

const mId = (label: string, map: Map<string, string>): string => {
  if (!map.has(label)) map.set(label, `n${map.size}`);
  return map.get(label)!;
};

const mNodeDecl = (info: NodeInfo, id: string): string => {
  const lbl = `"${info.label.replace(/"/g, '#quot;')}"`;
  switch (info.shape) {
    case 'diamond': return `${id}{${lbl}}`;
    case 'round':   return `${id}(${lbl})`;
    case 'circle':  return `${id}((${lbl}))`;
    case 'db':      return `${id}[(${lbl})]`;
    default:        return `${id}[${lbl}]`;
  }
};

const mFlowEdge = (conn: Conn, nodeMap: Map<string, string>): string => {
  const fId = mId(conn.from.label, nodeMap);
  const tId = mId(conn.to.label,   nodeMap);
  const fD  = mNodeDecl(conn.from, fId);
  const tD  = mNodeDecl(conn.to,   tId);
  const lbl = conn.arrow.label;

  let arrow: string;
  if (conn.arrow.dir === 'undirected') {
    arrow = lbl ? `---|${lbl}|` : '---';
  } else if (conn.arrow.dashed) {
    arrow = lbl ? `-.->|${lbl}|` : '-.->';
  } else {
    arrow = lbl ? `-->|${lbl}|` : '-->';
  }
  return `  ${fD} ${arrow} ${tD}`;
};

const mStateEdge = (conn: Conn): string => {
  const from = conn.from.label === '*' ? '[*]' : conn.from.label;
  const to   = conn.to.label   === '*' ? '[*]' : conn.to.label;
  const lbl  = conn.arrow.label;
  return `  ${from} --> ${to}${lbl ? ` : ${lbl}` : ''}`;
};

// ---- Public: convert simple notation → Mermaid ----

export const parseSimpleNotation = (input: string, mode: DiagramType): string => {
  const mainConns: Conn[] = [];
  const standalones: NodeInfo[] = [];
  const groups: Array<{ name: string; conns: Conn[] }> = [];
  let curGroup: { name: string; conns: Conn[] } | null = null;

  for (const rawLine of input.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith('//')) continue;
    if (line === 'end') { curGroup = null; continue; }

    const gm = line.match(/^group\s+(.+?):\s*$/);
    if (gm) {
      curGroup = { name: gm[1].trim(), conns: [] };
      groups.push(curGroup);
      continue;
    }

    const { conns, hasArrow } = lineToConns(line);
    if (curGroup) {
      curGroup.conns.push(...conns);
    } else if (conns.length > 0) {
      mainConns.push(...conns);
    } else if (!hasArrow) {
      const node = parseNodeText(line);
      if (node.label) standalones.push(node);
    }
  }

  if (mode === 'state') {
    const out = ['stateDiagram-v2'];
    for (const c of mainConns) out.push(mStateEdge(c));
    for (const g of groups) {
      out.push(`  state ${g.name} {`);
      for (const c of g.conns) out.push('  ' + mStateEdge(c));
      out.push('  }');
    }
    return out.join('\n');
  }

  const header   = mode === 'graph' ? 'graph LR' : 'flowchart TD';
  const nodeMap  = new Map<string, string>();
  const out      = [header];

  for (const c of mainConns) out.push(mFlowEdge(c, nodeMap));
  for (const node of standalones) {
    if (!nodeMap.has(node.label)) {
      out.push(`  ${mNodeDecl(node, mId(node.label, nodeMap))}`);
    }
  }
  for (const g of groups) {
    out.push(`  subgraph ${g.name}`);
    for (const c of g.conns) out.push(mFlowEdge(c, nodeMap));
    out.push('  end');
  }

  return out.join('\n');
};

// ---- Defaults (simple notation) ----

export const FLOW_DEFAULT = `開始 → {判断}
{判断} →[はい] 処理A
{判断} →[いいえ] 処理B
処理A → 終了
処理B → 終了`;

export const STATE_DEFAULT = `* → 待機
待機 →[開始] 実行中
実行中 →[完了] 待機
実行中 →[失敗] エラー
エラー →[リセット] 待機
実行中 →[終了] *`;

export const GRAPH_DEFAULT = `モジュールA → モジュールB
モジュールA → モジュールC
モジュールB → 出力
モジュールC → 出力`;

export const DIAGRAM_CONFIGS: Record<DiagramType, DiagramConfig> = {
  flow: {
    id: 'flow',
    name: 'フロー',
    defaultCode: FLOW_DEFAULT,
    snippets: [
      { label: '→ 矢印',   code: 'P → Q',                                                         desc: '基本の矢印' },
      { label: '← 逆向き', code: 'Q ← P',                                                         desc: '逆向きの矢印' },
      { label: '条件分岐', code: '{条件} →[はい] 処理A\n{条件} →[いいえ] 処理B',                   desc: 'yes/no分岐' },
      { label: 'ループ',   code: 'group ループ:\n  処理 → {続行?}\n  {続行?} →[はい] 処理\n  {続行?} →[いいえ] 完了\nend', desc: '繰り返し' },
      { label: '破線',     code: 'A --> B',                                                         desc: '破線の矢印' },
      { label: '↔ 双方向', code: 'A ↔ B',                                                          desc: '双方向の矢印' },
    ],
  },
  state: {
    id: 'state',
    name: 'ステート',
    defaultCode: STATE_DEFAULT,
    snippets: [
      { label: '遷移',    code: '状態A →[イベント] 状態B', desc: '状態遷移' },
      { label: '開始',    code: '* → 初期状態',            desc: '初期状態' },
      { label: '終了',    code: '最終状態 →[終了] *',      desc: '終了状態' },
      { label: '双方向',  code: '状態A ↔ 状態B',           desc: '双方向遷移' },
    ],
  },
  graph: {
    id: 'graph',
    name: 'グラフ',
    defaultCode: GRAPH_DEFAULT,
    snippets: [
      { label: '→ 依存',   code: 'A → B',                     desc: '依存・方向あり' },
      { label: '--- 関連', code: 'A --- B',                    desc: '無向の関係' },
      { label: 'ラベル',   code: 'A →[説明] B',                desc: 'ラベル付き矢印' },
      { label: 'グループ', code: 'group グループ:\n  A → B\nend', desc: 'グルーピング' },
      { label: 'ノード形', code: '{ひし形}\n(丸角)\n((円))',    desc: 'ノード形状サンプル' },
    ],
  },
};

export const generateFilename = (ext: 'svg' | 'png'): string => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `sketch-${d.getFullYear()}_${pad(d.getMonth() + 1)}_${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}.${ext}`;
};

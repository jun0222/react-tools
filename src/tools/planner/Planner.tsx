import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import mermaid from 'mermaid';
import { LayoutDashboard } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { parseFlowDSL, renderFlowSVG } from '../flowchart/flowchartCore';
import './Planner.css';

const SK_NOTES  = 'planner-notes';
const SK_OUTPUT = 'planner-output';

type PlanTab = 'logic' | 'flow' | 'gantt';

const TODAY = new Date().toISOString().slice(0, 10);

const buildPrompt = (notes: string): string =>
  `以下の雑なメモ・TODOリストを整理して、3つのセクションを出力してください。

今日の日付: ${TODAY}

【入力メモ】
${notes.trim()}

---
以下の形式で3つのセクションを出力してください（セクション名は必ず ## LOGIC, ## FLOW, ## GANTT にしてください）。

## LOGIC
（インデントベースのロジックツリー。目標・フェーズ・タスクを階層化。インデントはスペース2つ）
例:
プロジェクト目標
  フェーズ1
    タスクA
    タスクB
  フェーズ2
    タスクC

## FLOW
（以下DSLでフロー図を記述。接続は "A -> B" または "A -> B : ラベル"。色指定は NodeName [色] で。色: blue/green/red/orange）
例:
START [green]
完了 [green]
開始 -> タスクA
タスクA -> タスクB
タスクB -> 完了

## GANTT
（mermaid ganttチャート。今日(${TODAY})を基準に現実的なスケジュールを組む）
例:
gantt
    title プロジェクト計画
    dateFormat YYYY-MM-DD
    section フェーズ1
        タスクA :${TODAY}, 3d
        タスクB :2026-06-12, 5d`;

const parseOutput = (text: string): { logic: string; flow: string; gantt: string } => {
  const sect = (name: string) => {
    const m = text.match(new RegExp(`##\\s*${name}\\s*\\n([\\s\\S]*?)(?=##|$)`, 'i'));
    return m?.[1]?.trim() ?? '';
  };
  return { logic: sect('LOGIC'), flow: sect('FLOW'), gantt: sect('GANTT') };
};

// Simple indent-tree → SVG (same approach as LogTree)
const renderLogicSVG = (text: string, dark: boolean): string => {
  if (!text.trim()) return '';
  const lines = text.split('\n').filter(l => l.trim());
  const NODE_W = 160, NODE_H = 34, H_GAP = 40, V_GAP = 14;

  interface TNode { label: string; depth: number; children: TNode[]; x: number; y: number; w: number; }

  const getDepth = (line: string) => {
    const m = line.match(/^(\s*)/);
    return Math.floor((m?.[1].length ?? 0) / 2);
  };

  const root: TNode = { label: '__root__', depth: -1, children: [], x: 0, y: 0, w: NODE_W };
  const stack: TNode[] = [root];

  for (const line of lines) {
    const depth = getDepth(line);
    const label = line.trim();
    const node: TNode = { label, depth, children: [], x: 0, y: 0, w: NODE_W };
    while (stack.length > 1 && stack[stack.length - 1].depth >= depth) stack.pop();
    stack[stack.length - 1].children.push(node);
    stack.push(node);
  }

  // Assign positions (BFS left-to-right)
  const allNodes: TNode[] = [];
  const queue: Array<{ node: TNode; col: number; row: number }> = [];
  let maxRow = 0;
  const colCounts = new Map<number, number>();

  const traverse = (node: TNode, col: number, row: number) => {
    if (node.label !== '__root__') {
      const rowCount = colCounts.get(col) ?? 0;
      node.x = col * (NODE_W + H_GAP);
      node.y = rowCount * (NODE_H + V_GAP);
      colCounts.set(col, rowCount + 1);
      maxRow = Math.max(maxRow, node.y);
      allNodes.push(node);
    }
    for (const child of node.children) {
      traverse(child, col + 1, row);
    }
  };

  let r = 0;
  for (const child of root.children) traverse(child, 0, r++);

  if (allNodes.length === 0) return '';

  const maxX = Math.max(...allNodes.map(n => n.x)) + NODE_W;
  const maxY = Math.max(...allNodes.map(n => n.y)) + NODE_H;
  const W = maxX + 24, H = maxY + 24;

  const bg  = dark ? '#0d0d14' : '#f4f6fa';
  const fg  = dark ? '#e0e0e0' : '#1a1a2e';
  const suf = dark ? '#374151' : '#e5e7eb';
  const acc = '#6366f1';
  const edgec = dark ? '#555' : '#aaa';

  const svgLines = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`,
    `<rect width="${W}" height="${H}" fill="${bg}" rx="8"/>`,
  ];

  // Draw edges (parent center-right → child center-left)
  const drawEdges = (node: TNode) => {
    for (const child of node.children) {
      if (node.label !== '__root__') {
        const x1 = node.x + NODE_W + 12;
        const y1 = node.y + NODE_H / 2;
        const x2 = child.x - 12;
        const y2 = child.y + NODE_H / 2;
        svgLines.push(`<path d="M ${x1} ${y1} C ${(x1+x2)/2} ${y1} ${(x1+x2)/2} ${y2} ${x2} ${y2}" fill="none" stroke="${edgec}" stroke-width="1.5"/>`);
      }
      drawEdges(child);
    }
  };
  drawEdges(root);

  // Draw nodes
  for (const n of allNodes) {
    const isLeaf = n.children.length === 0;
    const fill = isLeaf ? suf : acc;
    const text = isLeaf ? fg : '#fff';
    const label = n.label.length > 14 ? n.label.slice(0, 13) + '…' : n.label;
    svgLines.push(`<rect x="${n.x}" y="${n.y}" width="${NODE_W}" height="${NODE_H}" rx="7" fill="${fill}"/>`);
    svgLines.push(`<text x="${n.x + NODE_W/2}" y="${n.y + NODE_H/2 + 5}" text-anchor="middle" font-size="12" font-weight="600" fill="${text}" font-family="sans-serif">${label}</text>`);
  }

  svgLines.push('</svg>');
  return svgLines.join('\n');
};

let mermaidSeq = 0;

const Planner = () => {
  const { dark } = useTheme();
  const [notes,  setNotes]  = useState(() => localStorage.getItem(SK_NOTES)  ?? '');
  const [output, setOutput] = useState(() => localStorage.getItem(SK_OUTPUT) ?? '');
  const [tab, setTab] = useState<PlanTab>('logic');
  const [toast, setToast] = useState('');
  const [ganttHasSvg, setGanttHasSvg] = useState(false);
  const ganttRef  = useRef<HTMLDivElement>(null);
  const ganttSvg  = useRef('');
  const logicRef  = useRef<HTMLDivElement>(null);
  const flowRef   = useRef<HTMLDivElement>(null);

  useEffect(() => { localStorage.setItem(SK_NOTES,  notes);  }, [notes]);
  useEffect(() => { localStorage.setItem(SK_OUTPUT, output); }, [output]);

  const showToast = useCallback((msg: string) => {
    setToast(msg); setTimeout(() => setToast(''), 1800);
  }, []);

  const { logic, flow, gantt } = useMemo(() => parseOutput(output), [output]);

  const logicSvg = useMemo(() => renderLogicSVG(logic, dark), [logic, dark]);
  const flowParsed = useMemo(() => parseFlowDSL(flow), [flow]);
  const flowSvg  = useMemo(() => renderFlowSVG(flowParsed, dark), [flowParsed, dark]);

  // Render gantt via mermaid
  useEffect(() => {
    if (!ganttRef.current || tab !== 'gantt') return;
    if (!gantt.trim()) { ganttRef.current.innerHTML = ''; setGanttHasSvg(false); return; }
    const id = `pl-gantt-${++mermaidSeq}`;
    mermaid.initialize({ startOnLoad: false, theme: dark ? 'dark' : 'default' });
    mermaid.render(id, gantt)
      .then(({ svg }) => {
        if (ganttRef.current) { ganttRef.current.innerHTML = svg; ganttSvg.current = svg; setGanttHasSvg(true); }
      })
      .catch(() => {
        if (ganttRef.current) { ganttRef.current.innerHTML = '<span style="color:#f87171;font-size:12px">Gantt syntax error</span>'; setGanttHasSvg(false); }
      });
  }, [gantt, dark, tab]);

  const copyPrompt = async () => {
    if (!notes.trim()) { showToast('メモを入力してください'); return; }
    try { await navigator.clipboard.writeText(buildPrompt(notes)); showToast('プロンプトをコピーしました'); }
    catch { showToast('コピー失敗'); }
  };

  const exportSvg = (svg: string, name: string) => {
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: name });
    a.click(); URL.revokeObjectURL(a.href);
    showToast('SVGを保存しました');
  };

  const exportPng = useCallback((svg: string, name: string) => {
    if (!svg) return;
    const wm = svg.match(/width="([\d.]+)"/), hm = svg.match(/height="([\d.]+)"/);
    const w = wm ? parseFloat(wm[1]) : 800, h = hm ? parseFloat(hm[1]) : 400, scale = 2;
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = w * scale; canvas.height = h * scale;
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      ctx.scale(scale, scale); ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob(blob => {
        if (!blob) return;
        const pu = URL.createObjectURL(blob);
        const a = Object.assign(document.createElement('a'), { href: pu, download: name });
        a.click(); URL.revokeObjectURL(pu);
        showToast('PNGを保存しました');
      }, 'image/png');
    };
    img.src = url;
  }, [showToast]);

  const openInTab = (svg: string) => {
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    window.open(URL.createObjectURL(blob), '_blank');
  };

  const currentSvg = tab === 'logic' ? logicSvg : tab === 'flow' ? flowSvg : ganttSvg.current;

  return (
    <div className={`planner-root ${dark ? 'dark' : 'light'}`}>
      <div className="pl-header">
        <div className="pl-logo-icon"><LayoutDashboard size={20} color="white" /></div>
        <h1><span className="pl-accent">Planner</span></h1>
      </div>

      <div className="pl-body">
        {/* Left: notes input */}
        <div className="pl-input-col">
          <div className="pl-section-label">雑なメモ / TODO</div>
          <textarea
            className="pl-textarea"
            rows={10}
            placeholder="やりたいこと、課題、バラバラなTODOを雑に貼り付けてください"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
          <button className="pl-btn pl-btn-primary" onClick={copyPrompt} disabled={!notes.trim()}>
            プロンプトをコピー
          </button>
        </div>

        {/* Right: preview */}
        <div className="pl-preview-col">
          <div className="pl-tabs">
            {(['logic', 'flow', 'gantt'] as PlanTab[]).map(t => (
              <button key={t} className={`pl-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                {t === 'logic' ? 'ロジック' : t === 'flow' ? 'フロー' : 'ガント'}
              </button>
            ))}
            <div className="pl-tab-actions">
              {currentSvg && <>
                <button className="pl-btn pl-btn-ghost pl-btn-xs" onClick={() => openInTab(currentSvg)}>別タブ</button>
                <button className="pl-btn pl-btn-ghost pl-btn-xs" onClick={() => exportSvg(currentSvg, `planner-${tab}.svg`)}>SVG</button>
                <button className="pl-btn pl-btn-ghost pl-btn-xs" onClick={() => exportPng(currentSvg, `planner-${tab}.png`)}>PNG</button>
              </>}
            </div>
          </div>

          <div className="pl-preview-area">
            {tab === 'logic' && (
              <div ref={logicRef}>
                {logicSvg
                  ? <div dangerouslySetInnerHTML={{ __html: logicSvg }} />
                  : <div className="pl-empty">LLM出力を貼り付けるとロジックツリーが表示されます</div>
                }
              </div>
            )}
            {tab === 'flow' && (
              <div ref={flowRef}>
                {flowSvg
                  ? <div dangerouslySetInnerHTML={{ __html: flowSvg }} />
                  : <div className="pl-empty">LLM出力を貼り付けるとフロー図が表示されます</div>
                }
              </div>
            )}
            {tab === 'gantt' && (
              <>
                {!ganttHasSvg && !gantt.trim() && <div className="pl-empty">LLM出力を貼り付けるとガントチャートが表示されます</div>}
                <div ref={ganttRef} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Output paste — full width, resizable both ways */}
      <div className="pl-output-row">
        <div className="pl-section-label">LLM出力を貼り付け</div>
        <textarea
          className="pl-textarea pl-textarea-output"
          rows={8}
          placeholder="LLMが ## LOGIC / ## FLOW / ## GANTT 形式で出力した結果をここに貼り付け"
          value={output}
          onChange={e => setOutput(e.target.value)}
        />
      </div>

      {toast && <div className="pl-toast">{toast}</div>}
    </div>
  );
};

export default Planner;

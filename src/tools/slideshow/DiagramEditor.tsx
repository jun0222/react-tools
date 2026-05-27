import React from 'react';
import {
  type DiagramData,
  type DiagramKind,
  type VennData,
  type MatrixData,
  type PyramidData,
  type FlowchartData,
  type LogicTreeData,
  type BarChartData,
  type LineChartData,
  type ImageData,
  DIAGRAM_KINDS,
  DIAGRAM_KIND_NAMES,
  DEFAULT_DIAGRAMS,
} from './slideshowCore';

// ---- Props ----

interface DiagramEditorPanelProps {
  diagram: DiagramData;
  onChange: (d: DiagramData) => void;
}

// ---- Color presets ----

const COLOR_PRESETS = ['#7c3aed', '#4f46e5', '#db2777', '#d97706', '#16a34a', '#0891b2', '#dc2626', '#374151'];

const ColorChips = ({ value, onChange }: { value: string; onChange: (c: string) => void }) => (
  <div className="sw-de-color-chips">
    {COLOR_PRESETS.map(c => (
      <button
        key={c}
        className={`sw-de-color-chip ${value === c ? 'sw-de-color-chip-active' : ''}`}
        style={{ background: c }}
        onClick={() => onChange(c)}
        title={c}
      />
    ))}
  </div>
);

// ---- Form editors ----

const VennEditor = ({ data, onChange }: { data: VennData; onChange: (d: DiagramData) => void }) => (
  <div className="sw-de-form">
    <div className="sw-de-row">
      <label className="sw-de-label">左ラベル</label>
      <input className="sw-de-input" value={data.leftLabel} onChange={e => onChange({ ...data, leftLabel: e.target.value })} />
    </div>
    <div className="sw-de-row">
      <label className="sw-de-label">左の色</label>
      <ColorChips value={data.leftColor} onChange={c => onChange({ ...data, leftColor: c })} />
    </div>
    <div className="sw-de-row">
      <label className="sw-de-label">右ラベル</label>
      <input className="sw-de-input" value={data.rightLabel} onChange={e => onChange({ ...data, rightLabel: e.target.value })} />
    </div>
    <div className="sw-de-row">
      <label className="sw-de-label">右の色</label>
      <ColorChips value={data.rightColor} onChange={c => onChange({ ...data, rightColor: c })} />
    </div>
    <div className="sw-de-row">
      <label className="sw-de-label">重なりラベル</label>
      <input className="sw-de-input" value={data.overlapLabel} onChange={e => onChange({ ...data, overlapLabel: e.target.value })} />
    </div>
  </div>
);

const MatrixEditor = ({ data, onChange }: { data: MatrixData; onChange: (d: DiagramData) => void }) => {
  const isNine = data.kind === 'matrix9';
  const dim = isNine ? 3 : 2;
  return (
    <div className="sw-de-form">
      <div className="sw-de-row">
        <label className="sw-de-label">X軸ラベル</label>
        <input className="sw-de-input" value={data.xLabel} onChange={e => onChange({ ...data, xLabel: e.target.value })} />
      </div>
      <div className="sw-de-row">
        <label className="sw-de-label">Y軸ラベル</label>
        <input className="sw-de-input" value={data.yLabel} onChange={e => onChange({ ...data, yLabel: e.target.value })} />
      </div>
      <div className="sw-de-sublabel">列ヘッダー</div>
      <div className="sw-de-grid-row">
        {Array.from({ length: dim }).map((_, i) => (
          <input
            key={i}
            className="sw-de-input"
            value={data.colHeaders[i] ?? ''}
            onChange={e => {
              const h = [...data.colHeaders];
              h[i] = e.target.value;
              onChange({ ...data, colHeaders: h });
            }}
          />
        ))}
      </div>
      <div className="sw-de-sublabel">行ヘッダー</div>
      <div className="sw-de-grid-row">
        {Array.from({ length: dim }).map((_, i) => (
          <input
            key={i}
            className="sw-de-input"
            value={data.rowHeaders[i] ?? ''}
            onChange={e => {
              const h = [...data.rowHeaders];
              h[i] = e.target.value;
              onChange({ ...data, rowHeaders: h });
            }}
          />
        ))}
      </div>
      <div className="sw-de-sublabel">セル</div>
      <div className={`sw-de-matrix-grid sw-de-matrix-${dim}`}>
        {Array.from({ length: dim * dim }).map((_, idx) => (
          <input
            key={idx}
            className="sw-de-input"
            value={data.cells[idx] ?? ''}
            onChange={e => {
              const c = [...data.cells];
              c[idx] = e.target.value;
              onChange({ ...data, cells: c });
            }}
          />
        ))}
      </div>
    </div>
  );
};

const PyramidEditor = ({ data, onChange }: { data: PyramidData; onChange: (d: DiagramData) => void }) => (
  <div className="sw-de-form">
    {data.layers.map((layer, i) => (
      <div key={i} className="sw-de-pyramid-row">
        <span className="sw-de-sublabel">層 {i + 1}</span>
        <input
          className="sw-de-input"
          placeholder="ラベル"
          value={layer.label}
          onChange={e => {
            const ls = data.layers.map((l, j) => j === i ? { ...l, label: e.target.value } : l);
            onChange({ ...data, layers: ls });
          }}
        />
        <input
          className="sw-de-input"
          placeholder="サブラベル"
          value={layer.subLabel}
          onChange={e => {
            const ls = data.layers.map((l, j) => j === i ? { ...l, subLabel: e.target.value } : l);
            onChange({ ...data, layers: ls });
          }}
        />
        <button
          className="sw-de-icon-btn"
          onClick={() => onChange({ ...data, layers: data.layers.filter((_, j) => j !== i) })}
          aria-label="削除"
          disabled={data.layers.length <= 1}
        >×</button>
      </div>
    ))}
    {data.layers.length < 5 && (
      <button
        className="sw-de-add-btn"
        onClick={() => onChange({ ...data, layers: [...data.layers, { label: '新しい層', subLabel: '' }] })}
      >
        + 層を追加
      </button>
    )}
  </div>
);

const FLOW_TYPES = ['start', 'process', 'decision', 'end'] as const;

const FlowchartEditor = ({ data, onChange }: { data: FlowchartData; onChange: (d: DiagramData) => void }) => (
  <div className="sw-de-form">
    {data.nodes.map((node, i) => (
      <div key={node.id} className="sw-de-flow-row">
        <input
          className="sw-de-input sw-de-input-flex"
          placeholder="ラベル"
          value={node.label}
          onChange={e => {
            const ns = data.nodes.map((n, j) => j === i ? { ...n, label: e.target.value } : n);
            onChange({ ...data, nodes: ns });
          }}
        />
        <select
          className="sw-de-select"
          value={node.type}
          onChange={e => {
            const ns = data.nodes.map((n, j) => j === i ? { ...n, type: e.target.value as typeof node.type } : n);
            onChange({ ...data, nodes: ns });
          }}
        >
          {FLOW_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button
          className="sw-de-icon-btn"
          onClick={() => onChange({ ...data, nodes: data.nodes.filter((_, j) => j !== i) })}
          aria-label="削除"
          disabled={data.nodes.length <= 1}
        >×</button>
      </div>
    ))}
    {data.nodes.length < 6 && (
      <button
        className="sw-de-add-btn"
        onClick={() => onChange({ ...data, nodes: [...data.nodes, { id: String(Date.now()), label: 'ノード', type: 'process' }] })}
      >
        + ノードを追加
      </button>
    )}
  </div>
);

const LogicTreeEditor = ({ data, onChange }: { data: LogicTreeData; onChange: (d: DiagramData) => void }) => (
  <div className="sw-de-form">
    <div className="sw-de-row">
      <label className="sw-de-label">ルート</label>
      <input className="sw-de-input" value={data.root} onChange={e => onChange({ ...data, root: e.target.value })} />
    </div>
    {data.branches.map((branch, bi) => (
      <div key={bi} className="sw-de-branch-block">
        <div className="sw-de-branch-header">
          <span className="sw-de-sublabel">ブランチ {bi + 1}</span>
          <input
            className="sw-de-input sw-de-input-flex"
            placeholder="ラベル"
            value={branch.label}
            onChange={e => {
              const bs = data.branches.map((b, j) => j === bi ? { ...b, label: e.target.value } : b);
              onChange({ ...data, branches: bs });
            }}
          />
          <button
            className="sw-de-icon-btn"
            onClick={() => onChange({ ...data, branches: data.branches.filter((_, j) => j !== bi) })}
            aria-label="削除"
            disabled={data.branches.length <= 1}
          >×</button>
        </div>
        {branch.children.map((child, ci) => (
          <div key={ci} className="sw-de-child-row">
            <input
              className="sw-de-input sw-de-input-flex"
              placeholder={`子 ${ci + 1}`}
              value={child}
              onChange={e => {
                const children = branch.children.map((c, k) => k === ci ? e.target.value : c);
                const bs = data.branches.map((b, j) => j === bi ? { ...b, children } : b);
                onChange({ ...data, branches: bs });
              }}
            />
            <button
              className="sw-de-icon-btn"
              onClick={() => {
                const children = branch.children.filter((_, k) => k !== ci);
                const bs = data.branches.map((b, j) => j === bi ? { ...b, children } : b);
                onChange({ ...data, branches: bs });
              }}
              aria-label="削除"
              disabled={branch.children.length <= 1}
            >×</button>
          </div>
        ))}
        {branch.children.length < 4 && (
          <button
            className="sw-de-add-btn sw-de-add-btn-sm"
            onClick={() => {
              const children = [...branch.children, '子項目'];
              const bs = data.branches.map((b, j) => j === bi ? { ...b, children } : b);
              onChange({ ...data, branches: bs });
            }}
          >
            + 子を追加
          </button>
        )}
      </div>
    ))}
    {data.branches.length < 4 && (
      <button
        className="sw-de-add-btn"
        onClick={() => onChange({ ...data, branches: [...data.branches, { label: 'ブランチ', children: ['子項目'] }] })}
      >
        + ブランチを追加
      </button>
    )}
  </div>
);

const BarChartEditor = ({ data, onChange }: { data: BarChartData; onChange: (d: DiagramData) => void }) => (
  <div className="sw-de-form">
    <div className="sw-de-row">
      <label className="sw-de-label">バーの色</label>
      <ColorChips value={data.barColor} onChange={c => onChange({ ...data, barColor: c })} />
    </div>
    <div className="sw-de-sublabel">X軸ラベル（カンマ区切り）</div>
    <input
      className="sw-de-input"
      value={data.xLabels.join(',')}
      onChange={e => {
        const labels = e.target.value.split(',').map(s => s.trim());
        onChange({ ...data, xLabels: labels });
      }}
    />
    <div className="sw-de-sublabel">値</div>
    <div className="sw-de-values-row">
      {data.values.map((v, i) => (
        <input
          key={i}
          className="sw-de-input sw-de-input-num"
          type="number"
          value={v}
          onChange={e => {
            const vals = data.values.map((old, j) => j === i ? Number(e.target.value) : old);
            onChange({ ...data, values: vals });
          }}
        />
      ))}
    </div>
    <div className="sw-de-add-row">
      <button
        className="sw-de-add-btn"
        onClick={() => onChange({ ...data, xLabels: [...data.xLabels, `項目${data.values.length + 1}`], values: [...data.values, 50] })}
      >+ 追加</button>
      {data.values.length > 1 && (
        <button
          className="sw-de-add-btn"
          onClick={() => onChange({ ...data, xLabels: data.xLabels.slice(0, -1), values: data.values.slice(0, -1) })}
        >− 削除</button>
      )}
    </div>
  </div>
);

const LineChartEditor = ({ data, onChange }: { data: LineChartData; onChange: (d: DiagramData) => void }) => (
  <div className="sw-de-form">
    <div className="sw-de-sublabel">X軸ラベル（カンマ区切り）</div>
    <input
      className="sw-de-input"
      value={data.xLabels.join(',')}
      onChange={e => {
        const labels = e.target.value.split(',').map(s => s.trim());
        onChange({ ...data, xLabels: labels });
      }}
    />
    {data.series.map((s, si) => (
      <div key={si} className="sw-de-series-block">
        <div className="sw-de-branch-header">
          <input
            className="sw-de-input sw-de-input-flex"
            placeholder="シリーズ名"
            value={s.name}
            onChange={e => {
              const series = data.series.map((ser, j) => j === si ? { ...ser, name: e.target.value } : ser);
              onChange({ ...data, series });
            }}
          />
          <button
            className="sw-de-icon-btn"
            onClick={() => onChange({ ...data, series: data.series.filter((_, j) => j !== si) })}
            disabled={data.series.length <= 1}
            aria-label="削除"
          >×</button>
        </div>
        <div className="sw-de-sublabel">値（カンマ区切り）</div>
        <input
          className="sw-de-input"
          value={s.values.join(',')}
          onChange={e => {
            const values = e.target.value.split(',').map(v => Number(v.trim()) || 0);
            const series = data.series.map((ser, j) => j === si ? { ...ser, values } : ser);
            onChange({ ...data, series });
          }}
        />
      </div>
    ))}
    {data.series.length < 5 && (
      <button
        className="sw-de-add-btn"
        onClick={() => onChange({ ...data, series: [...data.series, { name: `シリーズ${data.series.length + 1}`, values: data.xLabels.map(() => 50) }] })}
      >
        + シリーズを追加
      </button>
    )}
  </div>
);

const ImageEditor = ({ data, onChange }: { data: ImageData; onChange: (d: DiagramData) => void }) => (
  <div className="sw-de-form">
    <label className="sw-de-file-label">
      <span className="sw-de-add-btn">画像を選択</span>
      <input
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = ev => {
            onChange({ ...data, src: ev.target?.result as string });
          };
          reader.readAsDataURL(file);
          e.target.value = '';
        }}
      />
    </label>
    {data.src && (
      <div className="sw-de-img-preview">
        <img src={data.src} alt="preview" style={{ maxWidth: '100%', maxHeight: 120, objectFit: 'contain' }} />
        <button className="sw-de-add-btn" onClick={() => onChange({ ...data, src: '' })}>削除</button>
      </div>
    )}
  </div>
);

// ---- SVG Preview helpers ----

const PREVIEW_W = 480;
const PREVIEW_H = 270;

const PreviewVenn = ({ data }: { data: VennData }) => (
  <svg viewBox="0 0 460 300" width={PREVIEW_W} height={PREVIEW_H}>
    <circle cx={175} cy={150} r={120} fill={data.leftColor + '26'} stroke={data.leftColor} strokeWidth={2} />
    <circle cx={285} cy={150} r={120} fill={data.rightColor + '26'} stroke={data.rightColor} strokeWidth={2} />
    <text x={105} y={155} textAnchor="middle" fontSize={17} fill={data.leftColor} fontWeight="bold">{data.leftLabel}</text>
    <text x={355} y={155} textAnchor="middle" fontSize={17} fill={data.rightColor} fontWeight="bold">{data.rightLabel}</text>
    <text x={230} y={155} textAnchor="middle" fontSize={14} fill="#374151">{data.overlapLabel}</text>
  </svg>
);

const PreviewMatrix = ({ data }: { data: MatrixData }) => {
  const isNine = data.kind === 'matrix9';
  const ox = 80, oy = 60;
  const w = isNine ? 390 : 360, h = isNine ? 330 : 280;
  const dim = isNine ? 3 : 2;
  const cw = w / dim, ch = h / dim;
  const vb = isNine ? '0 0 530 430' : '0 0 480 380';
  const vw = isNine ? 460 : 420, vh = isNine ? 373 : 332;
  return (
    <svg viewBox={vb} width={PREVIEW_W} height={PREVIEW_H}>
      <rect x={ox} y={oy} width={w} height={h} stroke="#9ca3af" strokeWidth={1} fill="none" />
      {Array.from({ length: dim - 1 }).map((_, i) => (
        <React.Fragment key={i}>
          <line x1={ox + cw * (i + 1)} y1={oy} x2={ox + cw * (i + 1)} y2={oy + h} stroke="#9ca3af" strokeWidth={1} />
          <line x1={ox} y1={oy + ch * (i + 1)} x2={ox + w} y2={oy + ch * (i + 1)} stroke="#9ca3af" strokeWidth={1} />
        </React.Fragment>
      ))}
      {data.colHeaders.slice(0, dim).map((lbl, i) => (
        <text key={i} x={ox + cw * i + cw / 2} y={44} textAnchor="middle" fontSize={13} fill="#374151">{lbl}</text>
      ))}
      {data.rowHeaders.slice(0, dim).map((r, i) => (
        <text key={i} x={ox - 6} y={oy + ch * i + ch / 2 + 5} textAnchor="end" fontSize={13} fill="#374151">{r}</text>
      ))}
      <text x={ox + w / 2} y={oy + h + 22} textAnchor="middle" fontSize={14} fill="#7c3aed" fontWeight="bold">{data.xLabel}</text>
      <text transform={`rotate(-90,22,${h / 2 + oy})`} x={22} y={h / 2 + oy + 4} textAnchor="middle" fontSize={14} fill="#7c3aed" fontWeight="bold">{data.yLabel}</text>
      {data.cells.slice(0, dim * dim).map((cell, idx) => (
        <text key={idx} x={ox + (idx % dim) * cw + cw / 2} y={oy + Math.floor(idx / dim) * ch + ch / 2 + 5} textAnchor="middle" fontSize={12} fill="#1e1b4b">{cell}</text>
      ))}
      {/* suppress unused vars */}
      {vw && vh && null}
    </svg>
  );
};

const PYRAMID_COLORS_PREVIEW = ['#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95', '#3b0764'];

const PreviewPyramid = ({ data }: { data: PyramidData }) => {
  const layers = data.layers.slice(0, 5);
  const n = Math.max(1, layers.length);
  const layerH = 56, gap = 8, centerX = 230, baseY = 260;
  const totalH = n * layerH + (n - 1) * gap;
  const svgH = totalH + 60;

  return (
    <svg viewBox={`0 0 460 ${svgH}`} width={PREVIEW_W} height={PREVIEW_H}>
      {layers.map((layer, i) => {
        const wi = 100 + i * 70;
        const y2 = baseY - i * (layerH + gap);
        const y1 = y2 - layerH;
        const wi1 = 100 + (i + 1) * 70;
        const color = PYRAMID_COLORS_PREVIEW[n - 1 - i] ?? PYRAMID_COLORS_PREVIEW[4];
        const cy = (y1 + y2) / 2;
        const pts = `${centerX - wi / 2},${y1} ${centerX + wi / 2},${y1} ${centerX + wi1 / 2},${y2} ${centerX - wi1 / 2},${y2}`;
        return (
          <g key={i}>
            <polygon points={pts} fill={color} />
            <text x={centerX} y={cy + 3} textAnchor="middle" fontSize={14} fill="#fff" fontWeight="bold">{layer.label}</text>
            {layer.subLabel && <text x={centerX} y={cy + 17} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.75)">{layer.subLabel}</text>}
          </g>
        );
      })}
    </svg>
  );
};

const PreviewFlowchart = ({ data }: { data: FlowchartData }) => {
  const nodes = data.nodes.slice(0, 6);
  const n = nodes.length;
  const nodeH = 44, spacing = 20, paddingV = 20;
  const totalH = n * nodeH + (n - 1) * spacing + paddingV * 2;

  return (
    <svg viewBox={`0 0 260 ${totalH}`} width={PREVIEW_W * 0.5} height={PREVIEW_H}>
      {nodes.map((node, i) => {
        const y = paddingV + i * (nodeH + spacing);
        const cy = y + nodeH / 2;
        const isStartEnd = node.type === 'start' || node.type === 'end';
        const isDec = node.type === 'decision';
        const nextY = paddingV + (i + 1) * (nodeH + spacing);
        return (
          <g key={node.id}>
            {isDec
              ? <polygon points={`130,${y} 220,${cy} 130,${y + nodeH} 40,${cy}`} fill="white" stroke="#7c3aed" strokeWidth={1.5} />
              : <rect x={40} y={y} width={180} height={nodeH} rx={isStartEnd ? 20 : 4} fill={isStartEnd ? '#7c3aed' : 'white'} stroke={isStartEnd ? 'none' : '#7c3aed'} strokeWidth={1.5} />
            }
            <text x={130} y={cy + 5} textAnchor="middle" fontSize={12} fill={isStartEnd ? '#fff' : '#1e1b4b'}>{node.label}</text>
            {i < n - 1 && <>
              <line x1={130} y1={y + nodeH} x2={130} y2={nextY - 4} stroke="#9ca3af" strokeWidth={1.5} />
              <polygon points={`130,${nextY} 125,${nextY - 6} 135,${nextY - 6}`} fill="#9ca3af" />
            </>}
          </g>
        );
      })}
    </svg>
  );
};

const PreviewLogicTree = ({ data }: { data: LogicTreeData }) => {
  const branches = data.branches.slice(0, 4);
  const totalItems = branches.reduce((acc, b) => acc + Math.max(1, b.children.length), 0);
  const itemH = 40, paddingV = 20;
  const h = Math.max(totalItems * itemH + paddingV * 2, 120);
  const rootCy = h / 2;

  let currentY = paddingV;
  const branchYs = branches.map(b => {
    const bh = Math.max(1, b.children.length) * itemH;
    const by = currentY + bh / 2;
    currentY += bh;
    return by;
  });

  return (
    <svg viewBox={`0 0 640 ${h}`} width={PREVIEW_W} height={PREVIEW_H}>
      <rect x={10} y={rootCy - 22} width={120} height={44} fill="#7c3aed" rx={4} />
      <text x={70} y={rootCy + 5} textAnchor="middle" fontSize={13} fill="white">{data.root}</text>
      {branches.map((branch, bi) => {
        const by = branchYs[bi];
        const children = branch.children.slice(0, 4);
        const branchStartY = branchYs.slice(0, bi).reduce((acc, _, idx) => acc + Math.max(1, branches[idx].children.length) * itemH, paddingV);
        const childYs = children.map((_, ci) => branchStartY + ci * itemH + itemH / 2);
        return (
          <g key={bi}>
            <path d={`M 130 ${rootCy} H 155 V ${by} H 180`} stroke="#7c3aed" strokeWidth={1.5} fill="none" />
            <rect x={180} y={by - 20} width={120} height={40} fill="white" stroke="#7c3aed" strokeWidth={1.5} rx={3} />
            <text x={240} y={by + 5} textAnchor="middle" fontSize={12} fill="#1e1b4b">{branch.label}</text>
            {childYs.map((sy, ci) => (
              <g key={ci}>
                <path d={`M 300 ${by} H 330 V ${sy} H 360`} stroke="rgba(124,58,237,0.5)" strokeWidth={1} fill="none" />
                <rect x={360} y={sy - 18} width={130} height={36} fill="rgba(124,58,237,0.1)" stroke="rgba(124,58,237,0.3)" rx={3} />
                <text x={425} y={sy + 5} textAnchor="middle" fontSize={11} fill="#1e1b4b">{children[ci]}</text>
              </g>
            ))}
          </g>
        );
      })}
    </svg>
  );
};

const PreviewBarChart = ({ data }: { data: BarChartData }) => {
  const chartX = 60, chartY = 20, chartW = 400, chartH = 240;
  const maxVal = Math.max(...data.values, 100);
  const n = data.values.length;
  const barW = (chartW / n) * 0.6;
  const gap = (chartW / n) * 0.4;

  return (
    <svg viewBox="0 0 500 320" width={PREVIEW_W} height={PREVIEW_H}>
      {[0.25, 0.5, 0.75, 1].map((pct, i) => {
        const y = chartY + chartH - chartH * pct;
        return (
          <g key={i}>
            <line x1={chartX} y1={y} x2={chartX + chartW} y2={y} stroke="#e5e7eb" strokeWidth={1} />
            <text x={chartX - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#9ca3af">{Math.round(maxVal * pct)}</text>
          </g>
        );
      })}
      <line x1={chartX} y1={chartY} x2={chartX} y2={chartY + chartH} stroke="#9ca3af" strokeWidth={1} />
      <line x1={chartX} y1={chartY + chartH} x2={chartX + chartW} y2={chartY + chartH} stroke="#9ca3af" strokeWidth={1} />
      {data.values.map((val, i) => {
        const bh = (val / maxVal) * chartH;
        const bx = chartX + i * (chartW / n) + gap / 2;
        const by = chartY + chartH - bh;
        const lx = bx + barW / 2;
        return (
          <g key={i}>
            <rect x={bx} y={by} width={barW} height={bh} fill={data.barColor} />
            <text x={lx} y={by - 4} textAnchor="middle" fontSize={11} fill={data.barColor}>{val}</text>
            <text x={lx} y={chartY + chartH + 14} textAnchor="middle" fontSize={11} fill="#374151">{data.xLabels[i] ?? ''}</text>
          </g>
        );
      })}
    </svg>
  );
};

const LINE_COLORS_PREVIEW = ['#7c3aed', '#4f46e5', '#db2777', '#d97706', '#16a34a'];

const PreviewLineChart = ({ data }: { data: LineChartData }) => {
  const chartX = 60, chartY = 20, chartW = 400, chartH = 240;
  const allVals = data.series.flatMap(s => s.values);
  const maxVal = Math.max(...allVals, 100);
  const n = data.xLabels.length;
  const stepX = n > 1 ? chartW / (n - 1) : chartW;
  const getX = (i: number) => chartX + i * stepX;
  const getY = (v: number) => chartY + chartH - (v / maxVal) * chartH;

  return (
    <svg viewBox="0 0 500 320" width={PREVIEW_W} height={PREVIEW_H}>
      {[0.25, 0.5, 0.75, 1].map((pct, i) => {
        const y = chartY + chartH - chartH * pct;
        return (
          <g key={i}>
            <line x1={chartX} y1={y} x2={chartX + chartW} y2={y} stroke="#e5e7eb" strokeWidth={1} />
            <text x={chartX - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#9ca3af">{Math.round(maxVal * pct)}</text>
          </g>
        );
      })}
      <line x1={chartX} y1={chartY} x2={chartX} y2={chartY + chartH} stroke="#9ca3af" strokeWidth={1} />
      <line x1={chartX} y1={chartY + chartH} x2={chartX + chartW} y2={chartY + chartH} stroke="#9ca3af" strokeWidth={1} />
      {data.xLabels.map((lbl, i) => (
        <text key={i} x={getX(i)} y={chartY + chartH + 14} textAnchor="middle" fontSize={11} fill="#374151">{lbl}</text>
      ))}
      {data.series.map((series, si) => {
        const color = LINE_COLORS_PREVIEW[si % LINE_COLORS_PREVIEW.length];
        const pts = series.values.map((v, i) => `${getX(i)},${getY(v)}`).join(' ');
        return (
          <g key={si}>
            <polyline points={pts} stroke={color} strokeWidth={2} fill="none" />
            {series.values.map((v, i) => <circle key={i} cx={getX(i)} cy={getY(v)} r={3} fill={color} />)}
            <circle cx={chartX + si * 90} cy={chartY + chartH + 34} r={4} fill={color} />
            <text x={chartX + si * 90 + 8} y={chartY + chartH + 38} fontSize={10} fill="#374151">{series.name}</text>
          </g>
        );
      })}
    </svg>
  );
};

const PreviewImage = ({ data }: { data: ImageData }) => (
  <div className="sw-de-img-center">
    {data.src
      ? <img src={data.src} alt="diagram" style={{ maxWidth: PREVIEW_W, maxHeight: PREVIEW_H, objectFit: 'contain' }} />
      : <span style={{ color: 'rgba(167,139,250,0.4)', fontSize: 13 }}>画像未設定</span>
    }
  </div>
);

const DiagramPreview = ({ diagram }: { diagram: DiagramData }) => {
  switch (diagram.kind) {
    case 'venn':        return <PreviewVenn data={diagram} />;
    case 'matrix4':
    case 'matrix9':     return <PreviewMatrix data={diagram} />;
    case 'pyramid':     return <PreviewPyramid data={diagram} />;
    case 'flowchart':   return <PreviewFlowchart data={diagram} />;
    case 'logic-tree':  return <PreviewLogicTree data={diagram} />;
    case 'bar-chart':   return <PreviewBarChart data={diagram} />;
    case 'line-chart':  return <PreviewLineChart data={diagram} />;
    case 'image':       return <PreviewImage data={diagram} />;
    default:            return null;
  }
};

// ---- Form dispatcher ----

const DiagramForm = ({ diagram, onChange }: { diagram: DiagramData; onChange: (d: DiagramData) => void }) => {
  switch (diagram.kind) {
    case 'venn':        return <VennEditor data={diagram} onChange={onChange} />;
    case 'matrix4':
    case 'matrix9':     return <MatrixEditor data={diagram} onChange={onChange} />;
    case 'pyramid':     return <PyramidEditor data={diagram} onChange={onChange} />;
    case 'flowchart':   return <FlowchartEditor data={diagram} onChange={onChange} />;
    case 'logic-tree':  return <LogicTreeEditor data={diagram} onChange={onChange} />;
    case 'bar-chart':   return <BarChartEditor data={diagram} onChange={onChange} />;
    case 'line-chart':  return <LineChartEditor data={diagram} onChange={onChange} />;
    case 'image':       return <ImageEditor data={diagram} onChange={onChange} />;
    default:            return null;
  }
};

// ---- Main export ----

export const DiagramEditorPanel = ({ diagram, onChange }: DiagramEditorPanelProps) => {
  const handleKindChange = (kind: DiagramKind) => {
    if (kind === diagram.kind) return;
    onChange({ ...DEFAULT_DIAGRAMS[kind] });
  };

  return (
    <div className="sw-de-panel">
      {/* Kind selector */}
      <div className="sw-de-kind-row">
        {DIAGRAM_KINDS.map(k => (
          <button
            key={k}
            className={`sw-de-kind-btn ${diagram.kind === k ? 'sw-de-kind-btn-active' : ''}`}
            onClick={() => handleKindChange(k)}
          >
            {DIAGRAM_KIND_NAMES[k]}
          </button>
        ))}
      </div>

      {/* Form */}
      <DiagramForm diagram={diagram} onChange={onChange} />

      {/* Preview */}
      <div className="sw-de-preview-box">
        <div className="sw-de-preview-label">プレビュー</div>
        <div className="sw-de-preview-inner">
          <DiagramPreview diagram={diagram} />
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Svg, Circle, Rect, Line, Path, Polygon, G, Text as SvgText, Image } from '@react-pdf/renderer';
import type { SVGPresentationAttributes } from '@react-pdf/types';
import type { DiagramData, VennData, MatrixData, PyramidData, FlowchartData, LogicTreeData, BarChartData, LineChartData, ImageData } from './slideshowCore';

// SVGTextProps does not expose fontSize/fontFamily/fontWeight as direct props;
// they are passed via style. This wrapper keeps call sites clean.
interface TProps extends SVGPresentationAttributes {
  x: number | string;
  y: number | string;
  textAnchor?: 'start' | 'middle' | 'end';
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold';
  children: React.ReactNode;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const T = ({ x, y, textAnchor, fontSize, fontFamily, fontWeight, fill, children }: TProps) => (
  <SvgText
    x={x}
    y={y}
    textAnchor={textAnchor}
    fill={fill}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    style={{ fontSize, fontFamily, fontWeight } as any}
  >
    {children}
  </SvgText>
);

// ---- Venn ----

const VennDiagram = ({ data }: { data: VennData }) => (
  <Svg viewBox="0 0 460 300" width={420} height={273}>
    <Circle cx={175} cy={150} r={120} fill={data.leftColor + '26'} stroke={data.leftColor} strokeWidth={2} />
    <Circle cx={285} cy={150} r={120} fill={data.rightColor + '26'} stroke={data.rightColor} strokeWidth={2} />
    <T x={105} y={155} textAnchor="middle" fontSize={17} fill={data.leftColor} fontWeight="bold" fontFamily="NotoSansJP">
      {data.leftLabel}
    </T>
    <T x={355} y={155} textAnchor="middle" fontSize={17} fill={data.rightColor} fontWeight="bold" fontFamily="NotoSansJP">
      {data.rightLabel}
    </T>
    <T x={230} y={155} textAnchor="middle" fontSize={14} fill="#374151" fontFamily="NotoSansJP">
      {data.overlapLabel}
    </T>
  </Svg>
);

// ---- Matrix4 ----

const Matrix4Diagram = ({ data }: { data: MatrixData }) => {
  const ox = 80, oy = 60, w = 360, h = 280;
  const cw = w / 2, ch = h / 2;
  return (
    <Svg viewBox="0 0 480 380" width={420} height={332}>
      <Rect x={ox} y={oy} width={w} height={h} stroke="#9ca3af" strokeWidth={1} fill="none" />
      <Line x1={ox + cw} y1={oy} x2={ox + cw} y2={oy + h} stroke="#9ca3af" strokeWidth={1} />
      <Line x1={ox} y1={oy + ch} x2={ox + w} y2={oy + ch} stroke="#9ca3af" strokeWidth={1} />
      {data.colHeaders.slice(0, 2).map((lbl, i) => (
        <T key={i} x={ox + cw * i + cw / 2} y={44} textAnchor="middle" fontSize={13} fill="#374151" fontFamily="NotoSansJP">
          {lbl}
        </T>
      ))}
      {data.rowHeaders.slice(0, 2).map((r, i) => (
        <T key={i} x={ox - 6} y={oy + ch * i + ch / 2 + 5} textAnchor="end" fontSize={13} fill="#374151" fontFamily="NotoSansJP">
          {r}
        </T>
      ))}
      <T x={ox + w / 2} y={oy + h + 22} textAnchor="middle" fontSize={14} fill="#7c3aed" fontWeight="bold" fontFamily="NotoSansJP">
        {data.xLabel}
      </T>
      <G transform="rotate(-90,22,200)">
        <T x={22} y={204} textAnchor="middle" fontSize={14} fill="#7c3aed" fontWeight="bold" fontFamily="NotoSansJP">
          {data.yLabel}
        </T>
      </G>
      {data.cells.slice(0, 4).map((cell, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        return (
          <T key={idx} x={ox + cw * col + cw / 2} y={oy + ch * row + ch / 2 + 5} textAnchor="middle" fontSize={12} fill="#1e1b4b" fontFamily="NotoSansJP">
            {cell}
          </T>
        );
      })}
    </Svg>
  );
};

// ---- Matrix9 ----

const Matrix9Diagram = ({ data }: { data: MatrixData }) => {
  const ox = 80, oy = 60, w = 390, h = 330;
  const cw = w / 3, ch = h / 3;
  return (
    <Svg viewBox="0 0 530 430" width={460} height={373}>
      <Rect x={ox} y={oy} width={w} height={h} stroke="#9ca3af" strokeWidth={1} fill="none" />
      <Line x1={ox + cw} y1={oy} x2={ox + cw} y2={oy + h} stroke="#9ca3af" strokeWidth={1} />
      <Line x1={ox + cw * 2} y1={oy} x2={ox + cw * 2} y2={oy + h} stroke="#9ca3af" strokeWidth={1} />
      <Line x1={ox} y1={oy + ch} x2={ox + w} y2={oy + ch} stroke="#9ca3af" strokeWidth={1} />
      <Line x1={ox} y1={oy + ch * 2} x2={ox + w} y2={oy + ch * 2} stroke="#9ca3af" strokeWidth={1} />
      {data.colHeaders.slice(0, 3).map((lbl, i) => (
        <T key={i} x={ox + cw * i + cw / 2} y={44} textAnchor="middle" fontSize={13} fill="#374151" fontFamily="NotoSansJP">
          {lbl}
        </T>
      ))}
      {data.rowHeaders.slice(0, 3).map((r, i) => (
        <T key={i} x={ox - 6} y={oy + ch * i + ch / 2 + 5} textAnchor="end" fontSize={13} fill="#374151" fontFamily="NotoSansJP">
          {r}
        </T>
      ))}
      <T x={ox + w / 2} y={oy + h + 22} textAnchor="middle" fontSize={14} fill="#7c3aed" fontWeight="bold" fontFamily="NotoSansJP">
        {data.xLabel}
      </T>
      <G transform="rotate(-90,22,225)">
        <T x={22} y={229} textAnchor="middle" fontSize={14} fill="#7c3aed" fontWeight="bold" fontFamily="NotoSansJP">
          {data.yLabel}
        </T>
      </G>
      {data.cells.slice(0, 9).map((cell, idx) => {
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        return (
          <T key={idx} x={ox + cw * col + cw / 2} y={oy + ch * row + ch / 2 + 5} textAnchor="middle" fontSize={12} fill="#1e1b4b" fontFamily="NotoSansJP">
            {cell}
          </T>
        );
      })}
    </Svg>
  );
};

// ---- Pyramid ----

const PYRAMID_COLORS = ['#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95', '#3b0764'];

const PyramidDiagram = ({ data }: { data: PyramidData }) => {
  const layers = data.layers.slice(0, 5);
  const n = Math.max(1, layers.length);
  const layerH = 56;
  const gap = 8;
  const centerX = 230;
  const baseY = 260;

  const shapes = layers.map((layer, i) => {
    const wi = 100 + i * 70;
    const y2 = baseY - i * (layerH + gap);
    const y1 = y2 - layerH;
    const wi1 = 100 + (i + 1) * 70;
    const x1top = centerX - wi / 2;
    const x2top = centerX + wi / 2;
    const x1bot = centerX - wi1 / 2;
    const x2bot = centerX + wi1 / 2;
    const color = PYRAMID_COLORS[n - 1 - i] ?? PYRAMID_COLORS[PYRAMID_COLORS.length - 1];
    const cy = (y1 + y2) / 2;
    return { layer, y1, y2: y2, x1top, x2top, x1bot, x2bot, color, cy };
  });

  const totalH = n * layerH + (n - 1) * gap;
  const svgH = totalH + 60;

  return (
    <Svg viewBox={`0 0 460 ${svgH}`} width={400} height={278}>
      {shapes.map((s, i) => (
        <G key={i}>
          <Polygon
            points={`${s.x1top},${s.y1} ${s.x2top},${s.y1} ${s.x2bot},${s.y2} ${s.x1bot},${s.y2}`}
            fill={s.color}
          />
          <T x={centerX} y={s.cy + 3} textAnchor="middle" fontSize={14} fill="#fff" fontWeight="bold" fontFamily="NotoSansJP">
            {s.layer.label}
          </T>
          {s.layer.subLabel ? (
            <T x={centerX} y={s.cy + 17} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.75)" fontFamily="NotoSansJP">
              {s.layer.subLabel}
            </T>
          ) : null}
        </G>
      ))}
    </Svg>
  );
};

// ---- Flowchart ----

const FlowchartDiagram = ({ data }: { data: FlowchartData }) => {
  const nodes = data.nodes.slice(0, 6);
  const n = nodes.length;
  const nodeH = 44;
  const spacing = 20;
  const paddingV = 20;
  const totalH = n * nodeH + (n - 1) * spacing + paddingV * 2;

  return (
    <Svg viewBox={`0 0 260 ${totalH}`} width={220} height={Math.min(totalH, 360)}>
      {nodes.map((node, i) => {
        const y = paddingV + i * (nodeH + spacing);
        const cy = y + nodeH / 2;
        const isStartEnd = node.type === 'start' || node.type === 'end';
        const isDec = node.type === 'decision';
        const textFill = isStartEnd ? '#fff' : '#1e1b4b';

        const nextY = paddingV + (i + 1) * (nodeH + spacing);
        const arrowEl = i < n - 1 ? (
          <G key={`arrow-${i}`}>
            <Line x1={130} y1={y + nodeH} x2={130} y2={nextY - 4} stroke="#9ca3af" strokeWidth={1.5} />
            <Polygon points={`130,${nextY} 125,${nextY - 6} 135,${nextY - 6}`} fill="#9ca3af" />
          </G>
        ) : null;

        if (isDec) {
          const pts = `130,${y} 220,${y + nodeH / 2} 130,${y + nodeH} 40,${y + nodeH / 2}`;
          return (
            <G key={node.id}>
              <Polygon points={pts} fill="white" stroke="#7c3aed" strokeWidth={1.5} />
              <T x={130} y={cy + 5} textAnchor="middle" fontSize={12} fill="#1e1b4b" fontFamily="NotoSansJP">
                {node.label}
              </T>
              {arrowEl}
            </G>
          );
        }

        return (
          <G key={node.id}>
            <Rect
              x={40} y={y} width={180} height={nodeH}
              rx={isStartEnd ? 20 : 4}
              fill={isStartEnd ? '#7c3aed' : 'white'}
              stroke={isStartEnd ? 'none' : '#7c3aed'}
              strokeWidth={isStartEnd ? 0 : 1.5}
            />
            <T x={130} y={cy + 5} textAnchor="middle" fontSize={12} fill={textFill} fontFamily="NotoSansJP">
              {node.label}
            </T>
            {arrowEl}
          </G>
        );
      })}
    </Svg>
  );
};

// ---- Logic Tree ----

const LogicTreeDiagram = ({ data }: { data: LogicTreeData }) => {
  const branches = data.branches.slice(0, 4);
  const totalItems = branches.reduce((acc, b) => acc + Math.max(1, b.children.length), 0);
  const itemH = 40;
  const paddingV = 20;
  const h = Math.max(totalItems * itemH + paddingV * 2, 120);
  const rootCy = h / 2;

  let currentY = paddingV;
  const branchYs = branches.map(b => {
    const childCount = Math.max(1, b.children.length);
    const bh = childCount * itemH;
    const by = currentY + bh / 2;
    currentY += bh;
    return by;
  });

  return (
    <Svg viewBox={`0 0 640 ${h}`} width={560} height={Math.min(h, 400)}>
      <Rect x={10} y={rootCy - 22} width={120} height={44} fill="#7c3aed" rx={4} />
      <T x={70} y={rootCy + 5} textAnchor="middle" fontSize={13} fill="white" fontFamily="NotoSansJP">
        {data.root}
      </T>

      {branches.map((branch, bi) => {
        const by = branchYs[bi];
        const children = branch.children.slice(0, 4);

        const branchStartY = branchYs
          .slice(0, bi)
          .reduce((acc, _, idx) => acc + Math.max(1, branches[idx].children.length) * itemH, paddingV);
        const childYs = children.map((_, ci) => branchStartY + ci * itemH + itemH / 2);

        return (
          <G key={bi}>
            <Path
              d={`M 130 ${rootCy} H 155 V ${by} H 180`}
              stroke="#7c3aed"
              strokeWidth={1.5}
              fill="none"
            />
            <Rect x={180} y={by - 20} width={120} height={40} fill="white" stroke="#7c3aed" strokeWidth={1.5} rx={3} />
            <T x={240} y={by + 5} textAnchor="middle" fontSize={12} fill="#1e1b4b" fontFamily="NotoSansJP">
              {branch.label}
            </T>

            {childYs.map((sy, ci) => (
              <G key={ci}>
                <Path
                  d={`M 300 ${by} H 330 V ${sy} H 360`}
                  stroke="rgba(124,58,237,0.5)"
                  strokeWidth={1}
                  fill="none"
                />
                <Rect x={360} y={sy - 18} width={130} height={36} fill="rgba(124,58,237,0.1)" stroke="rgba(124,58,237,0.3)" rx={3} />
                <T x={425} y={sy + 5} textAnchor="middle" fontSize={11} fill="#1e1b4b" fontFamily="NotoSansJP">
                  {children[ci]}
                </T>
              </G>
            ))}
          </G>
        );
      })}
    </Svg>
  );
};

// ---- Bar Chart ----

const BarChartDiagram = ({ data }: { data: BarChartData }) => {
  const chartX = 60, chartY = 20, chartW = 400, chartH = 240;
  const maxVal = Math.max(...data.values, 100);
  const n = data.values.length;
  const barW = (chartW / n) * 0.6;
  const gap = (chartW / n) * 0.4;
  const gridLines = [0.25, 0.5, 0.75, 1];

  return (
    <Svg viewBox="0 0 500 320" width={440} height={281}>
      {gridLines.map((pct, i) => {
        const y = chartY + chartH - chartH * pct;
        return (
          <G key={i}>
            <Line x1={chartX} y1={y} x2={chartX + chartW} y2={y} stroke="#e5e7eb" strokeWidth={1} />
            <T x={chartX - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#9ca3af" fontFamily="NotoSansJP">
              {String(Math.round(maxVal * pct))}
            </T>
          </G>
        );
      })}
      <Line x1={chartX} y1={chartY} x2={chartX} y2={chartY + chartH} stroke="#9ca3af" strokeWidth={1} />
      <Line x1={chartX} y1={chartY + chartH} x2={chartX + chartW} y2={chartY + chartH} stroke="#9ca3af" strokeWidth={1} />

      {data.values.map((val, i) => {
        const bh = (val / maxVal) * chartH;
        const bx = chartX + i * (chartW / n) + gap / 2;
        const by = chartY + chartH - bh;
        const labelX = bx + barW / 2;
        return (
          <G key={i}>
            <Rect x={bx} y={by} width={barW} height={bh} fill={data.barColor} />
            <T x={labelX} y={by - 4} textAnchor="middle" fontSize={11} fill={data.barColor} fontFamily="NotoSansJP">
              {String(val)}
            </T>
            <T x={labelX} y={chartY + chartH + 14} textAnchor="middle" fontSize={11} fill="#374151" fontFamily="NotoSansJP">
              {data.xLabels[i] ?? ''}
            </T>
          </G>
        );
      })}
    </Svg>
  );
};

// ---- Line Chart ----

const LINE_COLORS = ['#7c3aed', '#4f46e5', '#db2777', '#d97706', '#16a34a'];

const LineChartDiagram = ({ data }: { data: LineChartData }) => {
  const chartX = 60, chartY = 20, chartW = 400, chartH = 240;
  const allVals = data.series.flatMap(s => s.values);
  const maxVal = Math.max(...allVals, 100);
  const n = data.xLabels.length;
  const stepX = n > 1 ? chartW / (n - 1) : chartW;
  const gridLines = [0.25, 0.5, 0.75, 1];

  const getX = (i: number) => chartX + i * stepX;
  const getY = (v: number) => chartY + chartH - (v / maxVal) * chartH;

  return (
    <Svg viewBox="0 0 500 320" width={440} height={281}>
      {gridLines.map((pct, i) => {
        const y = chartY + chartH - chartH * pct;
        return (
          <G key={i}>
            <Line x1={chartX} y1={y} x2={chartX + chartW} y2={y} stroke="#e5e7eb" strokeWidth={1} />
            <T x={chartX - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#9ca3af" fontFamily="NotoSansJP">
              {String(Math.round(maxVal * pct))}
            </T>
          </G>
        );
      })}
      <Line x1={chartX} y1={chartY} x2={chartX} y2={chartY + chartH} stroke="#9ca3af" strokeWidth={1} />
      <Line x1={chartX} y1={chartY + chartH} x2={chartX + chartW} y2={chartY + chartH} stroke="#9ca3af" strokeWidth={1} />

      {data.xLabels.map((lbl, i) => (
        <T key={i} x={getX(i)} y={chartY + chartH + 14} textAnchor="middle" fontSize={11} fill="#374151" fontFamily="NotoSansJP">
          {lbl}
        </T>
      ))}

      {data.series.map((series, si) => {
        const color = LINE_COLORS[si % LINE_COLORS.length];
        const pathD = series.values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(v)}`).join(' ');
        return (
          <G key={si}>
            <Path d={pathD} stroke={color} strokeWidth={2} fill="none" />
            {series.values.map((v, i) => (
              <Circle key={i} cx={getX(i)} cy={getY(v)} r={3} fill={color} />
            ))}
            <Circle cx={chartX + si * 90} cy={chartY + chartH + 34} r={4} fill={color} />
            <T x={chartX + si * 90 + 8} y={chartY + chartH + 38} fontSize={10} fill="#374151" fontFamily="NotoSansJP">
              {series.name}
            </T>
          </G>
        );
      })}
    </Svg>
  );
};

// ---- Image ----

const ImageDiagram = ({ data }: { data: ImageData }) => {
  if (!data.src) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <Image src={data.src} style={{ maxWidth: 760, maxHeight: 340, objectFit: 'contain' } as any} />;
};

// ---- Main export ----

export const DiagramBlock = ({ diagram }: { diagram: DiagramData }) => {
  switch (diagram.kind) {
    case 'venn':        return <VennDiagram data={diagram} />;
    case 'matrix4':     return <Matrix4Diagram data={diagram} />;
    case 'matrix9':     return <Matrix9Diagram data={diagram} />;
    case 'pyramid':     return <PyramidDiagram data={diagram} />;
    case 'flowchart':   return <FlowchartDiagram data={diagram} />;
    case 'logic-tree':  return <LogicTreeDiagram data={diagram} />;
    case 'bar-chart':   return <BarChartDiagram data={diagram} />;
    case 'line-chart':  return <LineChartDiagram data={diagram} />;
    case 'image':       return <ImageDiagram data={diagram} />;
    default:            return null;
  }
};

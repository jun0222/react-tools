export const FLOW_COLORS: Record<string, { bg: string; text: string }> = {
  blue:   { bg: '#3b82f6', text: '#fff' },
  green:  { bg: '#10b981', text: '#fff' },
  red:    { bg: '#ef4444', text: '#fff' },
  orange: { bg: '#f97316', text: '#fff' },
  purple: { bg: '#a855f7', text: '#fff' },
  cyan:   { bg: '#06b6d4', text: '#fff' },
};

export interface FlowEdge {
  from: string;
  to: string;
  label?: string;
}

export interface FlowParsed {
  nodes: Map<string, string>;
  edges: FlowEdge[];
  order: string[];
}

const parseNodeColor = (s: string): [string, string] => {
  const m = s.match(/^(.+?)\s*\[(\w+)\]\s*$/);
  return m ? [m[1].trim(), m[2]] : [s.trim(), ''];
};

export const parseFlowDSL = (code: string): FlowParsed => {
  const nodes = new Map<string, string>();
  const edges: FlowEdge[] = [];
  const order: string[] = [];

  const addNode = (id: string, color: string) => {
    if (!nodes.has(id)) { nodes.set(id, color); order.push(id); }
    else if (color) nodes.set(id, color);
  };

  for (const raw of code.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    const arrowIdx = line.indexOf('->');
    if (arrowIdx !== -1) {
      const fromRaw = line.slice(0, arrowIdx).trim();
      const rest    = line.slice(arrowIdx + 2).trim();
      const colonIdx = rest.indexOf(':');
      const toRaw  = colonIdx !== -1 ? rest.slice(0, colonIdx).trim() : rest.trim();
      const label  = colonIdx !== -1 ? rest.slice(colonIdx + 1).trim() : undefined;

      const [fromId, fromColor] = parseNodeColor(fromRaw);
      const [toId,   toColor]   = parseNodeColor(toRaw);
      addNode(fromId, fromColor);
      addNode(toId,   toColor);
      edges.push({ from: fromId, to: toId, label });
    } else {
      const [id, color] = parseNodeColor(line);
      if (id) addNode(id, color);
    }
  }

  return { nodes, edges, order };
};

const NODE_W = 140;
const NODE_H = 42;
const H_GAP  = 24;
const V_GAP  = 56;
const PAD    = 24;

const assignLayers = (nodes: Map<string, string>, edges: FlowEdge[], order: string[]): Map<string, number> => {
  const layers = new Map<string, number>();
  const inDegrees = new Map<string, number>(Array.from(nodes.keys()).map(k => [k, 0]));

  for (const e of edges) {
    if (inDegrees.has(e.to)) inDegrees.set(e.to, (inDegrees.get(e.to) ?? 0) + 1);
  }

  const queue: string[] = [];
  for (const id of order) {
    if ((inDegrees.get(id) ?? 0) === 0) { queue.push(id); layers.set(id, 0); }
  }
  if (queue.length === 0 && order.length > 0) { queue.push(order[0]); layers.set(order[0], 0); }

  let qi = 0;
  const visited = new Set<string>(queue);
  while (qi < queue.length) {
    const curr = queue[qi++];
    const currLayer = layers.get(curr) ?? 0;
    for (const e of edges) {
      if (e.from !== curr) continue;
      const next = e.to;
      const nextLayer = Math.max(layers.get(next) ?? 0, currLayer + 1);
      layers.set(next, nextLayer);
      if (!visited.has(next)) { visited.add(next); queue.push(next); }
    }
  }

  for (const id of nodes.keys()) { if (!layers.has(id)) layers.set(id, 0); }
  return layers;
};

export const renderFlowSVG = (parsed: FlowParsed, dark: boolean): string => {
  const { nodes, edges, order } = parsed;
  if (nodes.size === 0) return '';

  const layers = assignLayers(nodes, edges, order);

  const layerGroups = new Map<number, string[]>();
  for (const [id, layer] of layers) {
    if (!layerGroups.has(layer)) layerGroups.set(layer, []);
    layerGroups.get(layer)!.push(id);
  }
  const maxLayer = Math.max(...layers.values(), 0);

  const positions = new Map<string, { x: number; y: number }>();

  for (let l = 0; l <= maxLayer; l++) {
    const group = (layerGroups.get(l) ?? []).sort((a, b) => order.indexOf(a) - order.indexOf(b));
    const rowW = group.length * NODE_W + (group.length - 1) * H_GAP;
    for (let i = 0; i < group.length; i++) {
      const x = i * (NODE_W + H_GAP) + NODE_W / 2 - rowW / 2;
      const y = l * (NODE_H + V_GAP) + NODE_H / 2;
      positions.set(group[i], { x, y });
    }
  }

  const allX = Array.from(positions.values()).map(p => p.x);
  const allY = Array.from(positions.values()).map(p => p.y);
  const minX = Math.min(...allX) - NODE_W / 2 - PAD;
  const maxX = Math.max(...allX) + NODE_W / 2 + PAD;
  const minY = Math.min(...allY) - NODE_H / 2 - PAD;
  const maxY = Math.max(...allY) + NODE_H / 2 + PAD;
  const W = maxX - minX;
  const H = maxY - minY;

  const tx = (x: number) => (x - minX).toFixed(1);
  const ty = (y: number) => (y - minY).toFixed(1);

  const bg        = dark ? '#0d0d14' : '#f4f6fa';
  const edgeColor = dark ? '#555'    : '#aaa';
  const defText   = dark ? '#e0e0e0' : '#1a1a2e';
  const defBg     = dark ? '#374151' : '#e5e7eb';

  const svgLines: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W.toFixed(1)} ${H.toFixed(1)}" width="${W.toFixed(1)}" height="${H.toFixed(1)}">`,
    `<rect width="${W.toFixed(1)}" height="${H.toFixed(1)}" fill="${bg}" rx="8"/>`,
    `<defs><marker id="arr" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0,9 3.5,0 7" fill="${edgeColor}"/></marker></defs>`,
  ];

  // Draw edges
  for (const e of edges) {
    const from = positions.get(e.from);
    const to   = positions.get(e.to);
    if (!from || !to) continue;

    const x1 = from.x;
    const y1 = from.y + NODE_H / 2;
    const x2 = to.x;
    const y2 = to.y - NODE_H / 2 - 9;

    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;

    if (Math.abs(y2 - y1) < 10) {
      const ex1 = from.x + NODE_W / 2;
      const ey1 = from.y;
      const ex2 = to.x - NODE_W / 2 - 9;
      const ey2 = to.y;
      svgLines.push(`<path d="M ${tx(ex1)} ${ty(ey1)} C ${tx(ex1 + 30)} ${ty(ey1)} ${tx(ex2 - 30)} ${ty(ey2)} ${tx(ex2)} ${ty(ey2)}" fill="none" stroke="${edgeColor}" stroke-width="1.5" marker-end="url(#arr)"/>`);
      if (e.label) svgLines.push(`<text x="${tx(mx)}" y="${ty(my) - 6}" text-anchor="middle" font-size="11" fill="${defText}" font-family="sans-serif">${e.label}</text>`);
    } else {
      svgLines.push(`<path d="M ${tx(x1)} ${ty(y1)} C ${tx(x1)} ${ty(my)} ${tx(x2)} ${ty(my)} ${tx(x2)} ${ty(y2)}" fill="none" stroke="${edgeColor}" stroke-width="1.5" marker-end="url(#arr)"/>`);
      if (e.label) svgLines.push(`<text x="${tx(mx)}" y="${ty(my) - 6}" text-anchor="middle" font-size="11" fill="${defText}" font-family="sans-serif">${e.label}</text>`);
    }
  }

  // Draw nodes
  for (const [id] of nodes) {
    const pos = positions.get(id);
    if (!pos) continue;
    const { x, y } = pos;
    const nx = x - NODE_W / 2;
    const ny = y - NODE_H / 2;
    const colorKey = nodes.get(id) ?? '';
    const color = FLOW_COLORS[colorKey];
    const bg2  = color ? color.bg  : defBg;
    const fg   = color ? color.text : defText;

    svgLines.push(`<rect x="${tx(nx)}" y="${ty(ny)}" width="${NODE_W}" height="${NODE_H}" rx="8" fill="${bg2}"/>`);
    svgLines.push(`<text x="${tx(x)}" y="${ty(y + 5)}" text-anchor="middle" font-size="13" font-weight="600" fill="${fg}" font-family="sans-serif">${id}</text>`);
  }

  svgLines.push('</svg>');
  return svgLines.join('\n');
};

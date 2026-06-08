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

// Pentagon dimensions
const NODE_W  = 156;
const NODE_H  = 48;
const ARROW_D = 22;  // depth of right-pointing tip
const COL_GAP = -ARROW_D;  // overlap so tip sits inside the next node
const ROW_GAP = 10;  // vertical gap within a layer
const PAD     = 20;

// Assign layers (topological — layer = longest path from source)
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

// Pentagon polygon points string (centered at cx, cy)
const pentagonPoints = (cx: number, cy: number): string => {
  const l = cx - NODE_W / 2;
  const r = cx + NODE_W / 2;
  const t = cy - NODE_H / 2;
  const b = cy + NODE_H / 2;
  return [
    `${l},${t}`,
    `${r - ARROW_D},${t}`,
    `${r},${cy}`,
    `${r - ARROW_D},${b}`,
    `${l},${b}`,
  ].join(' ');
};

export const renderFlowSVG = (parsed: FlowParsed, dark: boolean): string => {
  const { nodes, edges, order } = parsed;
  if (nodes.size === 0) return '';

  const layers = assignLayers(nodes, edges, order);

  // Group nodes by layer, sorted by original order within each layer
  const layerGroups = new Map<number, string[]>();
  for (const [id, layer] of layers) {
    if (!layerGroups.has(layer)) layerGroups.set(layer, []);
    layerGroups.get(layer)!.push(id);
  }
  for (const group of layerGroups.values()) {
    group.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  }

  const maxLayer = Math.max(...layers.values(), 0);

  // Compute positions: horizontal layout (layer = column, index = row)
  const positions = new Map<string, { x: number; y: number }>();

  for (let col = 0; col <= maxLayer; col++) {
    const group = layerGroups.get(col) ?? [];
    for (let row = 0; row < group.length; row++) {
      const cx = col * (NODE_W + COL_GAP) + NODE_W / 2;
      const cy = row * (NODE_H + ROW_GAP) + NODE_H / 2;
      positions.set(group[row], { x: cx, y: cy });
    }
  }

  // Canvas size
  const allPos = Array.from(positions.values());
  const maxX = Math.max(...allPos.map(p => p.x)) + NODE_W / 2 + PAD;
  const maxY = Math.max(...allPos.map(p => p.y)) + NODE_H / 2 + PAD;
  const W = maxX + PAD;
  const H = maxY + PAD;

  const bg      = dark ? '#0d0d14' : '#f4f6fa';
  const defText = dark ? '#e0e0e0' : '#1a1a2e';
  const defBg     = dark ? '#374151' : '#dde1ea';

  const svgLines: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W.toFixed()} ${H.toFixed()}" width="${W.toFixed()}" height="${H.toFixed()}">`,
    `<rect width="${W.toFixed()}" height="${H.toFixed()}" fill="${bg}" rx="8"/>`,
  ];

  // Draw edge labels (no arrow lines — pentagons chain by overlap)
  for (const e of edges) {
    if (!e.label) continue;
    const fp = positions.get(e.from);
    const tp = positions.get(e.to);
    if (!fp || !tp) continue;
    const mx = (fp.x + tp.x) / 2;
    const my = (fp.y + tp.y) / 2;
    svgLines.push(`<text x="${mx.toFixed(1)}" y="${(my - 5).toFixed(1)}" text-anchor="middle" font-size="10" fill="${defText}" font-family="sans-serif" opacity="0.8">${e.label}</text>`);
  }

  // Draw pentagon nodes — higher layers first so left-side tips of earlier nodes appear on top
  const sortedIds = Array.from(nodes.keys()).sort((a, b) => (layers.get(b) ?? 0) - (layers.get(a) ?? 0));
  for (const id of sortedIds) {
    const pos = positions.get(id);
    if (!pos) continue;
    const { x: cx, y: cy } = pos;
    const colorKey = nodes.get(id) ?? '';
    const color = FLOW_COLORS[colorKey];
    const fill  = color ? color.bg   : defBg;
    const fg    = color ? color.text : defText;

    const pts = pentagonPoints(cx, cy);
    const label = id.length > 13 ? id.slice(0, 12) + '…' : id;

    svgLines.push(`<polygon points="${pts}" fill="${fill}"/>`);
    svgLines.push(`<text x="${(cx - ARROW_D / 4).toFixed(1)}" y="${(cy + 5).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="600" fill="${fg}" font-family="sans-serif">${label}</text>`);
  }

  svgLines.push('</svg>');
  return svgLines.join('\n');
};

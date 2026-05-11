// ---- Types ----

export type Direction = 'right' | 'down';

export interface TreeNode {
  label: string;
  children: TreeNode[];
}

export interface PositionedNode {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  children: PositionedNode[];
}

// ---- Parsing ----

const getIndentDepth = (line: string): number => {
  const m = line.match(/^(\s+)/);
  if (!m) return 0;
  // treat tab as 2 spaces
  const spaces = m[1].replace(/\t/g, '  ').length;
  return Math.floor(spaces / 2);
};

export const parseTree = (text: string): TreeNode | null => {
  const lines = text.split('\n').map(l => l.trimEnd()).filter(l => l.trim());
  if (!lines.length) return null;

  const root: TreeNode = { label: lines[0].trim(), children: [] };
  type Entry = { node: TreeNode; depth: number };
  const stack: Entry[] = [{ node: root, depth: 0 }];

  for (let i = 1; i < lines.length; i++) {
    const depth = getIndentDepth(lines[i]);
    const label = lines[i].trim();
    if (!label) continue;

    const node: TreeNode = { label, children: [] };

    while (stack.length > 1 && stack[stack.length - 1].depth >= depth) {
      stack.pop();
    }
    stack[stack.length - 1].node.children.push(node);
    stack.push({ node, depth });
  }

  return root;
};

// ---- Layout (right direction) ----

const BOX_W = 140;
const BOX_H = 36;
const H_GAP = 50;
const V_GAP = 12;

export const countLeaves = (node: TreeNode): number => {
  if (!node.children.length) return 1;
  return node.children.reduce((s, c) => s + countLeaves(c), 0);
};

const layoutH = (
  node: TreeNode,
  depth: number,
  startY: number,
): PositionedNode => {
  const slotH = BOX_H + V_GAP;
  const leaves = countLeaves(node);
  const totalH = leaves * slotH - V_GAP;
  const y = startY + (totalH - BOX_H) / 2;
  const x = 20 + depth * (BOX_W + H_GAP);

  let childY = startY;
  const children = node.children.map(child => {
    const positioned = layoutH(child, depth + 1, childY);
    childY += countLeaves(child) * slotH;
    return positioned;
  });

  return { label: node.label, x, y, w: BOX_W, h: BOX_H, children };
};

// ---- Layout (down direction) ----

const BOX_W_V = 120;
const BOX_H_V = 36;
const V_GAP_V = 50;
const H_GAP_V = 14;

const countLeavesForV = (node: TreeNode): number => countLeaves(node);

const layoutV = (
  node: TreeNode,
  depth: number,
  startX: number,
): PositionedNode => {
  const slotW = BOX_W_V + H_GAP_V;
  const leaves = countLeavesForV(node);
  const totalW = leaves * slotW - H_GAP_V;
  const x = startX + (totalW - BOX_W_V) / 2;
  const y = 20 + depth * (BOX_H_V + V_GAP_V);

  let childX = startX;
  const children = node.children.map(child => {
    const positioned = layoutV(child, depth + 1, childX);
    childX += countLeaves(child) * slotW;
    return positioned;
  });

  return { label: node.label, x, y, w: BOX_W_V, h: BOX_H_V, children };
};

export const layoutTree = (node: TreeNode, direction: Direction): PositionedNode =>
  direction === 'right' ? layoutH(node, 0, 20) : layoutV(node, 0, 20);

// ---- SVG generation ----

const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const collectNodes = (node: PositionedNode): PositionedNode[] => {
  const result: PositionedNode[] = [node];
  node.children.forEach(c => result.push(...collectNodes(c)));
  return result;
};

const collectEdges = (node: PositionedNode): [PositionedNode, PositionedNode][] => {
  const result: [PositionedNode, PositionedNode][] = [];
  node.children.forEach(c => {
    result.push([node, c]);
    result.push(...collectEdges(c));
  });
  return result;
};

export const generateSVG = (
  root: PositionedNode,
  dark: boolean,
  direction: Direction,
): string => {
  const allNodes = collectNodes(root);
  const edges = collectEdges(root);

  const maxRight = Math.max(...allNodes.map(n => n.x + n.w));
  const maxBottom = Math.max(...allNodes.map(n => n.y + n.h));
  const width = maxRight + 24;
  const height = maxBottom + 24;

  const bg = dark ? '#1a1a24' : '#f8f8fc';
  const boxFill = dark ? '#22222e' : '#ffffff';
  const boxStroke = dark ? '#3e3e5e' : '#d0d0e0';
  const textColor = dark ? '#e0e0e0' : '#1a1a2e';
  const lineColor = dark ? '#4e4e6e' : '#b0b0c8';
  const accentStroke = dark ? '#6366f1' : '#6366f1';

  const edgeSvg = edges.map(([p, c]) => {
    if (direction === 'right') {
      const x1 = p.x + p.w;
      const y1 = p.y + p.h / 2;
      const x2 = c.x;
      const y2 = c.y + c.h / 2;
      const mx = (x1 + x2) / 2;
      return `<path d="M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}" fill="none" stroke="${lineColor}" stroke-width="1.5"/>`;
    } else {
      const x1 = p.x + p.w / 2;
      const y1 = p.y + p.h;
      const x2 = c.x + c.w / 2;
      const y2 = c.y;
      const my = (y1 + y2) / 2;
      return `<path d="M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}" fill="none" stroke="${lineColor}" stroke-width="1.5"/>`;
    }
  });

  const isRoot = (n: PositionedNode) => n === root;

  const boxSvg = allNodes.map(n => {
    const isRootNode = isRoot(n);
    const fill = isRootNode ? accentStroke : boxFill;
    const stroke = isRootNode ? accentStroke : boxStroke;
    const txtColor = isRootNode ? '#fff' : textColor;
    // truncate long labels for display
    const label = n.label.length > 18 ? n.label.slice(0, 17) + '…' : n.label;
    return `<g>
  <rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="6" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
  <text x="${n.x + n.w / 2}" y="${n.y + n.h / 2}" text-anchor="middle" dominant-baseline="middle" fill="${txtColor}" font-size="11" font-family="system-ui,sans-serif">${escapeXml(label)}</text>
</g>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" style="background:${bg};display:block">
${edgeSvg.join('\n')}
${boxSvg.join('\n')}
</svg>`;
};
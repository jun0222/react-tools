// --- Types ---

export interface ErdField {
  id: string;
  name: string;
  type: string;
  isPK: boolean;
  isFK: boolean;
  nullable: boolean;
}

export interface ErdEntityData {
  name: string;
  fields: ErdField[];
}

export interface ErdNode {
  id: string;
  position: { x: number; y: number };
  data: ErdEntityData;
}

export interface ErdEdge {
  id: string;
  source: string;
  target: string;
  data?: { relation: string };
}

// --- UID ---
export const uid = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

// --- Mermaid ERD export ---

const MERMAID_RELATION: Record<string, string> = {
  '1:1': '||--||',
  '1:N': '||--o{',
  'N:N': '}o--o{',
};

export const toMermaid = (nodes: ErdNode[], edges: ErdEdge[]): string => {
  if (nodes.length === 0) return 'erDiagram';

  const entityLines = nodes.map(node => {
    const fields = node.data.fields
      .map(f => {
        const attrs: string[] = [];
        if (f.isPK) attrs.push('PK');
        if (f.isFK) attrs.push('FK');
        const attrsStr = attrs.length ? ' ' + attrs.join(',') : '';
        const name = f.name || 'field';
        return `    ${f.type} ${name}${attrsStr}`;
      })
      .join('\n');
    return `  ${node.data.name} {\n${fields}\n  }`;
  });

  const edgeLines = edges
    .map(edge => {
      const src = nodes.find(n => n.id === edge.source);
      const tgt = nodes.find(n => n.id === edge.target);
      if (!src || !tgt) return '';
      const rel = MERMAID_RELATION[edge.data?.relation ?? '1:N'] ?? '||--o{';
      return `  ${src.data.name} ${rel} ${tgt.data.name} : ""`;
    })
    .filter(Boolean);

  const parts = ['erDiagram', entityLines.join('\n\n')];
  if (edgeLines.length) parts.push(edgeLines.join('\n'));
  return parts.join('\n\n');
};

// --- DrawIO XML export ---

const escXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const toDrawIo = (nodes: ErdNode[], edges: ErdEdge[]): string => {
  const ROW_H = 30;
  const HEADER_H = 40;
  const WIDTH = 220;

  const nodeCells = nodes.flatMap(node => {
    const height = HEADER_H + node.data.fields.length * ROW_H;
    const entity = `<mxCell id="${node.id}" value="${escXml(node.data.name)}"
      style="shape=table;startSize=${HEADER_H};container=1;collapsible=0;childLayout=tableLayout;fixedRows=1;rowLines=0;fontStyle=1;align=center;resizeLast=1;fontSize=13;"
      vertex="1" parent="1">
      <mxGeometry x="${node.position.x}" y="${node.position.y}" width="${WIDTH}" height="${height}" as="geometry"/>
    </mxCell>`;

    const fieldCells = node.data.fields.map((f, i) => {
      const label = `${escXml(f.name)}: ${escXml(f.type)}${f.isPK ? ' [PK]' : ''}${f.isFK ? ' [FK]' : ''}${f.nullable ? '?' : ''}`;
      const isLast = i === node.data.fields.length - 1;
      return `<mxCell id="${f.id}" value="${label}"
      style="shape=tableRow;horizontal=0;startSize=0;swimlaneHead=0;fillColor=none;collapsible=0;dropTarget=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;fontSize=12;top=0;left=0;right=0;bottom=${isLast ? 0 : 1};"
      vertex="1" parent="${node.id}">
      <mxGeometry y="${HEADER_H + i * ROW_H}" width="${WIDTH}" height="${ROW_H}" as="geometry"/>
    </mxCell>`;
    });

    return [entity, ...fieldCells];
  });

  const edgeCells = edges.map(edge => {
    const rel = edge.data?.relation ?? '1:N';
    const style = rel === '1:1'
      ? 'edgeStyle=entityRelationEdgeStyle;endArrow=ERmandOne;startArrow=ERmandOne;'
      : rel === 'N:N'
      ? 'edgeStyle=entityRelationEdgeStyle;endArrow=ERmanyToMany;startArrow=ERmanyToMany;'
      : 'edgeStyle=entityRelationEdgeStyle;endArrow=ERzeroToMany;startArrow=ERmandOne;';
    return `<mxCell id="${edge.id}" value="${escXml(rel)}"
      style="${style}fontSize=11;html=1;"
      edge="1" source="${edge.source}" target="${edge.target}" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>`;
  });

  const allCells = [...nodeCells, ...edgeCells].join('\n    ');

  return `<mxfile>
  <diagram name="ERD">
    <mxGraphModel grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
    ${allCells}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;
};

// --- Download helper ---
export const downloadText = (content: string, filename: string, mime = 'text/plain') => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
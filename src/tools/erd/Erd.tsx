import { useState, useCallback, useRef } from 'react';
import {
  ReactFlow, Background, Controls, MiniMap,
  useNodesState, useEdgesState, addEdge,
  type Connection, type Node, type Edge,
} from '@xyflow/react';
import { toSvg } from 'html-to-image';
import '@xyflow/react/dist/style.css';
import { useTheme } from '../../context/ThemeContext';
import {
  uid, toMermaid, toDrawIo, downloadText,
  type ErdEntityData, type ErdField, type ErdNode, type ErdEdge,
} from './helpers';
import EntityNode from './EntityNode';
import './Erd.css';

const NODE_TYPES = { erdEntity: EntityNode };

const FIELD_TYPES = ['int', 'bigint', 'varchar', 'text', 'boolean', 'date', 'datetime', 'timestamp', 'float', 'decimal', 'uuid'];

const Erd = () => {
  const { dark } = useTheme();
  const flowRef = useRef<HTMLDivElement>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editData, setEditData] = useState<ErdEntityData | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  // ===== Node operations =====
  const addEntity = () => {
    const id = uid();
    const offset = nodes.length * 40;
    const newNode: Node = {
      id,
      type: 'erdEntity',
      position: { x: 80 + offset, y: 80 + offset },
      data: { name: 'Entity', fields: [] } satisfies ErdEntityData,
    };
    setNodes(prev => [...prev, newNode]);
    // immediately open editor
    setSelectedId(id);
    setEditData(newNode.data as ErdEntityData);
  };

  const onConnect = useCallback((params: Connection) => {
    setEdges(prev => addEdge({
      ...params,
      type: 'smoothstep',
      animated: false,
      data: { relation: '1:N' },
      label: '1:N',
    }, prev));
  }, [setEdges]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedId(node.id);
    setEditData(node.data as ErdEntityData);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedId(null);
    setEditData(null);
  }, []);

  // ===== Edit panel =====
  const applyEdit = (data: ErdEntityData) => {
    setEditData(data);
    setNodes(prev => prev.map(n =>
      n.id === selectedId ? { ...n, data } : n
    ));
  };

  const addField = () => {
    if (!editData) return;
    const field: ErdField = {
      id: uid(), name: '', type: 'varchar',
      isPK: false, isFK: false, nullable: false,
    };
    applyEdit({ ...editData, fields: [...editData.fields, field] });
  };

  const updateField = (fid: string, patch: Partial<ErdField>) => {
    if (!editData) return;
    applyEdit({
      ...editData,
      fields: editData.fields.map(f => f.id === fid ? { ...f, ...patch } : f),
    });
  };

  const removeField = (fid: string) => {
    if (!editData) return;
    applyEdit({ ...editData, fields: editData.fields.filter(f => f.id !== fid) });
  };

  const deleteEntity = () => {
    if (!selectedId) return;
    setNodes(prev => prev.filter(n => n.id !== selectedId));
    setEdges(prev => prev.filter(e => e.source !== selectedId && e.target !== selectedId));
    setSelectedId(null);
    setEditData(null);
  };

  // ===== Edge relation toggle =====
  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    const CYCLE: Record<string, string> = { '1:N': 'N:N', 'N:N': '1:1', '1:1': '1:N' };
    const cur = (edge.data as { relation?: string })?.relation ?? '1:N';
    const next = CYCLE[cur] ?? '1:N';
    setEdges(prev => prev.map(e =>
      e.id === edge.id ? { ...e, label: next, data: { relation: next } } : e
    ));
  }, [setEdges]);

  // ===== Exports =====
  const getExportData = (): { nodes: ErdNode[]; edges: ErdEdge[] } => ({
    nodes: nodes.map(n => ({
      id: n.id,
      position: n.position,
      data: n.data as ErdEntityData,
    })),
    edges: edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      data: e.data as { relation: string },
    })),
  });

  const exportMermaid = () => {
    const { nodes: ns, edges: es } = getExportData();
    downloadText(toMermaid(ns, es), 'erd.md', 'text/markdown');
    showToast('Mermaid をエクスポートしました');
  };

  const exportDrawIo = () => {
    const { nodes: ns, edges: es } = getExportData();
    downloadText(toDrawIo(ns, es), 'erd.drawio', 'application/xml');
    showToast('DrawIO をエクスポートしました');
  };

  const exportSvg = async () => {
    const el = flowRef.current?.querySelector('.react-flow__viewport') as HTMLElement | null;
    if (!el) return;
    try {
      const svg = await toSvg(el, { backgroundColor: dark ? '#0f0f14' : '#f5f5f8' });
      downloadText(svg, 'erd.svg', 'image/svg+xml');
      showToast('SVG をエクスポートしました');
    } catch {
      showToast('SVG エクスポート失敗');
    }
  };

  const exportJson = () => {
    const data = getExportData();
    downloadText(JSON.stringify(data, null, 2), 'erd.json', 'application/json');
    showToast('JSON をエクスポートしました');
  };

  return (
    <div className={`erd-page ${dark ? 'dark' : 'light'}`}>
      <header className="erd-header">
        <div className="erd-logo">
          <div className="erd-logo-icon">🗂</div>
          <h1><span className="accent">ERD</span></h1>
        </div>
        <div className="erd-toolbar">
          <button className="erd-btn erd-btn-purple" onClick={addEntity}>
            + エンティティ
          </button>
          <div className="erd-export-group">
            <button className="erd-btn erd-btn-ghost" onClick={exportMermaid} title="Mermaid (.md)">Mermaid</button>
            <button className="erd-btn erd-btn-ghost" onClick={exportDrawIo} title="DrawIO (.drawio)">DrawIO</button>
            <button className="erd-btn erd-btn-ghost" onClick={exportSvg} title="SVG (.svg)">SVG</button>
            <button className="erd-btn erd-btn-ghost" onClick={exportJson} title="JSON (.json)">JSON</button>
          </div>
        </div>
      </header>

      <div className="erd-workspace">
        <div className="erd-flow-wrap" ref={flowRef}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            nodeTypes={NODE_TYPES}
            fitView
            colorMode={dark ? 'dark' : 'light'}
          >
            <Background />
            <Controls />
            <MiniMap nodeColor={dark ? '#a855f7' : '#7c3aed'} />
          </ReactFlow>

          {nodes.length === 0 && (
            <div className="erd-empty">
              <p>「+ エンティティ」でテーブルを追加</p>
              <p className="erd-hint">ノード右端 → 別ノード左端へドラッグでリレーションを作成<br/>エッジをクリックで関係種別を切替（1:N / N:N / 1:1）</p>
            </div>
          )}
        </div>

        {/* ===== EDIT PANEL ===== */}
        {selectedId && editData && (
          <aside className="erd-edit-panel">
            <div className="erd-edit-header">
              <input
                className="erd-entity-name-input"
                value={editData.name}
                onChange={e => applyEdit({ ...editData, name: e.target.value })}
                placeholder="エンティティ名"
                aria-label="エンティティ名"
              />
              <button className="erd-btn erd-btn-danger" onClick={deleteEntity} aria-label="エンティティを削除">
                削除
              </button>
            </div>

            <div className="erd-fields-header">
              <span>フィールド</span>
              <button className="erd-btn erd-btn-ghost erd-btn-sm" onClick={addField} aria-label="フィールドを追加">
                + 追加
              </button>
            </div>

            <div className="erd-fields">
              {editData.fields.map(f => (
                <div key={f.id} className="erd-field-row">
                  <input
                    className="erd-field-input"
                    value={f.name}
                    onChange={e => updateField(f.id, { name: e.target.value })}
                    placeholder="フィールド名"
                    aria-label="フィールド名"
                  />
                  <select
                    className="erd-field-select"
                    value={f.type}
                    onChange={e => updateField(f.id, { type: e.target.value })}
                    aria-label="フィールド型"
                  >
                    {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <label className="erd-field-check" title="Primary Key">
                    <input type="checkbox" checked={f.isPK} onChange={e => updateField(f.id, { isPK: e.target.checked })} aria-label="PK" />
                    PK
                  </label>
                  <label className="erd-field-check" title="Foreign Key">
                    <input type="checkbox" checked={f.isFK} onChange={e => updateField(f.id, { isFK: e.target.checked })} aria-label="FK" />
                    FK
                  </label>
                  <label className="erd-field-check" title="Nullable">
                    <input type="checkbox" checked={f.nullable} onChange={e => updateField(f.id, { nullable: e.target.checked })} aria-label="nullable" />
                    ?
                  </label>
                  <button
                    className="erd-btn erd-btn-ghost erd-btn-sm"
                    onClick={() => removeField(f.id)}
                    aria-label="フィールドを削除"
                  >×</button>
                </div>
              ))}
              {editData.fields.length === 0 && (
                <p className="erd-fields-empty">「+ 追加」でフィールドを追加</p>
              )}
            </div>
          </aside>
        )}
      </div>

      {toast && <div className="erd-toast">{toast}</div>}
    </div>
  );
};

export default Erd;

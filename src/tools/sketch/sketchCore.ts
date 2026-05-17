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

export const FLOW_DEFAULT = `flowchart TD
  A[開始] --> B{条件}
  B -->|はい| C[処理A]
  B -->|いいえ| D[処理B]
  C --> E[終了]
  D --> E`;

export const STATE_DEFAULT = `stateDiagram-v2
  [*] --> 待機
  待機 --> 実行中 : 開始
  実行中 --> 待機 : 完了
  実行中 --> エラー : 失敗
  エラー --> 待機 : リセット
  実行中 --> [*] : 終了`;

export const GRAPH_DEFAULT = `graph LR
  A[モジュールA] --> B[モジュールB]
  A --> C[モジュールC]
  B --> D[出力]
  C --> D`;

export const DIAGRAM_CONFIGS: Record<DiagramType, DiagramConfig> = {
  flow: {
    id: 'flow',
    name: 'フロー',
    defaultCode: FLOW_DEFAULT,
    snippets: [
      { label: '→ 矢印',    code: 'P[処理] --> Q[次の処理]',                                                                 desc: '基本の矢印' },
      { label: '条件分岐',  code: 'X{条件} -->|はい| Y[処理]\nX -->|いいえ| Z[処理]',                                        desc: 'yes/no分岐' },
      { label: 'ループ',    code: 'subgraph ループ\n  P[処理] --> Q{続行?}\n  Q -->|はい| P\n  Q -->|いいえ| R[終了]\nend', desc: '繰り返し' },
      { label: '並列',      code: 'A --> B & C',                                                                              desc: '並列処理' },
      { label: '破線',      code: 'A -.-> B',                                                                                 desc: '破線の矢印' },
      { label: 'グループ',  code: 'subgraph グループ名\n  A[処理A]\n  B[処理B]\nend',                                        desc: 'サブグラフ' },
    ],
  },
  state: {
    id: 'state',
    name: 'ステート',
    defaultCode: STATE_DEFAULT,
    snippets: [
      { label: '遷移',    code: '状態A --> 状態B : イベント',                              desc: '状態遷移' },
      { label: '開始',    code: '[*] --> 初期状態',                                        desc: '初期状態' },
      { label: '終了',    code: '状態 --> [*]',                                            desc: '終了状態' },
      { label: '並行',    code: 'state 並行処理 {\n  [*] --> A\n  --\n  [*] --> B\n}',   desc: '並行状態' },
      { label: '複合',    code: 'state 複合 {\n  A --> B\n  B --> C\n}',                  desc: '複合状態' },
    ],
  },
  graph: {
    id: 'graph',
    name: 'グラフ',
    defaultCode: GRAPH_DEFAULT,
    snippets: [
      { label: '→ 依存',   code: 'A[ノードA] --> B[ノードB]',                         desc: '依存・方向あり' },
      { label: '--- 関連', code: 'A --- B',                                             desc: '無向の関係' },
      { label: 'ラベル',   code: 'A --説明テキスト--> B',                               desc: 'ラベル付き矢印' },
      { label: 'グループ', code: 'subgraph グループ\n  A\n  B\nend',                   desc: 'グルーピング' },
      { label: 'ノード形', code: 'A([丸角])\nB{ひし形}\nC[(DB型)]',                   desc: 'ノード形状サンプル' },
    ],
  },
};

export const generateFilename = (ext: 'svg' | 'png'): string => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `sketch-${d.getFullYear()}_${pad(d.getMonth() + 1)}_${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}.${ext}`;
};

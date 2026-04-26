export interface Hint {
  syntax: string;
  desc: string;
}

export interface Template {
  id: string;
  label: string;
  code: string;
  hints: Hint[];
}

export const TEMPLATES: Template[] = [
  {
    id: 'flowchart',
    label: 'フロー',
    code: `flowchart TD
    A[開始] --> B{条件}
    B -->|はい| C[処理A]
    B -->|いいえ| D[処理B]
    C --> E[終了]
    D --> E`,
    hints: [
      { syntax: 'A[テキスト]',    desc: '四角形ノード' },
      { syntax: 'A(テキスト)',    desc: '角丸ノード' },
      { syntax: 'A{テキスト}',   desc: 'ひし形（条件）' },
      { syntax: 'A((テキスト))', desc: '円形ノード' },
      { syntax: 'A --> B',       desc: '矢印' },
      { syntax: 'A -->|ラベル| B', desc: 'ラベル付き矢印' },
      { syntax: 'A --- B',       desc: '線（矢印なし）' },
      { syntax: 'A -.-> B',      desc: '点線矢印' },
      { syntax: 'subgraph 名前\n  ...\nend', desc: 'サブグラフ' },
    ],
  },
  {
    id: 'sequence',
    label: 'シーケンス',
    code: `sequenceDiagram
    participant ユーザー
    participant サーバー
    ユーザー->>サーバー: リクエスト送信
    activate サーバー
    サーバー-->>ユーザー: レスポンス返却
    deactivate サーバー`,
    hints: [
      { syntax: 'participant A',     desc: '参加者を宣言' },
      { syntax: 'A->>B: メッセージ', desc: '実線矢印（同期）' },
      { syntax: 'A-->>B: メッセージ', desc: '点線矢印（返信）' },
      { syntax: 'A-xB: メッセージ',  desc: 'X付き矢印（失敗）' },
      { syntax: 'activate A / deactivate A', desc: 'アクティブ状態' },
      { syntax: 'Note over A,B: テキスト', desc: 'ノート' },
      { syntax: 'loop 名前\n  ...\nend',   desc: 'ループ' },
      { syntax: 'alt 条件\n  ...\nelse\n  ...\nend', desc: '条件分岐' },
    ],
  },
  {
    id: 'class',
    label: 'クラス図',
    code: `classDiagram
    class Animal {
      +String name
      +int age
      +speak() void
    }
    class Dog {
      +String breed
      +fetch() void
    }
    Animal <|-- Dog : 継承`,
    hints: [
      { syntax: 'class Foo { }',           desc: 'クラス定義' },
      { syntax: '+field Type',             desc: 'public フィールド' },
      { syntax: '-field Type',             desc: 'private フィールド' },
      { syntax: '#field Type',             desc: 'protected フィールド' },
      { syntax: '+method() ReturnType',    desc: 'public メソッド' },
      { syntax: 'A <|-- B : ラベル',      desc: 'B は A を継承' },
      { syntax: 'A *-- B',                desc: 'コンポジション' },
      { syntax: 'A o-- B',                desc: 'アグリゲーション' },
      { syntax: 'A --> B',                desc: '関連' },
    ],
  },
  {
    id: 'er',
    label: 'ER図',
    code: `erDiagram
    USER {
      int id PK
      string name
      string email
    }
    ORDER {
      int id PK
      int userId FK
      date createdAt
    }
    USER ||--o{ ORDER : "持つ"`,
    hints: [
      { syntax: 'ENTITY { type field }',  desc: 'エンティティ定義' },
      { syntax: 'field PK',               desc: '主キー' },
      { syntax: 'field FK',               desc: '外部キー' },
      { syntax: 'A ||--|| B : ""',        desc: '1対1' },
      { syntax: 'A ||--o{ B : ""',        desc: '1対多' },
      { syntax: 'A }o--o{ B : ""',        desc: '多対多' },
      { syntax: 'A |o--o| B : ""',        desc: '0または1対0または1' },
    ],
  },
  {
    id: 'state',
    label: '状態遷移',
    code: `stateDiagram-v2
    [*] --> 待機
    待機 --> 処理中 : 開始
    処理中 --> 完了 : 成功
    処理中 --> エラー : 失敗
    完了 --> [*]
    エラー --> 待機 : リトライ`,
    hints: [
      { syntax: '[*] --> State',           desc: '開始状態から遷移' },
      { syntax: 'State --> [*]',           desc: '終了状態へ遷移' },
      { syntax: 'A --> B : イベント',      desc: '遷移' },
      { syntax: 'state "ラベル" as ID',   desc: '別名ラベル' },
      { syntax: 'state S {\n  ...\n}',    desc: '複合状態' },
      { syntax: '--',                      desc: '並行状態の区切り' },
    ],
  },
];

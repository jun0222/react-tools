export interface PageMeta {
  title: string;
  description: string;
}

export const PAGE_META: Record<string, PageMeta> = {
  '/': {
    title: 'react-tools',
    description: '便利なテキストツール集。プロンプト管理・テキストマスクなど。',
  },
  '/oneshot': {
    title: 'OneShot - Prompt Manager ⚡',
    description: 'ワンショットで決めるプロンプト管理ツール。保存・編集・蒸留・検証をこの1画面で。',
  },
  '/phantom': {
    title: 'Phantom - Text Mask & Transform 🪄',
    description: 'KMP置換・LCGランダム変換によるテキストマスクツール。',
  },
  '/forge': {
    title: 'Forge - Text Transformer ⚒️',
    description: 'PascalCase / camelCase / snake_case / kebab-case 変換とMDラッパーで素早くテキスト加工。',
  },
  '/erd': {
    title: 'ERD - Entity Relationship Diagram 🗂',
    description: 'ReactFlow で ER図を作成。Mermaid / DrawIO / SVG / JSON にエクスポート対応。',
  },
  '/mermaid': {
    title: 'Mermaid Editor 📊',
    description: 'テンプレートとカンペ付きの Mermaid ダイアグラムエディタ。フロー・シーケンス・ER図など。',
  },
  '/blueprint': {
    title: 'Blueprint 🗺️',
    description: '機能要件・ブラックボックステスト・非機能要件・テスト戦略を整理するプロダクト開発計画ツール。',
  },
  '/pacer': {
    title: 'Pacer ⚡',
    description: '6秒/ページ基準のスピードリーダー。段落・行・N文字で分割して高速に読み込む。',
  },
  '/clips': {
    title: 'Clips 📋',
    description: 'コピペして使えるスニペット集。Claude スクリーンショット・DOM ダンプなどを収録。',
  },
};
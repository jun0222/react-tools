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
};
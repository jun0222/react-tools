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
  '/romaji': {
    title: 'ローマ字 → ひらがな',
    description: '全探索アルゴリズムによるローマ字からひらがなへの変換。変換しない範囲を複数指定可能。',
  },
  '/draft': {
    title: 'Draft - チャット下書き ✍️',
    description: 'マインドマップで論点整理 → 文章を組み立て → チャット適性を指標でチェック。',
  },
  '/todo': {
    title: 'Todo - todo.txt Manager ✅',
    description: 'todo.txt フォーマットで優先度・プロジェクト・コンテキストを管理するタスクマネージャー。',
  },
  '/stencil': {
    title: 'Stencil - Template Filler 📋',
    description: '%%PLACEHOLDER%%形式の変数を埋め込んだテンプレートに値を流し込んで、安定したフォーマットでドキュメント作成。',
  },
  '/minutes': {
    title: 'Minutes - 議事録ツール 📝',
    description: 'コンサル型議事録。アジェンダ・決定事項・ネクストアクション（担当者/期日）をMarkdownで出力。MECE/So What観点を補助。',
  },
  '/logtree': {
    title: 'LogTree - ロジックツリー 🌳',
    description: 'インデントされたテキストを右向き・下向きのロジックツリーSVGに変換して可視化する。',
  },
  '/visu': {
    title: 'Visu - データ可視化 📈',
    description: 'CSVを棒グラフ・テーブルに変換。比較マトリクスをMarkdown形式でコピー。',
  },
  '/bookmarks': {
    title: 'Bookmarks - ブックマーク管理 🔖',
    description: 'URLをタグ付きで保存・検索。JSONファイルでインポート/エクスポート対応。',
  },
  '/snip': {
    title: 'Snip - スニペット管理 ✂️',
    description: 'テキストを登録してワンクリックでコピー。検索対応のシンプルスニペット管理ツール。',
  },
  '/wordmemo': {
    title: 'WordMemo - 単語メモ 📚',
    description: '気になった単語・概念をメモして、AIエージェント向け文献リサーチプロンプトを自動生成・コピー。',
  },
  '/errlog': {
    title: 'ErrLog - エラー管理 🐛',
    description: 'エラーを貼り付けてLLM向けプロンプトを生成。Mermaidフローチャート付きの返答を記録・検索・再利用。',
  },
  '/diary': {
    title: 'Diary - 日記ツール 📔',
    description: '日記を箇条書きに変換。LLMでサマリ・キーワードを生成してASCII art形式の.txtとして保存。',
  },
  '/sketch': {
    title: 'Sketch - ビジュアル思考 🖊',
    description: 'フロー・ステートマシン・グラフを雑な記述で素早く描く。SVG/PNGエクスポート対応。',
  },
  '/commit': {
    title: 'Commit Message 🔖',
    description: 'type(scope): description 形式のコミットメッセージを組み立てるツール。履歴をJSON保存・エクスポート対応。',
  },
  '/args': {
    title: 'Args - コマンド変数エディタ 🖥',
    description: 'コマンドをスペースで分割しインデックス指定でトークンを置換。Diff確認付き。',
  },
  '/pad': {
    title: 'Pad 📄',
    description: 'ただのテキストパッド。',
  },
  '/slideshow': {
    title: 'Slideshow - スライドアウトライン',
    description: 'スライドショーのアウトラインをグラフィカルに編集。JSON保存・エクスポート、ASCIIアート書き出し対応。',
  },
  '/shinsho': {
    title: 'Shinsho - 書籍プロンプト 📚',
    description: '信頼できる新書・文庫レーベルを絞り込んでLLMに渡すプロンプトを生成するツール。',
  },
  '/prose': {
    title: 'Prose - 文書構成ツール ✍️',
    description: '貼り付けた文書をLLMで書き直すプロンプトを生成。90/70/50/30%の4案を出力。',
  },
  '/insight': {
    title: 'Insight - 洞察プロンプト 💡',
    description: 'テーマを入力し、洞察を深める観点を選んでLLM向けプロンプトを生成するツール。',
  },
  '/meal': {
    title: 'Meal - 食事ログ & アドバイス 🥗',
    description: '食べたものを入力してLLMにアドバイスをもらい、食事とアドバイスをセットでASCIIアートのテキストファイルに保存。',
  },
};
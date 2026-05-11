import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import './Home.css';

const tools: { path: string; name: string; icon: string; iconBg: string; desc: string; tag: string; hidden?: true }[] = [
  {
    path: '/oneshot',
    name: 'OneShot',
    icon: '⚡',
    iconBg: 'linear-gradient(135deg, #ff2d7b, #a855f7)',
    desc: 'プロンプトを保存・編集・蒸留・検証する1画面ツール',
    tag: 'prompt',
  },
  {
    path: '/phantom',
    name: 'Phantom',
    icon: '🪄',
    iconBg: 'linear-gradient(135deg, #00ffe7, #0a5eaa)',
    desc: 'KMP置換・LCGランダム変換によるテキストマスクツール',
    tag: 'text',
  },
  {
    path: '/forge',
    name: 'Forge',
    icon: '⚒️',
    iconBg: 'linear-gradient(135deg, #f97316, #ef4444)',
    desc: 'PascalCase / camelCase / snake_case / kebab-case 変換 ＋ MDラッパー',
    tag: 'text',
  },
  {
    path: '/erd',
    name: 'ERD',
    icon: '🗂',
    iconBg: 'linear-gradient(135deg, #a855f7, #6366f1)',
    desc: 'ReactFlow で ER図を作成。Mermaid / DrawIO / SVG / JSON でエクスポート',
    tag: 'diagram',
    hidden: true,
  },
  {
    path: '/mermaid',
    name: 'Mermaid',
    icon: '📊',
    iconBg: 'linear-gradient(135deg, #a855f7, #6366f1)',
    desc: 'テンプレート＋カンペ付き Mermaid エディタ。フロー・シーケンス・ER図など7種類',
    tag: 'diagram',
  },
  {
    path: '/blueprint',
    name: 'Blueprint',
    icon: '🗺️',
    iconBg: 'linear-gradient(135deg, #3b82f6, #6366f1)',
    desc: '機能要件・BBテスト・非機能要件・テスト戦略を整理する開発計画ツール',
    tag: 'plan',
    hidden: true,
  },
  {
    path: '/pacer',
    name: 'Pacer',
    icon: '⚡',
    iconBg: 'linear-gradient(135deg, #10b981, #0d9488)',
    desc: 'テキストを段落/行/N文字で分割して一定ペースで読む スピードリーダー',
    tag: 'read',
    hidden: true,
  },
  {
    path: '/clips',
    name: 'Clips',
    icon: '📋',
    iconBg: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    desc: 'Claude スクリーンショット・DOM ダンプなど すぐ使えるスニペット集',
    tag: 'util',
    hidden: true,
  },
  {
    path: '/romaji',
    name: 'Romaji',
    icon: 'あ',
    iconBg: 'linear-gradient(135deg, #a855f7, #6366f1)',
    desc: 'ローマ字をひらがなに変換。変換しない範囲を {} や除外リストで複数指定できる',
    tag: 'text',
  },
  {
    path: '/draft',
    name: 'Draft',
    icon: '✍️',
    iconBg: 'linear-gradient(135deg, #0d9488, #6366f1)',
    desc: 'マインドマップで論点整理 → 文章を組み立て → チャット適性指標でチェック',
    tag: 'text',
  },
  {
    path: '/todo',
    name: 'Todo',
    icon: '✅',
    iconBg: 'linear-gradient(135deg, #3b82f6, #6366f1)',
    desc: 'todo.txt フォーマットで優先度・プロジェクト・コンテキスト付きタスク管理',
    tag: 'util',
  },
  {
    path: '/stencil',
    name: 'Stencil',
    icon: '📋',
    iconBg: 'linear-gradient(135deg, #6366f1, #a855f7)',
    desc: '%%PLACEHOLDER%%形式の変数テンプレートに値を流し込み、安定フォーマットでドキュメント作成',
    tag: 'text',
  },
  {
    path: '/minutes',
    name: 'Minutes',
    icon: '📝',
    iconBg: 'linear-gradient(135deg, #6366f1, #a855f7)',
    desc: 'コンサル型議事録ツール。アジェンダ・決定事項・ネクストアクション（担当者/期日）をMarkdownで出力',
    tag: 'util',
  },
  {
    path: '/logtree',
    name: 'LogTree',
    icon: '🌳',
    iconBg: 'linear-gradient(135deg, #0d9488, #6366f1)',
    desc: 'インデントテキストをロジックツリーSVGに変換。右向き・下向きに対応',
    tag: 'diagram',
  },
  {
    path: '/visu',
    name: 'Visu',
    icon: '📈',
    iconBg: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    desc: 'CSVをグラフ・テーブルに、比較マトリクスをMarkdownで出力',
    tag: 'util',
  },
  {
    path: '/bookmarks',
    name: 'Bookmarks',
    icon: '🔖',
    iconBg: 'linear-gradient(135deg, #f97316, #ef4444)',
    desc: 'URLをタグ付きで保存・検索。JSONファイルでインポート/エクスポート',
    tag: 'util',
  },
  {
    path: '/snip',
    name: 'Snip',
    icon: '✂️',
    iconBg: 'linear-gradient(135deg, #7c6cff, #a855f7)',
    desc: 'テキストを登録してワンクリックでコピー。検索対応のシンプルスニペット管理',
    tag: 'util',
  },
  {
    path: '/wordmemo',
    name: 'WordMemo',
    icon: '📚',
    iconBg: 'linear-gradient(135deg, #10b981, #6366f1)',
    desc: '気になった単語をメモして、AIエージェント向け文献リサーチプロンプトを生成',
    tag: 'util',
  },
];

const STORAGE_KEY = 'home-hidden-tools';

const devHidden = new Set(tools.filter(t => t.hidden).map(t => t.path));

const Home = () => {
  const { dark } = useTheme();
  const [editing, setEditing] = useState(false);
  const [hidden, setHidden] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return new Set(JSON.parse(stored));
    } catch { /* ignore */ }
    return new Set(devHidden);
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...hidden]));
  }, [hidden]);

  const resetToDefault = () => {
    localStorage.removeItem(STORAGE_KEY);
    setHidden(new Set(devHidden));
  };

  const toggleHidden = (path: string) => {
    setHidden(prev => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  };

  const visibleTools = editing ? tools : tools.filter(t => !hidden.has(t.path));

  return (
    <div className={`home ${dark ? 'dark' : 'light'}`}>
      <header className="home-header">
        <div className="home-title">
          <h1>react-<span>tools</span></h1>
          <p>{visibleTools.length} tool{visibleTools.length !== 1 ? 's' : ''} available</p>
        </div>
        <div className="home-header-actions">
          {editing && (
            <button className="home-reset-btn" onClick={resetToDefault}>
              デフォルトに戻す
            </button>
          )}
          <button
            className={`home-edit-btn ${editing ? 'home-edit-btn--active' : ''}`}
            onClick={() => setEditing(v => !v)}
            aria-pressed={editing}
          >
            {editing ? '完了' : '編集'}
          </button>
        </div>
      </header>

      <div className="home-grid">
        {visibleTools.map(tool => {
          const isHidden = hidden.has(tool.path);
          if (editing) {
            return (
              <div
                key={tool.path}
                className={`home-card home-card--editable ${isHidden ? 'home-card--hidden' : ''}`}
                onClick={() => toggleHidden(tool.path)}
              >
                <div className="home-card-edit-badge">
                  {isHidden ? '非表示' : '表示中'}
                </div>
                <div className="home-card-icon" style={{ background: tool.iconBg }}>
                  {tool.icon}
                </div>
                <div className="home-card-name">{tool.name}</div>
                <div className="home-card-desc">{tool.desc}</div>
                <span className="home-card-tag">{tool.tag}</span>
              </div>
            );
          }
          return (
            <Link key={tool.path} to={tool.path} className="home-card">
              <div className="home-card-icon" style={{ background: tool.iconBg }}>
                {tool.icon}
              </div>
              <div className="home-card-name">{tool.name}</div>
              <div className="home-card-desc">{tool.desc}</div>
              <span className="home-card-tag">{tool.tag}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Home;

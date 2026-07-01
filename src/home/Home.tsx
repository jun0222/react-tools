import { useState, useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap, Wand2, Hammer, Database, BarChart3, Map, Timer, Clipboard,
  Languages, PenLine, ListTodo, FileText, ClipboardList, Network,
  TrendingUp, Bookmark, Scissors, BookOpen, Bug, NotebookPen,
  PenTool, GitCommit, StickyNote, Terminal, Layout, Search, X, AlignLeft, Salad, Lightbulb,
  CalendarDays, Fish, MessageSquare, CheckSquare, GitFork, FlaskConical, LayoutDashboard, GraduationCap,
  Newspaper, Brain, Layers,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import './Home.css';

interface Tool {
  path: string;
  name: string;
  icon: ReactNode;
  iconBg: string;
  desc: string;
  tag: string;
  hidden?: true;
}

const tools: Tool[] = [
  {
    path: '/oneshot',
    name: 'OneShot',
    icon: <Zap size={20} color="white" />,
    iconBg: 'linear-gradient(135deg, #ff2d7b, #a855f7)',
    desc: 'プロンプトを保存・編集・蒸留・検証する1画面ツール',
    tag: 'prompt',
  },
  {
    path: '/phantom',
    name: 'Phantom',
    icon: <Wand2 size={20} color="white" />,
    iconBg: 'linear-gradient(135deg, #00ffe7, #0a5eaa)',
    desc: 'KMP置換・LCGランダム変換によるテキストマスクツール',
    tag: 'text',
  },
  {
    path: '/forge',
    name: 'Forge',
    icon: <Hammer size={20} color="white" />,
    iconBg: 'linear-gradient(135deg, #f97316, #ef4444)',
    desc: 'PascalCase / camelCase / snake_case / kebab-case 変換 ＋ MDラッパー',
    tag: 'text',
  },
  {
    path: '/erd',
    name: 'ERD',
    icon: <Database size={20} color="white" />,
    iconBg: 'linear-gradient(135deg, #a855f7, #6366f1)',
    desc: 'ReactFlow で ER図を作成。Mermaid / DrawIO / SVG / JSON でエクスポート',
    tag: 'diagram',
    hidden: true,
  },
  {
    path: '/mermaid',
    name: 'Mermaid',
    icon: <BarChart3 size={20} color="white" />,
    iconBg: 'linear-gradient(135deg, #a855f7, #6366f1)',
    desc: 'テンプレート＋カンペ付き Mermaid エディタ。フロー・シーケンス・ER図など7種類',
    tag: 'diagram',
  },
  {
    path: '/blueprint',
    name: 'Blueprint',
    icon: <Map size={20} color="white" />,
    iconBg: 'linear-gradient(135deg, #3b82f6, #6366f1)',
    desc: '機能要件・BBテスト・非機能要件・テスト戦略を整理する開発計画ツール',
    tag: 'plan',
    hidden: true,
  },
  {
    path: '/pacer',
    name: 'Pacer',
    icon: <Timer size={20} color="white" />,
    iconBg: 'linear-gradient(135deg, #10b981, #0d9488)',
    desc: 'テキストを段落/行/N文字で分割して一定ペースで読む スピードリーダー',
    tag: 'read',
    hidden: true,
  },
  {
    path: '/clips',
    name: 'Clips',
    icon: <Clipboard size={20} color="white" />,
    iconBg: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    desc: 'Claude スクリーンショット・DOM ダンプなど すぐ使えるスニペット集',
    tag: 'util',
    hidden: true,
  },
  {
    path: '/romaji',
    name: 'Romaji',
    icon: <Languages size={20} color="white" />,
    iconBg: 'linear-gradient(135deg, #a855f7, #6366f1)',
    desc: 'ローマ字をひらがなに変換。変換しない範囲を {} や除外リストで複数指定できる',
    tag: 'text',
  },
  {
    path: '/draft',
    name: 'Draft',
    icon: <PenLine size={20} color="white" />,
    iconBg: 'linear-gradient(135deg, #0d9488, #6366f1)',
    desc: 'マインドマップで論点整理 → 文章を組み立て → チャット適性指標でチェック',
    tag: 'text',
  },
  {
    path: '/todo',
    name: 'Todo',
    icon: <ListTodo size={20} color="white" />,
    iconBg: 'linear-gradient(135deg, #3b82f6, #6366f1)',
    desc: 'todo.txt フォーマットで優先度・プロジェクト・コンテキスト付きタスク管理',
    tag: 'util',
    hidden: true,
  },
  {
    path: '/stencil',
    name: 'Stencil',
    icon: <FileText size={20} color="white" />,
    iconBg: 'linear-gradient(135deg, #6366f1, #a855f7)',
    desc: '%%PLACEHOLDER%%形式の変数テンプレートに値を流し込み、安定フォーマットでドキュメント作成',
    tag: 'text',
  },
  {
    path: '/minutes',
    name: 'Minutes',
    icon: <ClipboardList size={20} color="white" />,
    iconBg: 'linear-gradient(135deg, #6366f1, #a855f7)',
    desc: 'コンサル型議事録ツール。アジェンダ・決定事項・ネクストアクション（担当者/期日）をMarkdownで出力',
    tag: 'util',
    hidden: true,
  },
  {
    path: '/logtree',
    name: 'LogTree',
    icon: <Network size={20} color="white" />,
    iconBg: 'linear-gradient(135deg, #0d9488, #6366f1)',
    desc: 'インデントテキストをロジックツリーSVGに変換。右向き・下向きに対応',
    tag: 'diagram',
  },
  {
    path: '/visu',
    name: 'Visu',
    icon: <TrendingUp size={20} color="white" />,
    iconBg: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    desc: 'CSVをグラフ・テーブルに、比較マトリクスをMarkdownで出力',
    tag: 'util',
    hidden: true,
  },
  {
    path: '/bookmarks',
    name: 'Bookmarks',
    icon: <Bookmark size={20} color="white" />,
    iconBg: 'linear-gradient(135deg, #f97316, #ef4444)',
    desc: 'URLをタグ付きで保存・検索。JSONファイルでインポート/エクスポート',
    tag: 'util',
  },
  {
    path: '/snip',
    name: 'Snip',
    icon: <Scissors size={20} color="white" />,
    iconBg: 'linear-gradient(135deg, #7c6cff, #a855f7)',
    desc: 'テキストを登録してワンクリックでコピー。検索対応のシンプルスニペット管理',
    tag: 'util',
  },
  {
    path: '/wordmemo',
    name: 'WordMemo',
    icon: <BookOpen size={20} color="white" />,
    iconBg: 'linear-gradient(135deg, #10b981, #6366f1)',
    desc: '気になった単語をメモして、AIエージェント向け文献リサーチプロンプトを生成',
    tag: 'util',
  },
  {
    path: '/errlog',
    name: 'ErrLog',
    icon: <Bug size={20} color="white" />,
    iconBg: 'linear-gradient(135deg, #ef4444, #f97316)',
    desc: 'エラーを貼り付けてLLM向けプロンプトを生成。返答をMermaid付きで記録・再利用',
    tag: 'dev',
  },
  {
    path: '/diary',
    name: 'Diary',
    icon: <NotebookPen size={20} color="white" />,
    iconBg: 'linear-gradient(135deg, #d97706, #f59e0b)',
    desc: '日記を書いて箇条書きに変換。LLMでサマリ・キーワードを生成してASCII art形式の.txtで保存',
    tag: 'write',
  },
  {
    path: '/sketch',
    name: 'Sketch',
    icon: <PenTool size={20} color="white" />,
    iconBg: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
    desc: 'フロー・ステートマシン・グラフを雑な記述で素早く描く。SVG/PNGでエクスポート',
    tag: 'diagram',
  },
  {
    path: '/commit',
    name: 'Commit',
    icon: <GitCommit size={20} color="white" />,
    iconBg: 'linear-gradient(135deg, #15803d, #22c55e)',
    desc: 'type(scope): desc 形式のコミットメッセージを組み立て。type・scope・description の履歴をJSON保存',
    tag: 'dev',
  },
  {
    path: '/args',
    name: 'Args',
    icon: <Terminal size={20} color="white" />,
    iconBg: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
    desc: 'コマンドをスペースで分割、インデックス指定でトークンを置換。Diff確認付き',
    tag: 'dev',
  },
  {
    path: '/pad',
    name: 'Pad',
    icon: <StickyNote size={20} color="white" />,
    iconBg: 'linear-gradient(135deg, #6b7280, #9ca3af)',
    desc: 'ただのテキストパッド。書いた内容は自動保存される。',
    tag: 'write',
  },
  {
    path: '/slideshow',
    name: 'Slideshow',
    icon: <Layout size={20} color="white" />,
    iconBg: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
    desc: 'スライドアウトラインをグラフィカルに編集。タイトル・セクション・2カラムなど5種類のレイアウト。JSONエクスポート・ASCIIアート書き出し対応',
    tag: 'write',
  },
  {
    path: '/shinsho',
    name: 'Shinsho',
    icon: <BookOpen size={20} color="white" />,
    iconBg: 'linear-gradient(135deg, #10b981, #3b82f6)',
    desc: '信頼できる新書・文庫レーベルを絞り込んでLLMプロンプトを生成',
    tag: 'prompt',
  },
  {
    path: '/prose',
    name: 'Prose',
    icon: <AlignLeft size={20} color="white" />,
    iconBg: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
    desc: '文書を貼り付けてLLM向け構成改善プロンプトを生成。90/70/50/30%の4案',
    tag: 'write',
  },
  {
    path: '/insight',
    name: 'Insight',
    icon: <Lightbulb size={20} color="white" />,
    iconBg: 'linear-gradient(135deg, #f59e0b, #f97316)',
    desc: 'テーマを入力し、洞察を深める観点を選んでLLM向けプロンプトを生成',
    tag: 'prompt',
  },
  {
    path: '/meal',
    name: 'Meal',
    icon: <Salad size={20} color="white" />,
    iconBg: 'linear-gradient(135deg, #10b981, #0d9488)',
    desc: '食べたものを入力してLLMにアドバイスをもらい、食事とアドバイスをASCIIアートのテキストファイルで保存',
    tag: 'util',
  },
  {
    path: '/gantt',
    name: 'Gantt',
    icon: <CalendarDays size={20} color="white" />,
    iconBg: 'linear-gradient(135deg, #06b6d4, #6366f1)',
    desc: 'フォームでセクションとタスクを追加してMermaidガントチャートを生成。SVG/PNGエクスポート対応',
    tag: 'diagram',
  },
  {
    path: '/fishbone',
    name: 'Fishbone',
    icon: <Fish size={20} color="white" />,
    iconBg: 'linear-gradient(135deg, #ef4444, #f97316)',
    desc: '原因カテゴリと要因を追加して特性要因図（フィッシュボーン）を生成。SVG/PNGエクスポート対応',
    tag: 'diagram',
  },
  {
    path: '/convmap',
    name: 'Convmap',
    icon: <MessageSquare size={20} color="white" />,
    iconBg: 'linear-gradient(135deg, #a855f7, #6366f1)',
    desc: 'LLMとの会話をMermaid図と一緒に記録・閲覧。プロンプトも残せてMarkdownでダウンロード',
    tag: 'util',
  },
  {
    path: '/rtodo',
    name: 'RTodo',
    icon: <CheckSquare size={20} color="white" />,
    iconBg: 'linear-gradient(135deg, #10b981, #059669)',
    desc: '雑なメモをtodo.txt形式に変換するLLMプロンプトを生成。優先度・プロジェクト・コンテキストタグ付き',
    tag: 'prompt',
  },
  {
    path: '/flowchart',
    name: 'FlowChart',
    icon: <GitFork size={20} color="white" />,
    iconBg: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
    desc: 'シンプルなテキストDSLで4色フロー図を作成。SVG/PNGエクスポート・別タブ表示対応',
    tag: 'diagram',
  },
  {
    path: '/testdata',
    name: 'TestData',
    icon: <FlaskConical size={20} color="white" />,
    iconBg: 'linear-gradient(135deg, #10b981, #06b6d4)',
    desc: 'テーマを入力してLLMにテストデータを生成させ、JSONをローカルストレージに保存',
    tag: 'util',
  },
  {
    path: '/planner',
    name: 'Planner',
    icon: <LayoutDashboard size={20} color="white" />,
    iconBg: 'linear-gradient(135deg, #6366f1, #a855f7)',
    desc: '雑なメモをLLMに渡してロジックツリー・フロー図・ガントチャートに自動変換するメガツール',
    tag: 'diagram',
  },
  {
    path: '/lexis',
    name: 'Lexis',
    icon: <GraduationCap size={20} color="white" />,
    iconBg: 'linear-gradient(135deg, #14b8a6, #6366f1)',
    desc: '単語・概念を入力すると、定義・なぜ？・語源・例文×10 を引き出すLLMプロンプトを生成',
    tag: 'prompt',
  },
  {
    path: '/nippo',
    name: 'Nippo',
    icon: <Newspaper size={20} color="white" />,
    iconBg: 'linear-gradient(135deg, #f97316, #ef4444)',
    desc: '日報エントリを入力してガントチャートで可視化。ステータス別サマリをワンクリックでコピー',
    tag: 'util',
  },
  {
    path: '/grok',
    name: 'Grok',
    icon: <Brain size={20} color="white" />,
    iconBg: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
    desc: '概念を入力すると、本質・アナロジー・再導出・暗記不要の根拠を引き出すLLMプロンプトを生成',
    tag: 'prompt',
  },
  {
    path: '/pattern',
    name: 'Pattern',
    icon: <Layers size={20} color="white" />,
    iconBg: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
    desc: 'デザインパターン名を入力するとPHPPlayground実行可能な業務実装＋説明＋関連パターン比較プロンプトを生成',
    tag: 'prompt',
  },
];

const STORAGE_KEY = 'home-hidden-tools';

const devHidden = new Set(tools.filter(t => t.hidden).map(t => t.path));

const Home = () => {
  const { dark } = useTheme();
  const [editing, setEditing] = useState(false);
  const [query,   setQuery]   = useState('');
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

  const baseTools = editing ? tools : tools.filter(t => !hidden.has(t.path));
  const q = query.trim().toLowerCase();
  const visibleTools = q
    ? baseTools.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.desc.toLowerCase().includes(q) ||
        t.tag.toLowerCase().includes(q)
      )
    : baseTools;

  return (
    <div className={`home ${dark ? 'dark' : 'light'}`}>
      <header className="home-header">
        <div className="home-title">
          <h1>react-<span>tools</span></h1>
          <p>{visibleTools.length} tool{visibleTools.length !== 1 ? 's' : ''} available</p>
        </div>
        <div className="home-header-actions">
          <div className="home-search-wrap">
            <Search size={13} className="home-search-icon" />
            <input
              className="home-search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="検索..."
              aria-label="ツール検索"
            />
            {query && (
              <button className="home-search-clear" onClick={() => setQuery('')} aria-label="クリア">
                <X size={12} />
              </button>
            )}
          </div>
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
        {visibleTools.length === 0 && (
          <p className="home-no-results">「{query}」に一致するツールはありません</p>
        )}
      </div>
    </div>
  );
};

export default Home;

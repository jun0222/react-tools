import { Link } from 'react-router-dom';
import './Home.css';

const tools = [
  {
    path: '/oneshot',
    name: 'OneShot',
    icon: '⚡',
    iconBg: 'linear-gradient(135deg, #ff2d7b, #a855f7)',
    desc: 'プロンプトを保存・編集・蒸留・検証する1画面ツール',
    tag: 'prompt',
  },
];

const Home = () => (
  <div className="home">
    <header className="home-header">
      <h1>react-<span>tools</span></h1>
      <p>{tools.length} tool{tools.length !== 1 ? 's' : ''} available</p>
    </header>

    <div className="home-grid">
      {tools.map(tool => (
        <Link key={tool.path} to={tool.path} className="home-card">
          <div className="home-card-icon" style={{ background: tool.iconBg }}>
            {tool.icon}
          </div>
          <div className="home-card-name">{tool.name}</div>
          <div className="home-card-desc">{tool.desc}</div>
          <span className="home-card-tag">{tool.tag}</span>
        </Link>
      ))}
    </div>
  </div>
);

export default Home;

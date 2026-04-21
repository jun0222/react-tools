import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { ThemeProvider } from '../../context/ThemeContext';
import Forge from './Forge';

const setup = () => {
  const user = userEvent.setup();
  const utils = render(
    <ThemeProvider>
      <Forge />
    </ThemeProvider>
  );
  return { user, ...utils };
};

// =====================
// レンダリング / タブ
// =====================
describe('タブ', () => {
  beforeEach(() => { localStorage.clear(); });

  it('4 つのタブが表示される', () => {
    setup();
    expect(screen.getByRole('tab', { name: 'ケース変換' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'MD 追記'   })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'JSON'       })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'SQL'        })).toBeInTheDocument();
  });

  it('初期タブはケース変換', () => {
    setup();
    expect(screen.getByRole('tab', { name: 'ケース変換' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByLabelText('ケース変換入力')).toBeInTheDocument();
  });

  it('MD 追記タブに切り替えると MD 入力エリアが表示される', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('tab', { name: 'MD 追記' }));
    expect(screen.getByLabelText('MDラッパー入力')).toBeInTheDocument();
  });

  it('JSON タブに切り替えると JSON 入力エリアが表示される', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('tab', { name: 'JSON' }));
    expect(screen.getByLabelText('JSON入力')).toBeInTheDocument();
  });

  it('SQL タブに切り替えると SQL 入力エリアが表示される', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('tab', { name: 'SQL' }));
    expect(screen.getByLabelText('SQL入力')).toBeInTheDocument();
  });
});

// =====================
// ケース変換
// =====================
describe('ケース変換', () => {
  it('入力テキストが各ケースにリアルタイム変換される', () => {
    setup();
    fireEvent.change(screen.getByLabelText('ケース変換入力'), { target: { value: 'hello world' } });
    expect(screen.getByText('HelloWorld')).toBeInTheDocument();
    expect(screen.getByText('helloWorld')).toBeInTheDocument();
    expect(screen.getByText('hello_world')).toBeInTheDocument();
    expect(screen.getByText('hello-world')).toBeInTheDocument();
  });

  it('入力が空のときコピーボタンが無効になる', () => {
    setup();
    expect(screen.getByRole('button', { name: 'PascalCaseをコピー' })).toBeDisabled();
  });

  it('入力があるときコピーボタンが有効になる', () => {
    setup();
    fireEvent.change(screen.getByLabelText('ケース変換入力'), { target: { value: 'test' } });
    expect(screen.getByRole('button', { name: 'PascalCaseをコピー' })).toBeEnabled();
  });
});

// =====================
// MD 追記（自動フォーマット）
// =====================
describe('MD 追記', () => {
  it('入力するだけで ## + ``` ``` + --- 形式の出力が自動表示される', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('tab', { name: 'MD 追記' }));
    fireEvent.change(screen.getByLabelText('MDラッパー入力'), { target: { value: 'サンプルコード' } });
    const output = screen.getByLabelText('MD変換結果');
    expect(output.textContent).toContain('## ');
    expect(output.textContent).toContain('```');
    expect(output.textContent).toContain('サンプルコード');
    expect(output.textContent).toContain('---');
  });

  it('入力前は出力エリアが表示されない', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('tab', { name: 'MD 追記' }));
    expect(screen.queryByLabelText('MD変換結果')).not.toBeInTheDocument();
  });

  it('出力が表示されるとコピーボタンが現れる', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('tab', { name: 'MD 追記' }));
    fireEvent.change(screen.getByLabelText('MDラッパー入力'), { target: { value: 'テスト' } });
    expect(screen.getByRole('button', { name: /^コピー$/ })).toBeInTheDocument();
  });
});

// =====================
// JSON 整形
// =====================
describe('JSON 整形', () => {
  it('有効な JSON を入力すると整形結果が自動表示される', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('tab', { name: 'JSON' }));
    fireEvent.change(screen.getByLabelText('JSON入力'), { target: { value: '{"a":1}' } });
    expect(screen.getByLabelText('JSON整形結果').textContent).toContain('"a": 1');
  });

  it('不正な JSON を入力するとエラーが表示される', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('tab', { name: 'JSON' }));
    fireEvent.change(screen.getByLabelText('JSON入力'), { target: { value: 'not json' } });
    expect(screen.getByText(/不正な JSON/)).toBeInTheDocument();
  });

  it('入力が空のとき結果エリアは表示されない', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('tab', { name: 'JSON' }));
    expect(screen.queryByLabelText('JSON整形結果')).not.toBeInTheDocument();
  });
});

// =====================
// SQL 整形
// =====================
describe('SQL 整形', () => {
  it('SQL を入力するとキーワードが大文字の結果が自動表示される', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('tab', { name: 'SQL' }));
    fireEvent.change(screen.getByLabelText('SQL入力'), { target: { value: 'select id from users' } });
    const output = screen.getByLabelText('SQL整形結果');
    expect(output.textContent).toContain('SELECT');
    expect(output.textContent).toContain('FROM');
  });

  it('入力が空のとき結果エリアは表示されない', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('tab', { name: 'SQL' }));
    expect(screen.queryByLabelText('SQL整形結果')).not.toBeInTheDocument();
  });
});
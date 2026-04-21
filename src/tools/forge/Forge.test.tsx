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
// レンダリング
// =====================
describe('レンダリング', () => {
  it('ヘッダーに Forge が表示される', () => {
    setup();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('ケース変換セクションが表示される', () => {
    setup();
    expect(screen.getByText('ケース変換')).toBeInTheDocument();
  });

  it('MD ドキュメント追記セクションが表示される', () => {
    setup();
    expect(screen.getByText('MD ドキュメント追記')).toBeInTheDocument();
  });

  it('JSON 整形セクションが表示される', () => {
    setup();
    expect(screen.getByText('JSON 整形')).toBeInTheDocument();
  });

  it('SQL 整形セクションが表示される', () => {
    setup();
    expect(screen.getByText('SQL 整形')).toBeInTheDocument();
  });
});

// =====================
// ケース変換
// =====================
describe('ケース変換', () => {
  beforeEach(() => { localStorage.clear(); });

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
// MD ドキュメント追記
// =====================
describe('MD ドキュメント追記', () => {
  it('ボタンをクリックすると ## + ``` ``` + --- 形式の出力が表示される', async () => {
    const { user } = setup();
    fireEvent.change(screen.getByLabelText('MDラッパー入力'), { target: { value: 'サンプルコード' } });
    await user.click(screen.getByRole('button', { name: 'MDドキュメントに追記' }));
    const output = screen.getByLabelText('MD変換結果');
    expect(output.textContent).toContain('## ');
    expect(output.textContent).toContain('```');
    expect(output.textContent).toContain('サンプルコード');
    expect(output.textContent).toContain('---');
  });

  it('出力が表示されるとコピーボタンが現れる', async () => {
    const { user } = setup();
    fireEvent.change(screen.getByLabelText('MDラッパー入力'), { target: { value: 'テスト' } });
    await user.click(screen.getByRole('button', { name: 'MDドキュメントに追記' }));
    expect(screen.getByRole('button', { name: /^コピー$/ })).toBeInTheDocument();
  });

  it('入力前は出力エリアが表示されない', () => {
    setup();
    expect(screen.queryByLabelText('MD変換結果')).not.toBeInTheDocument();
  });
});

// =====================
// JSON 整形
// =====================
describe('JSON 整形', () => {
  it('有効な JSON を入力すると整形結果が表示される', () => {
    setup();
    fireEvent.change(screen.getByLabelText('JSON入力'), { target: { value: '{"a":1}' } });
    expect(screen.getByLabelText('JSON整形結果').textContent).toContain('"a": 1');
  });

  it('不正な JSON を入力するとエラーが表示される', () => {
    setup();
    fireEvent.change(screen.getByLabelText('JSON入力'), { target: { value: 'not json' } });
    expect(screen.getByText(/不正な JSON/)).toBeInTheDocument();
    expect(screen.queryByLabelText('JSON整形結果')).not.toBeInTheDocument();
  });

  it('入力が空のとき結果エリアは表示されない', () => {
    setup();
    expect(screen.queryByLabelText('JSON整形結果')).not.toBeInTheDocument();
  });
});

// =====================
// SQL 整形
// =====================
describe('SQL 整形', () => {
  it('SQL を入力するとキーワードが大文字になった結果が表示される', () => {
    setup();
    fireEvent.change(screen.getByLabelText('SQL入力'), { target: { value: 'select id from users' } });
    const output = screen.getByLabelText('SQL整形結果');
    expect(output.textContent).toContain('SELECT');
    expect(output.textContent).toContain('FROM');
  });

  it('入力が空のとき結果エリアは表示されない', () => {
    setup();
    expect(screen.queryByLabelText('SQL整形結果')).not.toBeInTheDocument();
  });
});
export type Priority = 'must' | 'should' | 'could';
export type TestKind = 'normal' | 'error' | 'boundary';

export interface FuncReq {
  id: string;
  text: string;
  priority: Priority;
}

export interface TestCase {
  id: string;
  name: string;
  input: string;
  expected: string;
  kind: TestKind;
}

export interface NfrItem {
  id: string;
  label: string;
  checked: boolean;
  note: string;
}

export interface StrategyItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface BlueprintData {
  featureName: string;
  description: string;
  funcReqs: FuncReq[];
  testCases: TestCase[];
  nfrs: NfrItem[];
  strategies: StrategyItem[];
}

const nfr = (id: string, label: string): NfrItem => ({ id, label, checked: false, note: '' });
const strat = (id: string, label: string): StrategyItem => ({ id, label, checked: false });

export const DEFAULT_NFRS: NfrItem[] = [
  nfr('perf',    'パフォーマンス（応答速度・スループット）'),
  nfr('sec',     'セキュリティ（認証・認可・XSS・CSRF）'),
  nfr('avail',   '可用性（障害時の動作・リカバリ）'),
  nfr('scale',   'スケーラビリティ（負荷増加への対応）'),
  nfr('a11y',    'ユーザビリティ・アクセシビリティ'),
  nfr('maint',   '保守性（可読性・テスタビリティ）'),
  nfr('compat',  '互換性（ブラウザ・デバイス対応）'),
  nfr('data',    'データ整合性（バリデーション・トランザクション）'),
];

export const DEFAULT_STRATEGIES: StrategyItem[] = [
  strat('behav',   '実装詳細でなく「振る舞い」をテストする'),
  strat('pyramid', 'テストピラミッドを意識する（Unit > Integration > E2E）'),
  strat('e2e',     'E2Eはクリティカルなシナリオのみ'),
  strat('happy',   'ハッピーパスと主要な異常系に集中する'),
  strat('boundary','等価クラス・境界値で入力を代表させる'),
  strat('mock',    'モックは外部依存（API・DB・時刻）にのみ使う'),
  strat('snap',    'スナップショットテストは最小限にする'),
  strat('flakey',  'フレイキーなテストは即修正するか削除する'),
  strat('cost',    '「テストしないこと」を意識的に選択する'),
];

const PRIORITY_LABEL: Record<Priority, string> = { must: 'Must', should: 'Should', could: 'Could' };
const KIND_LABEL: Record<TestKind, string> = { normal: '正常系', error: '異常系', boundary: '境界値' };

export const exportToMarkdown = (data: BlueprintData): string => {
  const lines: string[] = [];

  lines.push(`# ${data.featureName || '（機能名未入力）'}`);
  if (data.description.trim()) {
    lines.push('');
    lines.push(data.description.trim());
  }

  lines.push('');
  lines.push('## 機能要件');
  lines.push('');
  if (data.funcReqs.length) {
    data.funcReqs.forEach(r => {
      lines.push(`- **[${PRIORITY_LABEL[r.priority]}]** ${r.text}`);
    });
  } else {
    lines.push('（未入力）');
  }

  lines.push('');
  lines.push('## ブラックボックステスト');
  lines.push('');
  const kinds: TestKind[] = ['normal', 'error', 'boundary'];
  kinds.forEach(kind => {
    const cases = data.testCases.filter(tc => tc.kind === kind);
    if (!cases.length) return;
    lines.push(`### ${KIND_LABEL[kind]}`);
    lines.push('');
    lines.push('| テスト名 | 入力条件 | 期待結果 |');
    lines.push('|---------|---------|---------|');
    cases.forEach(tc => {
      lines.push(`| ${tc.name} | ${tc.input} | ${tc.expected} |`);
    });
    lines.push('');
  });

  lines.push('## 非機能要件');
  lines.push('');
  data.nfrs.forEach(nfr => {
    const note = nfr.note.trim() ? ` — ${nfr.note.trim()}` : '';
    lines.push(`- [${nfr.checked ? 'x' : ' '}] **${nfr.label}**${note}`);
  });

  lines.push('');
  lines.push('## テスト戦略');
  lines.push('');
  data.strategies.forEach(s => {
    lines.push(`- [${s.checked ? 'x' : ' '}] ${s.label}`);
  });

  return lines.join('\n');
};
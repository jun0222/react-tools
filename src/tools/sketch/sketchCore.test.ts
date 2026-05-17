import { describe, it, expect } from 'vitest';
import {
  DIAGRAM_CONFIGS,
  FLOW_DEFAULT,
  STATE_DEFAULT,
  GRAPH_DEFAULT,
  generateFilename,
  lineToConns,
  parseSimpleNotation,
} from './sketchCore';

// ---- DIAGRAM_CONFIGS ----

describe('DIAGRAM_CONFIGS', () => {
  it('flow・state・graphの3種類が存在する', () => {
    expect(DIAGRAM_CONFIGS.flow).toBeDefined();
    expect(DIAGRAM_CONFIGS.state).toBeDefined();
    expect(DIAGRAM_CONFIGS.graph).toBeDefined();
  });

  it('各configにname・defaultCode・snippetsが存在する', () => {
    for (const config of Object.values(DIAGRAM_CONFIGS)) {
      expect(config.name).toBeTruthy();
      expect(config.defaultCode).toBeTruthy();
      expect(config.snippets.length).toBeGreaterThan(0);
    }
  });

  it('各スニペットにlabel・code・descが存在する', () => {
    for (const config of Object.values(DIAGRAM_CONFIGS)) {
      for (const snippet of config.snippets) {
        expect(snippet.label).toBeTruthy();
        expect(snippet.code).toBeTruthy();
        expect(snippet.desc).toBeTruthy();
      }
    }
  });
});

// ---- generateFilename ----

describe('generateFilename', () => {
  it('svgの場合は.svg拡張子', () => expect(generateFilename('svg').endsWith('.svg')).toBe(true));
  it('pngの場合は.png拡張子', () => expect(generateFilename('png').endsWith('.png')).toBe(true));
  it('sketch-で始まる', () => expect(generateFilename('svg').startsWith('sketch-')).toBe(true));
  it('年月日が含まれる形式（YYYY_MM_DD）', () => {
    expect(generateFilename('svg')).toMatch(/sketch-\d{4}_\d{2}_\d{2}_\d{4}\.svg/);
  });
});

// ---- lineToConns ----

describe('lineToConns: 基本の矢印', () => {
  it('A→B で右向き接続', () => {
    const { conns } = lineToConns('A→B');
    expect(conns).toHaveLength(1);
    expect(conns[0].from.label).toBe('A');
    expect(conns[0].to.label).toBe('B');
    expect(conns[0].arrow.dir).toBe('right');
  });

  it('A->B でも右向き接続', () => {
    const { conns } = lineToConns('A->B');
    expect(conns[0].arrow.dir).toBe('right');
  });

  it('A←B で左向き（B→Aとして記録）', () => {
    const { conns } = lineToConns('A←B');
    expect(conns[0].from.label).toBe('B');
    expect(conns[0].to.label).toBe('A');
  });

  it('A<-B でも左向き', () => {
    const { conns } = lineToConns('A<-B');
    expect(conns[0].from.label).toBe('B');
    expect(conns[0].to.label).toBe('A');
  });
});

describe('lineToConns: チェーン記法', () => {
  it('A→B→C で2つの接続', () => {
    const { conns } = lineToConns('A→B→C');
    expect(conns).toHaveLength(2);
    expect(conns[0].from.label).toBe('A');
    expect(conns[0].to.label).toBe('B');
    expect(conns[1].from.label).toBe('B');
    expect(conns[1].to.label).toBe('C');
  });

  it('A→B←C でAとCがBに向かう', () => {
    const { conns } = lineToConns('A→B←C');
    expect(conns).toHaveLength(2);
    // A→B
    expect(conns[0].from.label).toBe('A');
    expect(conns[0].to.label).toBe('B');
    // C→B (← が逆転)
    expect(conns[1].from.label).toBe('C');
    expect(conns[1].to.label).toBe('B');
  });
});

describe('lineToConns: 双方向・無向', () => {
  it('A↔B で2つの接続（双方向）', () => {
    const { conns } = lineToConns('A↔B');
    expect(conns).toHaveLength(2);
    const labels = conns.map(c => `${c.from.label}→${c.to.label}`);
    expect(labels).toContain('A→B');
    expect(labels).toContain('B→A');
  });

  it('A---B で undirected', () => {
    const { conns } = lineToConns('A---B');
    expect(conns[0].arrow.dir).toBe('undirected');
  });
});

describe('lineToConns: ラベル付き矢印', () => {
  it('A→[はい]B でラベルが取れる', () => {
    const { conns } = lineToConns('A→[はい]B');
    expect(conns[0].arrow.label).toBe('はい');
  });

  it('A→[承認]B→[完了]C で2つのラベル付き接続', () => {
    const { conns } = lineToConns('A→[承認]B→[完了]C');
    expect(conns[0].arrow.label).toBe('承認');
    expect(conns[1].arrow.label).toBe('完了');
  });
});

describe('lineToConns: 破線', () => {
  it('A-->B で dashed', () => {
    const { conns } = lineToConns('A-->B');
    expect(conns[0].arrow.dashed).toBe(true);
    expect(conns[0].arrow.dir).toBe('right');
  });

  it('A<--B で dashed left（B→Aとして記録）', () => {
    const { conns } = lineToConns('A<--B');
    expect(conns[0].from.label).toBe('B');
    expect(conns[0].to.label).toBe('A');
    expect(conns[0].arrow.dashed).toBe(true);
  });
});

describe('lineToConns: ノード形状', () => {
  it('{条件}→A でdiamondノード', () => {
    const { conns } = lineToConns('{条件}→A');
    expect(conns[0].from.shape).toBe('diamond');
    expect(conns[0].from.label).toBe('条件');
  });

  it('(処理)→A でroundノード', () => {
    const { conns } = lineToConns('(処理)→A');
    expect(conns[0].from.shape).toBe('round');
  });

  it('((円))→A でcircleノード', () => {
    const { conns } = lineToConns('((円))→A');
    expect(conns[0].from.shape).toBe('circle');
  });

  it('[(DB)]→A でdbノード', () => {
    const { conns } = lineToConns('[(DB)]→A');
    expect(conns[0].from.shape).toBe('db');
  });
});

describe('lineToConns: スペースあり', () => {
  it('A → B でもパース', () => {
    const { conns } = lineToConns('A → B');
    expect(conns[0].from.label).toBe('A');
    expect(conns[0].to.label).toBe('B');
  });

  it('あれ → それ ← これ で2接続', () => {
    const { conns } = lineToConns('あれ → それ ← これ');
    expect(conns).toHaveLength(2);
  });
});

// ---- parseSimpleNotation ----

describe('parseSimpleNotation: flowモード', () => {
  it('flowchart TDで始まる', () => {
    const out = parseSimpleNotation('A→B', 'flow');
    expect(out.startsWith('flowchart TD')).toBe(true);
  });

  it('ノードIDが含まれる', () => {
    const out = parseSimpleNotation('A→B', 'flow');
    expect(out).toContain('n0');
    expect(out).toContain('n1');
  });

  it('ノードラベルが含まれる', () => {
    const out = parseSimpleNotation('あれ→それ', 'flow');
    expect(out).toContain('あれ');
    expect(out).toContain('それ');
  });

  it('ラベル付き矢印が含まれる', () => {
    const out = parseSimpleNotation('A→[承認]B', 'flow');
    expect(out).toContain('承認');
    expect(out).toContain('-->');
  });

  it('コメント行は無視される', () => {
    const out = parseSimpleNotation('# コメント\nA→B', 'flow');
    expect(out).not.toContain('コメント');
    expect(out).toContain('-->');
  });
});

describe('parseSimpleNotation: graphモード', () => {
  it('graph LRで始まる', () => {
    const out = parseSimpleNotation('A→B', 'graph');
    expect(out.startsWith('graph LR')).toBe(true);
  });
});

describe('parseSimpleNotation: stateモード', () => {
  it('stateDiagram-v2で始まる', () => {
    const out = parseSimpleNotation('A→B', 'state');
    expect(out.startsWith('stateDiagram-v2')).toBe(true);
  });

  it('*が[*]に変換される', () => {
    const out = parseSimpleNotation('*→待機', 'state');
    expect(out).toContain('[*]');
  });

  it('ラベルが: 形式で出力される', () => {
    const out = parseSimpleNotation('A→[開始]B', 'state');
    expect(out).toContain(': 開始');
  });
});

describe('parseSimpleNotation: デフォルト値', () => {
  it('FLOW_DEFAULTはパースエラーなし', () => {
    expect(() => parseSimpleNotation(FLOW_DEFAULT, 'flow')).not.toThrow();
  });

  it('STATE_DEFAULTはパースエラーなし', () => {
    expect(() => parseSimpleNotation(STATE_DEFAULT, 'state')).not.toThrow();
  });

  it('GRAPH_DEFAULTはパースエラーなし', () => {
    expect(() => parseSimpleNotation(GRAPH_DEFAULT, 'graph')).not.toThrow();
  });
});

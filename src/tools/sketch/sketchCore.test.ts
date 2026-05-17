import { describe, it, expect } from 'vitest';
import {
  DIAGRAM_CONFIGS,
  FLOW_DEFAULT,
  STATE_DEFAULT,
  GRAPH_DEFAULT,
  generateFilename,
} from './sketchCore';

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

  it('flowのデフォルトコードはflowchart TDで始まる', () => {
    expect(DIAGRAM_CONFIGS.flow.defaultCode.startsWith('flowchart TD')).toBe(true);
  });

  it('stateのデフォルトコードはstateDiagram-v2で始まる', () => {
    expect(DIAGRAM_CONFIGS.state.defaultCode.startsWith('stateDiagram-v2')).toBe(true);
  });

  it('graphのデフォルトコードはgraph LRで始まる', () => {
    expect(DIAGRAM_CONFIGS.graph.defaultCode.startsWith('graph LR')).toBe(true);
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

describe('デフォルトコード定数', () => {
  it('FLOW_DEFAULTはflowchart TDで始まる', () => {
    expect(FLOW_DEFAULT.startsWith('flowchart TD')).toBe(true);
  });

  it('STATE_DEFAULTはstateDiagram-v2で始まる', () => {
    expect(STATE_DEFAULT.startsWith('stateDiagram-v2')).toBe(true);
  });

  it('GRAPH_DEFAULTはgraph LRで始まる', () => {
    expect(GRAPH_DEFAULT.startsWith('graph LR')).toBe(true);
  });
});

describe('generateFilename', () => {
  it('svgの場合は.svg拡張子', () => {
    expect(generateFilename('svg').endsWith('.svg')).toBe(true);
  });

  it('pngの場合は.png拡張子', () => {
    expect(generateFilename('png').endsWith('.png')).toBe(true);
  });

  it('sketch-で始まる', () => {
    expect(generateFilename('svg').startsWith('sketch-')).toBe(true);
  });

  it('年月日が含まれる形式（YYYY_MM_DD）', () => {
    const name = generateFilename('svg');
    expect(name).toMatch(/sketch-\d{4}_\d{2}_\d{2}_\d{4}\.svg/);
  });
});

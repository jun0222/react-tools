import { describe, it, expect } from 'vitest';
import { extractPlaceholders, applyTemplate } from './stencilCore';

describe('extractPlaceholders', () => {
  it('%%KEY%%形式のプレースホルダを抽出する', () => {
    expect(extractPlaceholders('Hello %%NAME%%!')).toEqual(['NAME']);
  });

  it('複数のプレースホルダを出現順に返す', () => {
    expect(extractPlaceholders('%%TITLE%%\n\n%%BODY%%\n%%FOOTER%%')).toEqual(['TITLE', 'BODY', 'FOOTER']);
  });

  it('重複するプレースホルダは1つにまとめる（初出順を維持）', () => {
    expect(extractPlaceholders('%%A%% %%B%% %%A%%')).toEqual(['A', 'B']);
  });

  it('プレースホルダがなければ空配列を返す', () => {
    expect(extractPlaceholders('plain text')).toEqual([]);
  });

  it('空文字列のとき空配列を返す', () => {
    expect(extractPlaceholders('')).toEqual([]);
  });

  it('アンダースコアを含むキーを認識する', () => {
    expect(extractPlaceholders('%%HOGE_FUGA%%')).toEqual(['HOGE_FUGA']);
  });

  it('小文字・数字を含むキーも認識する', () => {
    expect(extractPlaceholders('%%key1%% %%KEY_2%%')).toEqual(['key1', 'KEY_2']);
  });

  it('日本語キーを認識する', () => {
    expect(extractPlaceholders('%%タイトル%%')).toEqual(['タイトル']);
  });

  it('日本語キーを複数認識する', () => {
    expect(extractPlaceholders('%%タイトル%%\n%%本文%%\n%%著者%%')).toEqual(['タイトル', '本文', '著者']);
  });

  it('日本語キーの重複を除去する', () => {
    expect(extractPlaceholders('%%名前%% さんは %%名前%% です')).toEqual(['名前']);
  });

  it('日本語と英字が混在するキーを認識する', () => {
    expect(extractPlaceholders('%%プロジェクト名%% %%VERSION%%')).toEqual(['プロジェクト名', 'VERSION']);
  });
});

describe('applyTemplate', () => {
  it('%%KEY%%を対応する値に置換する', () => {
    expect(applyTemplate('Hello %%NAME%%!', { NAME: 'World' })).toBe('Hello World!');
  });

  it('複数のプレースホルダを置換する', () => {
    expect(applyTemplate('%%TITLE%%\n%%BODY%%', { TITLE: 'タイトル', BODY: '本文' })).toBe('タイトル\n本文');
  });

  it('同じキーが複数回出現する場合もすべて置換する', () => {
    expect(applyTemplate('%%A%% and %%A%%', { A: 'foo' })).toBe('foo and foo');
  });

  it('値が未設定のキーはそのまま%%KEY%%で残す', () => {
    expect(applyTemplate('%%A%% %%B%%', { A: 'hello' })).toBe('hello %%B%%');
  });

  it('valuesが空のときテンプレートをそのまま返す', () => {
    expect(applyTemplate('%%X%%', {})).toBe('%%X%%');
  });

  it('空のテンプレートは空文字を返す', () => {
    expect(applyTemplate('', { X: 'y' })).toBe('');
  });

  it('プレースホルダのない文字列はそのまま返す', () => {
    expect(applyTemplate('no placeholders', { A: 'b' })).toBe('no placeholders');
  });

  it('値に改行が含まれても正しく置換する', () => {
    expect(applyTemplate('%%CONTENT%%', { CONTENT: 'line1\nline2' })).toBe('line1\nline2');
  });

  it('日本語キーを置換する', () => {
    expect(applyTemplate('こんにちは、%%名前%%さん！', { '名前': '田中' })).toBe('こんにちは、田中さん！');
  });

  it('日本語キーが複数あるとき全て置換する', () => {
    expect(applyTemplate('%%タイトル%%\n\n%%本文%%', { 'タイトル': '議事録', '本文': '内容' }))
      .toBe('議事録\n\n内容');
  });

  it('値が未設定の日本語キーはそのまま残す', () => {
    expect(applyTemplate('%%タイトル%% %%本文%%', { 'タイトル': '見出し' }))
      .toBe('見出し %%本文%%');
  });
});

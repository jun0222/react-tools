import { describe, it, expect } from 'vitest';
import { convertRomaji, parseSegments, groupLines } from './romajiCore';

// =====================
// 母音
// =====================
describe('母音の変換', () => {
  it('a → あ', () => { expect(convertRomaji('a')).toBe('あ'); });
  it('i → い', () => { expect(convertRomaji('i')).toBe('い'); });
  it('u → う', () => { expect(convertRomaji('u')).toBe('う'); });
  it('e → え', () => { expect(convertRomaji('e')).toBe('え'); });
  it('o → お', () => { expect(convertRomaji('o')).toBe('お'); });
});

// =====================
// 基本子音 + 母音
// =====================
describe('基本的なかな変換', () => {
  it('ka → か', () => { expect(convertRomaji('ka')).toBe('か'); });
  it('ki → き', () => { expect(convertRomaji('ki')).toBe('き'); });
  it('ku → く', () => { expect(convertRomaji('ku')).toBe('く'); });
  it('ke → け', () => { expect(convertRomaji('ke')).toBe('け'); });
  it('ko → こ', () => { expect(convertRomaji('ko')).toBe('こ'); });
  it('sa → さ', () => { expect(convertRomaji('sa')).toBe('さ'); });
  it('ta → た', () => { expect(convertRomaji('ta')).toBe('た'); });
  it('na → な', () => { expect(convertRomaji('na')).toBe('な'); });
  it('ha → は', () => { expect(convertRomaji('ha')).toBe('は'); });
  it('ma → ま', () => { expect(convertRomaji('ma')).toBe('ま'); });
  it('ya → や', () => { expect(convertRomaji('ya')).toBe('や'); });
  it('ra → ら', () => { expect(convertRomaji('ra')).toBe('ら'); });
  it('wa → わ', () => { expect(convertRomaji('wa')).toBe('わ'); });
  it('ga → が', () => { expect(convertRomaji('ga')).toBe('が'); });
  it('za → ざ', () => { expect(convertRomaji('za')).toBe('ざ'); });
  it('da → だ', () => { expect(convertRomaji('da')).toBe('だ'); });
  it('ba → ば', () => { expect(convertRomaji('ba')).toBe('ば'); });
  it('pa → ぱ', () => { expect(convertRomaji('pa')).toBe('ぱ'); });
});

// =====================
// 特殊3文字パターン
// =====================
describe('3文字パターンの変換', () => {
  it('shi → し', () => { expect(convertRomaji('shi')).toBe('し'); });
  it('sha → しゃ', () => { expect(convertRomaji('sha')).toBe('しゃ'); });
  it('shu → しゅ', () => { expect(convertRomaji('shu')).toBe('しゅ'); });
  it('sho → しょ', () => { expect(convertRomaji('sho')).toBe('しょ'); });
  it('chi → ち', () => { expect(convertRomaji('chi')).toBe('ち'); });
  it('cha → ちゃ', () => { expect(convertRomaji('cha')).toBe('ちゃ'); });
  it('tsu → つ', () => { expect(convertRomaji('tsu')).toBe('つ'); });
});

// =====================
// 拗音（複合かな）
// =====================
describe('拗音の変換', () => {
  it('kya → きゃ', () => { expect(convertRomaji('kya')).toBe('きゃ'); });
  it('kyu → きゅ', () => { expect(convertRomaji('kyu')).toBe('きゅ'); });
  it('kyo → きょ', () => { expect(convertRomaji('kyo')).toBe('きょ'); });
  it('nya → にゃ', () => { expect(convertRomaji('nya')).toBe('にゃ'); });
  it('nyu → にゅ', () => { expect(convertRomaji('nyu')).toBe('にゅ'); });
  it('ryu → りゅ', () => { expect(convertRomaji('ryu')).toBe('りゅ'); });
  it('myo → みょ', () => { expect(convertRomaji('myo')).toBe('みょ'); });
});

// =====================
// 促音（っ）
// =====================
describe('促音（っ）の変換', () => {
  it('kka → っか', () => { expect(convertRomaji('kka')).toBe('っか'); });
  it('tte → って', () => { expect(convertRomaji('tte')).toBe('って'); });
  it('ppo → っぽ', () => { expect(convertRomaji('ppo')).toBe('っぽ'); });
  it('ssa → っさ', () => { expect(convertRomaji('ssa')).toBe('っさ'); });
  it('kitto → きっと（文中）', () => { expect(convertRomaji('kitto')).toBe('きっと'); });
  it('ippai → いっぱい', () => { expect(convertRomaji('ippai')).toBe('いっぱい'); });
});

// =====================
// ん の処理
// =====================
describe('ん の変換', () => {
  it('末尾の n → ん', () => { expect(convertRomaji('n')).toBe('ん'); });
  it('na は な（表から優先）', () => { expect(convertRomaji('na')).toBe('な'); });
  it('ni → に（表から優先）', () => { expect(convertRomaji('ni')).toBe('に'); });
  it('n + 子音（k）→ ん', () => { expect(convertRomaji('nka')).toBe('んか'); });
  it('n + 子音（s）→ ん', () => { expect(convertRomaji('sanpo')).toBe('さんぽ'); });
  it('nn → ん（二重 n）', () => { expect(convertRomaji('nn')).toBe('ん'); });
  it('nna → んな（nn の後に母音）', () => { expect(convertRomaji('nna')).toBe('んな'); });
  it("n' → ん（アポストロフィ区切り）", () => { expect(convertRomaji("n'a")).toBe('んあ'); });
  it('kanna → かんな', () => { expect(convertRomaji('kanna')).toBe('かんな'); });
  it('sannpo → さんぽ', () => { expect(convertRomaji('sannpo')).toBe('さんぽ'); });
});

// =====================
// 文の変換
// =====================
describe('文の変換', () => {
  it('watashi → わたし', () => { expect(convertRomaji('watashi')).toBe('わたし'); });
  it('konnichiwa → こんにちわ', () => { expect(convertRomaji('konnichiwa')).toBe('こんにちわ'); });
  it('スペースはそのまま残る', () => {
    expect(convertRomaji('suki desu')).toBe('すき です');
  });
  it('大文字混じり入力も変換される', () => {
    expect(convertRomaji('Nihongo')).toBe('にほんご');
  });
  it('数字・記号はそのまま残る', () => {
    expect(convertRomaji('3ko')).toBe('3こ');
  });
  it('空文字は空文字を返す', () => {
    expect(convertRomaji('')).toBe('');
  });
  it('空白のみは空文字を返す', () => {
    expect(convertRomaji('   ')).toBe('');
  });
});

// =====================
// {} インラインマーカー
// =====================
describe('{} インラインマーカーによる除外', () => {
  it('{テキスト} はそのまま残る', () => {
    expect(convertRomaji('{Hello}')).toBe('Hello');
  });
  it('変換部分と混在できる', () => {
    expect(convertRomaji('{Hello} watashi')).toBe('Hello わたし');
  });
  it('複数の {} を指定できる', () => {
    expect(convertRomaji('{John} to {Mary}')).toBe('John と Mary');
  });
  it('{} 内の文字はローマ字変換されない', () => {
    expect(convertRomaji('{Tokyo} ni sumu')).toBe('Tokyo に すむ');
  });
  it('空の {} は空文字になる', () => {
    expect(convertRomaji('{}')).toBe('');
  });
});

// =====================
// skipWords による除外
// =====================
describe('skipWords による除外', () => {
  it('指定した単語はそのまま残る', () => {
    expect(convertRomaji('Tokyo ni sumu', ['Tokyo'])).toBe('Tokyo に すむ');
  });
  it('大文字小文字を無視してマッチする', () => {
    expect(convertRomaji('john ha gakusei', ['John'])).toBe('john は がくせい');
  });
  it('複数の単語を指定できる', () => {
    expect(convertRomaji('John to Mary ga', ['John', 'Mary'])).toBe('John と Mary が');
  });
  it('空文字の skipWord は無視する', () => {
    expect(convertRomaji('ka', [''])).toBe('か');
  });
  it('skipWords が空配列のとき通常変換する', () => {
    expect(convertRomaji('ka', [])).toBe('か');
  });
});

// =====================
// ハイフン → 長音符（ー）
// =====================
describe('ハイフン（-）の長音符変換', () => {
  it('o-kina → おーきな', () => { expect(convertRomaji('o-kina')).toBe('おーきな'); });
  it('su-pa- → すーぱー', () => { expect(convertRomaji('su-pa-')).toBe('すーぱー'); });
  it('単体 - → ー', () => { expect(convertRomaji('-')).toBe('ー'); });
  it('複数の - も変換される', () => { expect(convertRomaji('a-i-u-')).toBe('あーいーうー'); });
});

// =====================
// parseSegments
// =====================
describe('parseSegments', () => {
  it('{} なし・skipWords なしのとき単一の変換セグメントになる', () => {
    const segs = parseSegments('hello', []);
    expect(segs).toEqual([{ text: 'hello', skip: false }]);
  });
  it('{} でスキップセグメントが作られる', () => {
    const segs = parseSegments('{World}', []);
    expect(segs).toEqual([{ text: 'World', skip: true }]);
  });
  it('skipWord でスキップセグメントが作られる', () => {
    const segs = parseSegments('hello world', ['world']);
    expect(segs.find(s => s.text.toLowerCase() === 'world')?.skip).toBe(true);
  });
});
// =====================
// groupLines
// =====================
describe('groupLines', () => {
  it('n=1 のとき各行の間に空行が入る', () => {
    expect(groupLines('あ\nい\nう', 1)).toBe('あ\n\nい\n\nう');
  });
  it('n=2 のとき2行ごとに空行が入る', () => {
    expect(groupLines('あ\nい\nう\nえ\nお', 2)).toBe('あ\nい\n\nう\nえ\n\nお');
  });
  it('n=3 のとき3行ごとに空行が入る', () => {
    expect(groupLines('a\nb\nc\nd\ne\nf', 3)).toBe('a\nb\nc\n\nd\ne\nf');
  });
  it('グループがちょうど割り切れる場合', () => {
    expect(groupLines('a\nb\nc\nd', 2)).toBe('a\nb\n\nc\nd');
  });
  it('n=0 のとき変換しない', () => {
    expect(groupLines('あ\nい', 0)).toBe('あ\nい');
  });
  it('行が1行しかない場合はそのまま', () => {
    expect(groupLines('あ', 2)).toBe('あ');
  });
  it('空文字は空文字を返す', () => {
    expect(groupLines('', 2)).toBe('');
  });
});

// =====================
// 小文字かな（l/x プレフィックス）
// =====================
describe('小文字かなの変換', () => {
  it('la → ぁ', () => { expect(convertRomaji('la')).toBe('ぁ'); });
  it('li → ぃ', () => { expect(convertRomaji('li')).toBe('ぃ'); });
  it('lu → ぅ', () => { expect(convertRomaji('lu')).toBe('ぅ'); });
  it('le → ぇ', () => { expect(convertRomaji('le')).toBe('ぇ'); });
  it('lo → ぉ', () => { expect(convertRomaji('lo')).toBe('ぉ'); });
  it('xa → ぁ', () => { expect(convertRomaji('xa')).toBe('ぁ'); });
  it('xi → ぃ', () => { expect(convertRomaji('xi')).toBe('ぃ'); });
  it('xu → ぅ', () => { expect(convertRomaji('xu')).toBe('ぅ'); });
  it('xe → ぇ', () => { expect(convertRomaji('xe')).toBe('ぇ'); });
  it('xo → ぉ', () => { expect(convertRomaji('xo')).toBe('ぉ'); });
  it('lya → ゃ', () => { expect(convertRomaji('lya')).toBe('ゃ'); });
  it('lyu → ゅ', () => { expect(convertRomaji('lyu')).toBe('ゅ'); });
  it('lyo → ょ', () => { expect(convertRomaji('lyo')).toBe('ょ'); });
  it('xya → ゃ', () => { expect(convertRomaji('xya')).toBe('ゃ'); });
  it('xyu → ゅ', () => { expect(convertRomaji('xyu')).toBe('ゅ'); });
  it('xyo → ょ', () => { expect(convertRomaji('xyo')).toBe('ょ'); });
  it('ltu → っ', () => { expect(convertRomaji('ltu')).toBe('っ'); });
  it('xtu → っ', () => { expect(convertRomaji('xtu')).toBe('っ'); });
  it('ltsu → っ', () => { expect(convertRomaji('ltsu')).toBe('っ'); });
  it('xtsu → っ', () => { expect(convertRomaji('xtsu')).toBe('っ'); });
  it('文中でも使える（tela → てぁ）', () => { expect(convertRomaji('tela')).toBe('てぁ'); });
  it('きゃ → ki+ya でなく kya で変換される', () => { expect(convertRomaji('kya')).toBe('きゃ'); });
});

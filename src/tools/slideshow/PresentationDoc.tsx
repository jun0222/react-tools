import { Document, Page, View, Text, StyleSheet, Font } from '@react-pdf/renderer';
import type { SlideshowData, Slide } from './slideshowCore';

// 日本語フォント登録
// jsDelivr 経由で Noto Sans JP を使用。オフライン環境では文字化けする場合がある。
Font.register({
  family: 'NotoSansJP',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-jp@5/files/noto-sans-jp-japanese-400-normal.woff2',
      fontWeight: 'normal',
    },
    {
      src: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-jp@5/files/noto-sans-jp-japanese-700-normal.woff2',
      fontWeight: 'bold',
    },
  ],
});

// ハイフネーション無効化（日本語には不要）
Font.registerHyphenationCallback(word => [word]);

// ---- 定数 ----
const ACCENT = '#7c3aed';
const DARK   = '#1e1b4b';
const TEXT   = '#374151';
const MUTED  = '#9ca3af';
const TITLE_BG  = '#12082a';
const TITLE_FG  = '#f5f3ff';
const ACCENT_FG = '#c4b5fd';

// ---- スタイル ----
const s = StyleSheet.create({
  // 共通
  page: {
    fontFamily: 'NotoSansJP',
    backgroundColor: '#ffffff',
  },
  pageNum: {
    position: 'absolute',
    bottom: 14,
    right: 24,
    fontSize: 9,
    color: MUTED,
  },

  // ---- タイトルスライド ----
  titlePage: {
    backgroundColor: TITLE_BG,
  },
  titleBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 80,
    paddingVertical: 60,
  },
  titleText: {
    fontSize: 44,
    fontWeight: 'bold',
    color: TITLE_FG,
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 1.4,
  },
  titleSep: {
    width: 64,
    height: 3,
    backgroundColor: ACCENT,
    marginBottom: 18,
  },
  subtitleText: {
    fontSize: 20,
    color: ACCENT_FG,
    textAlign: 'center',
    lineHeight: 1.5,
  },

  // ---- セクションスライド ----
  sectionBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 80,
  },
  sectionLine: {
    width: '50%',
    height: 2,
    backgroundColor: ACCENT,
    marginVertical: 14,
  },
  sectionText: {
    fontSize: 34,
    fontWeight: 'bold',
    color: DARK,
    textAlign: 'center',
    lineHeight: 1.4,
  },

  // ---- コンテンツ / 2カラム 共通ヘッダー ----
  topBar: {
    height: 5,
    backgroundColor: ACCENT,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 52,
    paddingTop: 32,
    paddingBottom: 28,
  },
  slideTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: DARK,
    marginBottom: 10,
    lineHeight: 1.35,
  },
  slideSep: {
    height: 2,
    backgroundColor: ACCENT,
    marginBottom: 20,
    opacity: 0.35,
  },

  // ---- コンテンツ ----
  bodyText: {
    fontSize: 16,
    color: TEXT,
    lineHeight: 1.8,
  },

  // ---- 2カラム ----
  twoColRow: {
    flexDirection: 'row',
    flex: 1,
    gap: 0,
  },
  colLeft: {
    flex: 1,
    paddingRight: 20,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  colRight: {
    flex: 1,
    paddingLeft: 20,
  },
  colLabel: {
    fontSize: 10,
    color: ACCENT,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

// ---- ページ番号 ----
const PageNum = ({ index, total }: { index: number; total: number }) => (
  <Text style={s.pageNum}>{index + 1} / {total}</Text>
);

// ---- 各スライドページ ----
const SlideContent = ({ slide, index, total }: { slide: Slide; index: number; total: number }) => {
  const num = <PageNum index={index} total={total} />;

  if (slide.layout === 'title') {
    return (
      <Page size={[960, 540]} style={[s.page, s.titlePage]}>
        <View style={s.titleBody}>
          <Text style={s.titleText}>{slide.title || 'タイトル'}</Text>
          <View style={s.titleSep} />
          {slide.body ? <Text style={s.subtitleText}>{slide.body}</Text> : null}
        </View>
        {num}
      </Page>
    );
  }

  if (slide.layout === 'section') {
    return (
      <Page size={[960, 540]} style={s.page}>
        <View style={s.sectionBody}>
          <View style={s.sectionLine} />
          <Text style={s.sectionText}>{slide.title || 'セクション'}</Text>
          <View style={s.sectionLine} />
        </View>
        {num}
      </Page>
    );
  }

  if (slide.layout === 'content') {
    return (
      <Page size={[960, 540]} style={s.page}>
        <View style={s.topBar} />
        <View style={s.inner}>
          <Text style={s.slideTitle}>{slide.title || 'タイトル'}</Text>
          <View style={s.slideSep} />
          <Text style={s.bodyText}>{slide.body}</Text>
        </View>
        {num}
      </Page>
    );
  }

  if (slide.layout === 'two-col') {
    return (
      <Page size={[960, 540]} style={s.page}>
        <View style={s.topBar} />
        <View style={s.inner}>
          <Text style={s.slideTitle}>{slide.title || 'タイトル'}</Text>
          <View style={s.slideSep} />
          <View style={s.twoColRow}>
            <View style={s.colLeft}>
              <Text style={s.colLabel}>左</Text>
              <Text style={s.bodyText}>{slide.body}</Text>
            </View>
            <View style={s.colRight}>
              <Text style={s.colLabel}>右</Text>
              <Text style={s.bodyText}>{slide.bodyRight}</Text>
            </View>
          </View>
        </View>
        {num}
      </Page>
    );
  }

  // blank
  return (
    <Page size={[960, 540]} style={s.page}>
      {num}
    </Page>
  );
};

// ---- エクスポート ----
export const PresentationDoc = ({ data }: { data: SlideshowData }) => (
  <Document title={data.presentationTitle || 'Presentation'} author="react-tools">
    {data.slides.map((slide, i) => (
      <SlideContent key={slide.id} slide={slide} index={i} total={data.slides.length} />
    ))}
  </Document>
);

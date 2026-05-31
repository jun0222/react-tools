export type CheckItem = {
  id: string;
  label: string;
  reviewCriteria: string;
};

export type CheckSection = {
  id: string;
  groupLabel: string | null;
  items: CheckItem[];
};

export const CHECKLIST: CheckSection[] = [
  {
    id: 'top',
    groupLabel: null,
    items: [
      {
        id: 'fishbone',
        label: 'フィッシュボーンで抽象具体をメインに整理。読む順番も意識。',
        reviewCriteria: '抽象と具体の対応が整理されているか。読む順序として抽象→具体の流れになっているか',
      },
      {
        id: 'abstract-order',
        label: '話の順番を概念が大きい順番、抽象的なものの降順に並べ、概観から詳細へ進める。',
        reviewCriteria: '話の順番が概念の大きい順（抽象度の高い順）になっているか。概観から詳細へ自然に進めているか',
      },
      {
        id: 'mogi',
        label: '文章のアウトライン・本文は茂木型の文章構造に。前のセクションで次セクションの抽象的な知識を読者に与え、次セクションでは前セクションの抽象を拾って具体化する、それを繰り返す構成。',
        reviewCriteria: '前のセクションで次セクションの抽象的な概念を予告し、次セクションでその抽象を具体化する構造になっているか',
      },
    ],
  },
  {
    id: 'adjust',
    groupLabel: '調整する',
    items: [
      {
        id: 'short-para',
        label: 'パラグラフを短く',
        reviewCriteria: '1段落が複数のトピックを詰め込んでいないか。長すぎるパラグラフがないか',
      },
      {
        id: 'direct',
        label: '持って回った言い方（することができる等）を消す、言い切る',
        reviewCriteria: '「〜することができる」「〜ではないだろうか」など持って回った言い方になっている箇所はないか',
      },
      {
        id: 'active',
        label: '能動態にする',
        reviewCriteria: '受動態（〜される、〜られる）になっている箇所はないか',
      },
      {
        id: 'reread',
        label: '読み返す',
        reviewCriteria: '通読して不自然な流れ・冗長な箇所・唐突な展開がないか',
      },
      {
        id: 'no-demonstrative',
        label: '指示語をなくす（話の構成で自明に、くどくても毎回書く）',
        reviewCriteria: '「これ」「それ」「この」「その」などの指示語が使われていないか。何を指すか一瞬でも考えさせる箇所はないか',
      },
      {
        id: 'notation',
        label: '表記揺れをなくす',
        reviewCriteria: '同じ概念・単語が漢字・かな・カタカナなど複数の表記で混在していないか',
      },
      {
        id: 'fact-opinion',
        label: '事実と意見を分ける',
        reviewCriteria: '事実と意見・推測・評価が混在していないか。意見を事実のように書いている箇所はないか',
      },
      {
        id: 'fact-check',
        label: '事実の調査、裏どり',
        reviewCriteria: '出典・根拠が不明、または誤っている可能性がある事実記述はないか',
      },
    ],
  },
];

export type InsightItem = {
  id: string;
  label: string;
  instruction: string;
};

export type InsightSection = {
  id: string;
  groupLabel: string | null;
  items: InsightItem[];
};

export const INSIGHT_SECTIONS: InsightSection[] = [
  {
    id: 'concrete',
    groupLabel: '具体的かつ本質的な洞察に迫る',
    items: [
      {
        id: 'other-view',
        label: '別の視点',
        instruction: '異なる立場・角度（反対意見、第三者の視点、歴史的視点、業界外の視点など）から見るとどう解釈が変わるかを示す',
      },
      {
        id: 'why',
        label: 'なぜ？',
        instruction: '表面的な事象の背景にある根本原因・動機・構造的要因を「なぜ？」を繰り返して掘り下げる',
      },
      {
        id: 'simulate',
        label: 'シミュレーションしてみる',
        instruction: '具体的なシナリオを設定し、実際にどう展開するか・別の選択をした場合どうなるかを具体的にシミュレートする',
      },
    ],
  },
  {
    id: 'iceberg',
    groupLabel: '氷山の一角',
    items: [
      {
        id: 'hidden-input',
        label: 'アウトプットしないインプットの多さ',
        instruction: '表面に出ていない前提・暗黙知・背景にある膨大なインプットを明示し、見えていない部分の大きさを示す',
      },
      {
        id: 'connections',
        label: '知識と知識の繋がり',
        instruction: '一見無関係な分野・概念・事象と結びつけ、共通するパターンや構造・法則を示す',
      },
      {
        id: 'universal',
        label: '普遍的なもの',
        instruction: '時代・文化・文脈を超えて共通する本質・原理を抽出する。なぜそれが普遍的なのかも説明する',
      },
      {
        id: 'moderation',
        label: '極論ではなく中庸',
        instruction: '両極端の立場を避け、実態に即した複雑で中間的な見方を示す。単純化が何を失わせているかを明示する',
      },
      {
        id: 'experience-depth',
        label: '体験の濃さ',
        instruction: 'ネットで見た情報・本・一次情報・直接経験・複数の経験を統合した普遍性の洞察、という深さの段階を意識し、どの深さの知識から語れるかを示す',
      },
      {
        id: 'foresight',
        label: '予見性を加える',
        instruction: '現状の分析から将来の展開・兆候・見えていないリスクや機会を予測する。何が変化の引き金になるかを示す',
      },
    ],
  },
  {
    id: 'past',
    groupLabel: null,
    items: [
      {
        id: 'why-past',
        label: '過去への「なぜ？」',
        instruction: '予見性の反対として、気になる過去の出来事・選択・結果について「なぜそうなったのか」を深く問い直し、当時の文脈・制約・判断を掘り下げる',
      },
    ],
  },
];

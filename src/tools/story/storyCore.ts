export type TemplateId = 'three-act' | 'kishotenketsu' | 'heros-journey';

export interface Template {
  id: TemplateId;
  name: string;
  structure: string;
}

export const TEMPLATES: Template[] = [
  {
    id: 'three-act',
    name: '三幕構成',
    structure: `第一幕（設定）: 世界観・登場人物・状況を提示してください
第二幕（対立）: 主人公が直面する困難・葛藤を描いてください
第三幕（解決）: 対立が解消され、結末を迎える様子を描いてください`,
  },
  {
    id: 'kishotenketsu',
    name: '起承転結',
    structure: `起：物語の導入。舞台と登場人物を紹介してください
承：出来事が展開し、状況が深まっていく様子を描いてください
転：予想外の転換・視点の変化を描いてください
結：物語の結末・まとめを描いてください`,
  },
  {
    id: 'heros-journey',
    name: 'ヒーローズ・ジャーニー',
    structure: `日常世界: 主人公の平凡な日常を描いてください
冒険への誘い: 主人公に非日常への呼びかけが訪れる様子を描いてください
試練: 主人公が困難や敵対者に立ち向かう様子を描いてください
変容: 試練を通じて主人公が変化・成長する様子を描いてください
帰還: 主人公が日常世界へ戻り、得たものを携えている様子を描いてください`,
  },
];

const findTemplate = (id: TemplateId): Template =>
  TEMPLATES.find(t => t.id === id) ?? TEMPLATES[0];

export const buildPrompt = (fragments: string, templateId: TemplateId, learningMode: boolean): string => {
  const f = fragments.trim();
  if (!f) return '（設定の断片を入力してください）';

  const template = findTemplate(templateId);

  const learningSection = learningMode
    ? `\n\n【学習モード】
断片の知識を、登場人物の成長や出来事に見立てて物語化し、記憶に定着しやすくしてください。物語の最後に、本質的なポイントを箇条書きでまとめてください。`
    : '';

  return `以下の断片的な設定をもとに、${template.name}の構成で物語を描いてください。

【設定の断片】
${f}

【構成】
${template.structure}${learningSection}`;
};

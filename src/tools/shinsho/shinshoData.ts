export type Label = {
  id: string;
  name: string;
  publisher: string;
  star?: boolean;
};

export type Genre = {
  id: string;
  name: string;
  labels: Label[];
};

export const GENRES: Genre[] = [
  {
    id: 'top3',
    name: '3大新書',
    labels: [
      { id: 'iwanami', name: '岩波新書', publisher: '岩波書店', star: true },
      { id: 'chuko', name: '中公新書', publisher: '中央公論新社', star: true },
      { id: 'kodansha-gendai', name: '講談社現代新書', publisher: '講談社', star: true },
    ],
  },
    {
        id: 'junior-top',
        name: 'ジュニア・別格（岩波・ちくま系）',
        labels: [
            { id: 'chikuma-prima', name: 'ちくまプリマー新書', publisher: '筑摩書房', star: true },
            { id: 'iwanami-junior', name: '岩波ジュニア新書', publisher: '岩波書店', star: true },
            { id: 'iwanami-shonen', name: '岩波少年文庫', publisher: '岩波書店', star: true },
        ],
    },
  {
    id: 'science',
    name: 'サイエンス・テクノロジー系',
    labels: [
      { id: 'bluebacks', name: 'ブルーバックス', publisher: '講談社', star: true },
      { id: 'oreilly', name: "O'Reilly", publisher: "O'Reilly Media" },
      { id: 'science-eye', name: 'サイエンス・アイ新書', publisher: 'SBクリエイティブ' },
    ],
  },
  {
    id: 'edge',
    name: 'エッジ・教養カルチャー系',
    labels: [
      { id: 'chikuma-sensho', name: '筑摩選書', publisher: '筑摩書房', star: true },
      { id: 'hayakawa', name: 'ハヤカワ新書', publisher: '早川書房' },
      { id: 'seikaisha', name: '星海社新書', publisher: '星海社' },
    ],
  },
  {
    id: 'classic',
    name: '古典・学術系',
    labels: [
      { id: 'chikuma-gakugei', name: 'ちくま学芸文庫', publisher: '筑摩書房' },
      { id: 'kodansha-gakujutsu', name: '講談社学術文庫', publisher: '講談社' },
      { id: 'heibonsha-library', name: '平凡社ライブラリー', publisher: '平凡社' },
      { id: 'kobunsha-koten', name: '光文社古典新訳文庫', publisher: '光文社' },
    ],
  },
  {
    id: 'middle',
    name: '中堅・洗練系',
    labels: [
      { id: 'chikuma', name: 'ちくま新書', publisher: '筑摩書房', star: true },
      { id: 'shinchosha', name: '新潮新書', publisher: '新潮社', star: true },
      { id: 'bunshun', name: '文春新書', publisher: '文藝春秋', star: true },
      { id: 'shueisha', name: '集英社新書', publisher: '集英社', star: true },
      { id: 'heibonsha', name: '平凡社新書', publisher: '平凡社', star: true },
    ],
  },
  {
    id: 'junior-other',
    name: 'ジュニア・エッジ系',
    labels: [
      { id: '14sai', name: '14歳の世渡り術', publisher: '河出書房新社' },
      { id: 'yorimichi', name: 'よりみちパン!セ', publisher: '新曜社' },
      { id: 'fukuinkan', name: '福音館文庫', publisher: '福音館書店' },
    ],
  },
];

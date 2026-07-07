export interface CannedTemplate {
  name: string;
  text: string;
}

export const TEMPLATES: CannedTemplate[] = [
  {
    name: 'grill-me',
    text: `この計画のあらゆる側面について、私たちが共通の認識に達するまで、徹底的に私に質問を投げかけてください。
設計のツリーを枝分かれの先まで一つひとつたどり、決定事項間の依存関係を順番に解決していきましょう。
各質問に対し、あなたの推奨する回答も併せて提示してください。

質問は一度に一つずつお願いします。

もしコードベースを探索することで答えが得られる質問であれば、質問する代わりにコードベースを調査してください。`,
  },
];

export const findTemplate = (name: string): CannedTemplate | undefined =>
  TEMPLATES.find(t => t.name === name);

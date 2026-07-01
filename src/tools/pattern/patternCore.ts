export type Lang = 'ja' | 'en';

export const buildPrompt = (word: string, lang: Lang): string => {
  const w = word.trim();
  if (!w) return '（デザインパターン名を入力してください）';

  if (lang === 'ja') {
    return `デザインパターン「${w}」について以下を教えてください。

【概要・適用場面】
このパターンが解決する問題と、適用すべき状況を簡潔に説明してください。

【PHPシンプル実装】
業務を想定した、できるだけシンプルなPHP実装例を示してください。以下の条件を守ってください：
- <?php タグから始まる、PHPPlayground（onlinephp.io など）でそのまま実行できる完全なコード
- 業務シナリオ（注文処理・ユーザー管理・通知送信など）を題材にする
- クラス・インターフェース・処理を必要最小限にとどめ、コメントを付けて読みやすくする

【実装の説明】
コードの各パートが何をしているか、なぜその設計になっているかを説明してください。

【関連パターンとの比較】
「${w}」に関連するパターン（似たもの・補完的なもの・混同しやすいもの）があれば、それぞれとの違いや使い分けを教えてください。`;
  }

  return `Please explain the "${w}" design pattern with the following sections:

[Overview & When to Use]
What problem does "${w}" solve, and in what situations should it be applied?

[PHP Implementation]
Provide a minimal, business-oriented PHP implementation. Requirements:
- Complete code starting with <?php, runnable directly in PHPPlayground (onlinephp.io etc.)
- Use a realistic business scenario (order processing, user management, notifications, etc.)
- Keep classes, interfaces and logic to the bare minimum; add comments for clarity

[Implementation Explanation]
Explain what each part of the code does and why it's designed that way.

[Related Patterns]
If there are patterns related to "${w}" (similar, complementary, or easily confused), explain the differences and when to choose each.`;
};
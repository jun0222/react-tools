export type Lang = 'ja' | 'en';

export const buildPrompt = (word: string, lang: Lang): string => {
  const w = word.trim();
  if (!w) return '（概念・単語を入力してください）';

  if (lang === 'ja') {
    return `「${w}」を、暗記ではなく深い理解として習得するために、以下の観点で教えてください。

【本質・仕組み】
「${w}」はなぜそのように動くのか、根本的なメカニズムを説明してください。表面的な「何か」ではなく「なぜそうなるのか」に焦点を当ててください。

【直感的なアナロジー】
「${w}」を身近な体験・現象・物に例えると、何に一番似ていますか？できるだけ具体的に。

【具体例】
「${w}」が実際に使われるコード例と、身近な状況・シーンでの具体例をそれぞれ挙げてください。

【対義語・類語】
「${w}」の対義語（反対の概念）と類語（似ている概念）をそれぞれ挙げ、何がどう違うのかを説明してください。

【ゼロからの再導出】
「${w}」を完全に忘れても、論理的な考え方のスジから再導出できるようにしてください。どんな問題意識や必要性から生まれたかも含めてください。

【暗記しなくていい理由】
「${w}」のどの部分は「暗記」ではなく「理解」として長期記憶できますか？逆に、覚えるとしたら最小限の何ですか？`;
  }

  return `Help me deeply understand "${w}" through insight — not memorization.

[Core Mechanism]
Why does "${w}" work the way it does? Focus on the fundamental "why", not just the "what".

[Intuitive Analogy]
What everyday experience, phenomenon, or object is "${w}" most similar to? Be as concrete as possible.

[Concrete Examples]
Give a code example where "${w}" is actually used, along with a concrete example from an everyday situation or scene.

[Antonyms and Synonyms]
List antonyms (opposite concepts) and synonyms (similar concepts) of "${w}", and explain how each differs from it.

[First Principles Derivation]
If I completely forgot "${w}", how could I re-derive it from first principles? What problem or need gave rise to it?

[What NOT to Memorize]
Which parts of "${w}" can be retained through deep understanding rather than rote memorization? What is the absolute minimum worth remembering?`;
};
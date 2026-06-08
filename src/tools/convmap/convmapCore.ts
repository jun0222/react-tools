export interface ConvMessage {
  role: 'user' | 'llm';
  text: string;
}

export const parseMessages = (text: string, passphrase: string): ConvMessage[] => {
  if (!text.trim()) return [];
  const pp = passphrase.trim();
  const blocks = text.split(/\n{2,}/);
  const msgs: ConvMessage[] = [];
  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    if (pp && trimmed.startsWith(pp)) {
      msgs.push({ role: 'llm', text: trimmed.slice(pp.length).trimStart() });
    } else {
      if (msgs.length > 0 && msgs[msgs.length - 1].role === 'user') {
        msgs[msgs.length - 1] = { role: 'user', text: msgs[msgs.length - 1].text + '\n\n' + trimmed };
      } else {
        msgs.push({ role: 'user', text: trimmed });
      }
    }
  }
  return msgs;
};

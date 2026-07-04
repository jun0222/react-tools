import { Terminal } from 'lucide-react';
import PromptTool from '../_shared/PromptTool';
import { buildPrompt } from './shellyCore';

const Shelly = () => (
  <PromptTool
    name="Shelly"
    icon={<Terminal size={20} color="white" />}
    iconBg="linear-gradient(135deg, #334155, #0f172a)"
    accent="#22c55e"
    storageKey="shelly-hint"
    placeholder="やりたいことのヒント（任意）を入力…"
    buildPrompt={buildPrompt}
    requireWord={false}
  />
);

export default Shelly;
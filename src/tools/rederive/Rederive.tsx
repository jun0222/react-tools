import { GitFork } from 'lucide-react';
import PromptTool from '../_shared/PromptTool';
import { buildPrompt } from './rederiveCore';

const Rederive = () => (
  <PromptTool
    name="Rederive"
    icon={<GitFork size={20} color="white" />}
    iconBg="linear-gradient(135deg, #14b8a6, #0891b2)"
    accent="#14b8a6"
    storageKey="rederive-word"
    placeholder="概念・単語を入力…"
    buildPrompt={buildPrompt}
  />
);

export default Rederive;

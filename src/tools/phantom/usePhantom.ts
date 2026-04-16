import { useState, useMemo } from 'react';
import {
  uid,
  processPhantom,
  CHAR_PRESETS,
  copyText,
} from './phantom';
import type { ReplacePair, RandomRule } from './phantom';

export type TabMode = 'replace' | 'random';

export function usePhantom() {
  const [inputText, setInputText] = useState('');
  const [pairs, setPairs] = useState<ReplacePair[]>([
    { id: uid(), from: '', to: '', enabled: true },
  ]);
  const [rules, setRules] = useState<RandomRule[]>([]);
  const [tab, setTab] = useState<TabMode>('replace');
  // Fixed seed derived from current session; users see consistent results while
  // the page is open. We use a constant here since the component mounts once.
  const seed = useMemo(() => Date.now(), []);

  const output = useMemo(
    () => processPhantom(inputText, pairs, rules, seed),
    [inputText, pairs, rules, seed],
  );

  // ---- Replace pairs ----
  const addPair = () =>
    setPairs(prev => [...prev, { id: uid(), from: '', to: '', enabled: true }]);

  const updatePair = (id: string, field: 'from' | 'to', value: string) =>
    setPairs(prev => prev.map(p => (p.id === id ? { ...p, [field]: value } : p)));

  const deletePair = (id: string) =>
    setPairs(prev => prev.filter(p => p.id !== id));

  // ---- Random rules ----
  const addRule = () =>
    setRules(prev => [...prev, { id: uid(), targetChars: '', charSet: '', enabled: true }]);

  const updateRule = (id: string, field: 'targetChars' | 'charSet', value: string) =>
    setRules(prev => prev.map(r => (r.id === id ? { ...r, [field]: value } : r)));

  const deleteRule = (id: string) =>
    setRules(prev => prev.filter(r => r.id !== id));

  const applyPreset = (id: string, chars: string) =>
    setRules(prev => prev.map(r => (r.id === id ? { ...r, charSet: chars } : r)));

  const handleCopy = () => copyText(output);

  return {
    inputText, setInputText,
    pairs, addPair, updatePair, deletePair,
    rules, addRule, updateRule, deleteRule, applyPreset,
    tab, setTab,
    output,
    handleCopy,
    presets: CHAR_PRESETS,
  };
}
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { MetaProvider, useMeta } from './MetaContext';

describe('MetaContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MetaProvider>{children}</MetaProvider>
  );

  beforeEach(() => {
    document.title = '';
    const existing = document.querySelector('meta[name="description"]');
    if (existing) existing.remove();
  });

  describe('初期状態', () => {
    it('title が空文字である', () => {
      const { result } = renderHook(() => useMeta(), { wrapper });
      expect(result.current.title).toBe('');
    });

    it('description が空文字である', () => {
      const { result } = renderHook(() => useMeta(), { wrapper });
      expect(result.current.description).toBe('');
    });
  });

  describe('setMeta', () => {
    it('document.title が更新される', () => {
      const { result } = renderHook(() => useMeta(), { wrapper });
      act(() => {
        result.current.setMeta({ title: 'OneShot ⚡', description: 'テスト' });
      });
      expect(document.title).toBe('OneShot ⚡');
    });

    it('meta[name="description"] の content が更新される', () => {
      const { result } = renderHook(() => useMeta(), { wrapper });
      act(() => {
        result.current.setMeta({ title: 'Phantom', description: 'テキストマスクツール' });
      });
      const meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      expect(meta?.content).toBe('テキストマスクツール');
    });

    it('context の title / description が更新される', () => {
      const { result } = renderHook(() => useMeta(), { wrapper });
      act(() => {
        result.current.setMeta({ title: 'react-tools', description: 'ツール集' });
      });
      expect(result.current.title).toBe('react-tools');
      expect(result.current.description).toBe('ツール集');
    });

    it('連続して setMeta を呼ぶと最後の値が反映される', () => {
      const { result } = renderHook(() => useMeta(), { wrapper });
      act(() => {
        result.current.setMeta({ title: 'First', description: 'first desc' });
        result.current.setMeta({ title: 'Second', description: 'second desc' });
      });
      expect(document.title).toBe('Second');
      expect(result.current.title).toBe('Second');
    });
  });
});
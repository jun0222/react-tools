import { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface MetaValue {
  title: string;
  description: string;
}

interface MetaContextValue extends MetaValue {
  setMeta: (meta: MetaValue) => void;
}

const MetaContext = createContext<MetaContextValue>({
  title: '',
  description: '',
  setMeta: () => {},
});

export const MetaProvider = ({ children }: { children: React.ReactNode }) => {
  const [meta, setMetaState] = useState<MetaValue>({ title: '', description: '' });

  useEffect(() => {
    if (meta.title) {
      document.title = meta.title;
    }
    let el = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement('meta');
      el.name = 'description';
      document.head.appendChild(el);
    }
    el.content = meta.description;
  }, [meta]);

  const setMeta = useCallback((next: MetaValue) => {
    setMetaState(next);
  }, []);

  return (
    <MetaContext.Provider value={{ ...meta, setMeta }}>
      {children}
    </MetaContext.Provider>
  );
};

export const useMeta = () => useContext(MetaContext);

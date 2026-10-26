import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Toast } from '../components/ui/Toast/Toast';
import { ToastContext } from './ToastContextDefinition'; ;
import type { ToastMessage } from './ToastContextDefinition';

interface ActiveToast extends ToastMessage {
  id: number;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ActiveToast | null>(null);
  const nextId = useRef(0);

  const notify = useCallback((message: ToastMessage) => {
    nextId.current += 1;
    setToast({ ...message, id: nextId.current });
  }, []);

  const dismiss = useCallback(() => setToast(null), []);

  useEffect(() => {
    if (!toast || toast.type === 'error') return;
    const timer = window.setTimeout(dismiss, toast.durationMs ?? (toast.action ? 10000 : 5000));
    return () => window.clearTimeout(timer);
  }, [toast, dismiss]);

  const value = useMemo(() => ({ notify, dismiss }), [notify, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && <Toast key={toast.id} message={toast} onClose={dismiss} />}
    </ToastContext.Provider>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Toast } from '../components/ui/Toast/Toast';
import { ToastContext } from './ToastContextDefinition';
import type { ToastMessage } from './ToastContextDefinition';

interface ActiveToast extends ToastMessage {
  id: number;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ActiveToast | null>(null);

  const notify = useCallback((message: ToastMessage) => {
    setToast((previous) => ({ ...message, id: (previous?.id ?? 0) + 1 }));
  }, []);

  const dismiss = useCallback(() => setToast(null), []);

  useEffect(() => {
    if (!toast || toast.type === 'error') return;
    const timer = window.setTimeout(dismiss, 5000);
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

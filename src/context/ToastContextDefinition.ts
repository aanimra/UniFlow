import { createContext } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  type: ToastType;
  title: string;
  description?: string;
}

export interface ToastContextValue {
  notify: (message: ToastMessage) => void;
  dismiss: () => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

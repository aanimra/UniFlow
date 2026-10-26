import { useContext } from 'react';
import { ToastContext } from '../context/ToastContextDefinition';

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) {
    throw new Error('useToast має використовуватися всередині ToastProvider');
  }
  return value;
}

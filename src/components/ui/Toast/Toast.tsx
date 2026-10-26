import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import type { ToastMessage } from '../../../context/ToastContextDefinition';
import './Toast.css';

interface ToastProps {
  message: ToastMessage;
  onClose: () => void;
}

export function Toast({ message, onClose }: ToastProps) {
  const Icon = message.type === 'success'
    ? CheckCircle2
    : message.type === 'error'
      ? AlertCircle
      : Info;

  return (
    <div className="uf-toast-container">
      <div
        className={`uf-toast uf-toast--${message.type}`}
        role={message.type === 'error' ? 'alert' : 'status'}
        aria-atomic="true"
      >
        <Icon size={21} aria-hidden="true" className="uf-toast__icon" />
        <div className="uf-toast__content">
          <strong className="uf-toast__title">{message.title}</strong>
          {message.description && <p className="uf-toast__description">{message.description}</p>}
        </div>
        {message.action && (
          <button
            type="button"
            className="uf-toast__action"
            onClick={() => { onClose(); message.action?.onClick(); }}
          >
            {message.action.label}
          </button>
        )}
        <button type="button" className="uf-toast__close" aria-label="Закрити сповіщення" onClick={onClose}>
          <X size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/**
 * Toast Notification Component
 */
import { createEl } from '../utils/dom.js';

export function renderToast(toastState, dispatch) {
  if (!toastState) return null;

  const { message, type } = toastState;

  const typeConfig = {
    success: { icon: 'check_circle', bg: 'toast--success' },
    error: { icon: 'error', bg: 'toast--error' },
    warning: { icon: 'warning', bg: 'toast--warning' },
    info: { icon: 'info', bg: 'toast--info' },
  }[type] || { icon: 'info', bg: 'toast--info' };

  return createEl('div', { className: `toast ${typeConfig.bg} animate-slide-in` }, [
    createEl('span', { className: 'material-symbols-outlined toast__icon' }, [typeConfig.icon]),
    createEl('span', { className: 'toast__message' }, [message]),
    createEl('button', {
      className: 'toast__close',
      type: 'button',
      onClick: () => dispatch({ type: 'HIDE_TOAST' }),
      'aria-label': 'Close notification',
    }, ['✕']),
  ]);
}

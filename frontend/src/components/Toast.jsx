import { useEffect } from 'react';

/**
 * Notification transitoire générique et réutilisable, affichée en overlay
 * (coin bas-droit), avec disparition automatique.
 *
 * @param {Object} props
 * @param {string} [props.message] - Rien n'est affiché si vide/absent.
 * @param {'success'|'error'} [props.type='success']
 * @param {number} [props.duration=4000] - Délai avant disparition automatique (ms).
 * @param {() => void} props.onDismiss
 */
export default function Toast({ message, type = 'success', duration = 4000, onDismiss }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onDismiss]);

  if (!message) return null;

  const isError = type === 'error';
  const styles = isError ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700';

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${styles}`}
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Fermer la notification"
        className="rounded text-lg leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
      >
        ×
      </button>
    </div>
  );
}

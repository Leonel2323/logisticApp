import { createContext, useCallback, useContext, useState } from 'react';
import Toast from '../components/Toast';

const ToastContext = createContext(null);

/**
 * Fournit `showToast(message, type)` à tout l'arbre de composants, y compris
 * aux hooks React Query (onSuccess/onError de mutation) qui n'ont pas accès à
 * l'état local d'une page. Monté une seule fois à la racine (`App.jsx`), au-dessus
 * du router, pour que le toast reste visible après une redirection.
 */
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  const dismiss = useCallback(() => setToast(null), []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast message={toast?.message} type={toast?.type} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast doit être utilisé à l\'intérieur de ToastProvider.');
  return ctx;
}

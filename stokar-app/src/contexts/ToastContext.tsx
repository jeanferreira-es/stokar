import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { errorMessage } from '@/models/services/http';
import { Toast, type ToastData } from '@/views/components/ui/Toast';

interface ToastContextValue {
  success: (message: string) => void;
  error: (error: unknown) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/** Avisos rápidos no topo da tela (sucesso e erro), disponíveis em qualquer lugar do app. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastData | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = useCallback((data: ToastData) => {
    clearTimeout(timer.current);
    setToast(data);
    timer.current = setTimeout(() => setToast(null), data.tone === 'danger' ? 5000 : 3000);
  }, []);

  const value = useMemo(
    () => ({
      success: (message: string) => show({ message, tone: 'success' }),
      // Aceita o erro bruto: a mensagem vem normalizada da API
      error: (error: unknown) => show({ message: typeof error === 'string' ? error : errorMessage(error), tone: 'danger' }),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast precisa estar dentro de <ToastProvider>');
  return context;
}

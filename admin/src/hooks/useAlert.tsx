import { useState, useCallback } from 'react';
import { AlertDialog } from '@/components/AlertDialog';
import type { AlertType } from '@/components/AlertDialog';

interface AlertState {
  isOpen: boolean;
  type: AlertType;
  title: string;
  message: string;
}

let globalShowAlert: ((type: AlertType, title: string, message: string) => void) | null = null;

export function showAlert(type: AlertType, title: string, message: string) {
  globalShowAlert?.(type, title, message);
}

export function useAlert() {
  const [alert, setAlert] = useState<AlertState>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  });

  const show = useCallback((type: AlertType, title: string, message: string) => {
    setAlert({ isOpen: true, type, title, message });
  }, []);

  const close = useCallback(() => {
    setAlert((prev) => ({ ...prev, isOpen: false }));
  }, []);

  globalShowAlert = show;

  const AlertComponent = (
    <AlertDialog
      isOpen={alert.isOpen}
      type={alert.type}
      title={alert.title}
      message={alert.message}
      onClose={close}
    />
  );

  return { show, close, AlertComponent };
}

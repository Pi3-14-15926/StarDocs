import clsx from 'clsx';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import { useEffect, useRef } from 'react';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertDialogProps {
  isOpen: boolean;
  type?: AlertType;
  title: string;
  message: string;
  onClose: () => void;
}

const ICON_MAP: Record<AlertType, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLOR_MAP: Record<AlertType, string> = {
  success: 'text-green-500 bg-green-100 dark:bg-green-900/30',
  error: 'text-red-500 bg-red-100 dark:bg-red-900/30',
  warning: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30',
  info: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
};

export function AlertDialog({
  isOpen,
  type = 'info',
  title,
  message,
  onClose,
}: AlertDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const Icon = ICON_MAP[type];

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center gap-3">
          <div
            className={clsx(
              'flex h-10 w-10 items-center justify-center rounded-full',
              COLOR_MAP[type],
            )}
          >
            <Icon size={20} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
        </div>
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">
          {message}
        </p>
        <div className="flex justify-end">
          <button onClick={onClose} className="btn-primary">
            确定
          </button>
        </div>
      </div>
    </div>
  );
}

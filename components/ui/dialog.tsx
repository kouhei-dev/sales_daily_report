import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  variant?: 'default' | 'danger';
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  confirmDisabled?: boolean;
}

/**
 * 確認ダイアログコンポーネント
 *
 * モーダルダイアログを表示するためのコンポーネント
 * 削除確認などで使用
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  variant = 'default',
  confirmLabel = '確認',
  cancelLabel = 'キャンセル',
  onConfirm,
  confirmDisabled = false,
}: DialogProps) {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };

    if (open) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50" />

      {/* Dialog */}
      <div
        className={cn(
          'relative z-50 w-full max-w-md rounded-lg bg-white p-6 shadow-lg',
          'animate-in fade-in-0 zoom-in-95'
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby={description ? 'dialog-description' : undefined}
      >
        {/* Title */}
        <h2
          id="dialog-title"
          className={cn(
            'text-lg font-semibold',
            variant === 'danger' ? 'text-red-600' : 'text-gray-900'
          )}
        >
          {title}
        </h2>

        {/* Description */}
        {description && (
          <p id="dialog-description" className="mt-2 text-sm text-gray-600">
            {description}
          </p>
        )}

        {/* Custom content */}
        {children && <div className="mt-4">{children}</div>}

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            {cancelLabel}
          </Button>
          {onConfirm && (
            <Button
              type="button"
              variant={variant === 'danger' ? 'danger' : 'primary'}
              onClick={onConfirm}
              disabled={confirmDisabled}
            >
              {confirmLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

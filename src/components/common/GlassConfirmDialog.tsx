import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { GlassModal } from './GlassModal';
import { GlassButton } from './GlassButton';

export interface GlassConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const GlassConfirmDialog: React.FC<GlassConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'تایید و اجرا',
  cancelText = 'انصراف',
  variant = 'danger',
  loading = false,
  icon,
}) => {
  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="sm"
      icon={
        icon || (
          variant === 'danger' ? (
            <ShieldAlert className="w-5 h-5 text-rose-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          )
        )
      }
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </GlassButton>
          <GlassButton
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </GlassButton>
        </div>
      }
    >
      <div className="text-xs sm:text-sm text-[var(--gym-text-secondary,#d1d5db)] leading-relaxed">
        {description}
      </div>
    </GlassModal>
  );
};

import Modal from './Modal';
import Button from './Button';
import { AlertCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  isConfirming?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Xác nhận hành động',
  message = 'Bạn có chắc chắn muốn thực hiện hành động này? Thao tác này không thể phục hồi.',
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  isConfirming = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-2">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div>
          <h4 className="font-bold text-slate-900 text-sm">{title}</h4>
          <p className="text-3xs text-slate-400 mt-1 max-w-xs leading-normal">
            {message}
          </p>
        </div>
        
        <div className="flex gap-3.5 w-full mt-4 justify-center">
          <Button
            variant="outline"
            onClick={onClose}
            className="py-2 px-5 text-xs font-bold"
          >
            {cancelText}
          </Button>
          <Button
            variant="danger"
            isLoading={isConfirming}
            onClick={onConfirm}
            className="py-2 px-5 text-xs font-bold"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

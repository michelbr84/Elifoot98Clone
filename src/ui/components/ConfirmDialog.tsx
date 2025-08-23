interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'CONFIRMAR',
  cancelText = 'CANCELAR',
  onConfirm,
  onCancel,
  danger = false
}: ConfirmDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-4 border-black max-w-md w-full p-6">
        <h3 className="text-xl font-bold mb-4 font-mono">{title}</h3>
        <p className="mb-6">{message}</p>
        
        <div className="flex gap-2">
          <button
            className={danger ? "btn-danger flex-1" : "btn-primary flex-1"}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
          <button
            className="btn-retro flex-1"
            onClick={onCancel}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  )
}